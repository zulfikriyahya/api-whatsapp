# Production Deployment & Operations Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

```bash
# Required Environment Variables (Production)
MARIADB_HOST=your-db-host
MARIADB_PORT=3306
MARIADB_USER=app_user
MARIADB_PASSWORD=<secure-password>
MARIADB_DATABASE=whatsapp_production

NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

CRON_SECRET=<generate-with-openssl-rand-hex-32>

RATE_LIMIT_PER_MINUTE=20
RATE_LIMIT_PER_HOUR=500
RATE_LIMIT_PER_DAY=10000

MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000

LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true

SESSION_TIMEOUT_MS=1800000
DB_CONNECTION_LIMIT=20

# Optional but Recommended
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<smtp-password>

REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://xxx@sentry.io/xxx
ENABLE_SENTRY=true
```

### 2. Security Hardening

**Generate Secure Secrets:**

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32

# Database Password
openssl rand -base64 24
```

**Database Security:**

```sql
-- Create dedicated application user
CREATE USER 'app_user'@'%' IDENTIFIED BY '<secure-password>';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_production.* TO 'app_user'@'%';

-- Revoke dangerous permissions
REVOKE FILE, SUPER, PROCESS ON *.* FROM 'app_user'@'%';

FLUSH PRIVILEGES;
```

**Firewall Rules:**

```bash
# Allow only necessary ports
ufw allow 443/tcp    # HTTPS
ufw allow 22/tcp     # SSH (restrict to specific IPs)
ufw deny 3306/tcp    # Block external DB access
ufw enable
```

### 3. Database Optimization

**Indexes:**

```sql
-- Add composite indexes for common queries
CREATE INDEX idx_messages_user_device_created
  ON messages(user_id, device_id, created_at);

CREATE INDEX idx_messages_device_status_retry
  ON messages(device_id, status, retry_count);

CREATE INDEX idx_queue_status_priority_scheduled
  ON message_queue(status, priority DESC, scheduled_at);

-- Analyze tables
ANALYZE TABLE messages, devices, contacts, message_queue;
```

**Performance Tuning:**

```ini
# /etc/mysql/my.cnf
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_size = 0
query_cache_type = 0
```

## Deployment Process

### 1. Build & Deploy

**Docker Deployment:**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build & Start:**

```bash
docker build -t whatsapp-dashboard:latest .
docker run -d \
  --name whatsapp-app \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  whatsapp-dashboard:latest
```

### 2. Database Migrations

```bash
# Run migrations
npm run migrate

# Verify schema
npm run migrate:verify

# Rollback if needed
npm run migrate:rollback
```

### 3. Health Check Verification

```bash
# Basic health check
curl -I https://yourdomain.com/api/health

# Detailed health status
curl https://yourdomain.com/api/health | jq

# Expected Response:
{
  "status": "healthy",
  "services": {
    "database": { "status": "up" },
    "messageQueue": { "status": "up" },
    "whatsappClients": { "status": "up" }
  }
}
```

## Monitoring & Alerting

### 1. Health Monitoring

**Uptime Monitoring:**

```bash
# Add to monitoring service (Uptime Robot, Pingdom, etc.)
URL: https://yourdomain.com/api/health
Method: HEAD
Interval: 1 minute
Alert on: HTTP 503
```

**Custom Health Checks:**

```javascript
// healthcheck.js
const https = require("https");

const options = {
  hostname: "yourdomain.com",
  path: "/api/health",
  method: "GET",
};

https
  .request(options, (res) => {
    if (res.statusCode !== 200) {
      process.exit(1);
    }
    process.exit(0);
  })
  .end();
```

### 2. Metrics Collection

**Prometheus Metrics Endpoint:**

```typescript
// /api/metrics/prometheus
export async function GET() {
  const metrics = await collectMetrics();

  return new Response(formatPrometheusMetrics(metrics), {
    headers: { "Content-Type": "text/plain" },
  });
}
```

**Key Metrics to Monitor:**

- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Database connection pool utilization
- Message queue depth
- WhatsApp client connection status
- Memory usage
- CPU usage

### 3. Log Aggregation

**Winston to Elasticsearch:**

```javascript
import winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";

const esTransport = new ElasticsearchTransport({
  level: "info",
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ES_USER,
      password: process.env.ES_PASS,
    },
  },
});

logger.add(esTransport);
```

### 4. Alerting Rules

**Critical Alerts:**

```yaml
# Prometheus Alert Rules
groups:
  - name: whatsapp_dashboard
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"

      - alert: QueueBacklog
        expr: message_queue_depth > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Message queue backlog detected"
```

## Backup & Recovery

### 1. Automated Backups

**Database Backup Script:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="whatsapp_db_${DATE}.sql.gz"

# Create backup
mysqldump \
  --host=${MARIADB_HOST} \
  --user=${MARIADB_USER} \
  --password=${MARIADB_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  ${MARIADB_DATABASE} | gzip > "${BACKUP_DIR}/${FILENAME}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${FILENAME}" \
  "s3://your-backup-bucket/database/${FILENAME}"

# Keep only last 30 days locally
find ${BACKUP_DIR} -name "whatsapp_db_*.sql.gz" -mtime +30 -delete

# Verify backup
gunzip -t "${BACKUP_DIR}/${FILENAME}" && echo "Backup verified successfully"
```

**Cron Schedule:**

```cron
# Daily backup at 2 AM
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1

# Weekly full backup
0 3 * * 0 /scripts/backup-full.sh >> /var/log/backup.log 2>&1
```

### 2. Disaster Recovery

**Recovery Procedure:**

```bash
# 1. Stop application
docker stop whatsapp-app

# 2. Restore database
gunzip < backup.sql.gz | mysql \
  --host=${MARIADB_HOST} \
  --user=${MARIADB_USER} \
  --password=${MARIADB_PASSWORD} \
  ${MARIADB_DATABASE}

# 3. Verify data integrity
mysql -e "SELECT COUNT(*) FROM messages;" ${MARIADB_DATABASE}

# 4. Restart application
docker start whatsapp-app

# 5. Verify health
curl https://yourdomain.com/api/health
```

**RTO/RPO Targets:**

- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 24 hours

## Performance Optimization

### 1. Database Query Optimization

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Analyze slow queries
SELECT * FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;
```

### 2. Caching Strategy

**Redis Integration:**

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
async function getCachedUser(userId: string) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));

  return user;
}
```

### 3. Connection Pooling

**Optimize Pool Size:**

```typescript
// Formula: connections = ((core_count * 2) + effective_spindle_count)
// For 4 cores + 1 SSD: (4 * 2) + 1 = 9
// Add 20% buffer: 9 * 1.2 = ~11

const poolConfig = {
  connectionLimit: 20, // Max connections
  maxIdle: 10, // Max idle
  idleTimeout: 60000, // 60 seconds
  queueLimit: 100, // Max queued requests
};
```

## Scaling Strategy

### 1. Horizontal Scaling

**Load Balancer Configuration:**

```nginx
upstream whatsapp_backend {
  least_conn;
  server app1:3000 weight=1;
  server app2:3000 weight=1;
  server app3:3000 weight=1;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  location / {
    proxy_pass http://whatsapp_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### 2. Database Replication

```sql
-- Master Configuration
[mysqld]
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_do_db = whatsapp_production

-- Slave Configuration
[mysqld]
server-id = 2
relay-log = /var/log/mysql/mysql-relay-bin
```

### 3. Message Queue Sharding

```typescript
// Distribute load across multiple queues
function getQueueForDevice(deviceId: string): MessageQueue {
  const shard = hashCode(deviceId) % QUEUE_COUNT;
  return queueInstances[shard];
}
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database credentials rotated
- [ ] API keys encrypted at rest
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Input validation on all endpoints
- [ ] Audit logging enabled
- [ ] Error messages sanitized
- [ ] Dependencies updated
- [ ] Vulnerability scanning automated

## Troubleshooting

### Common Issues

**1. High Memory Usage:**

```bash
# Check memory usage
docker stats whatsapp-app

# Increase Node.js heap
NODE_OPTIONS="--max-old-space-size=2048"
```

**2. Database Connection Pool Exhausted:**

```bash
# Check active connections
SHOW PROCESSLIST;

# Increase pool size or optimize queries
```

**3. WhatsApp Client Disconnections:**

```bash
# Check client logs
docker logs whatsapp-app | grep "WA]"

# Restart specific client via API
curl -X POST /api/devices/{deviceId}/reconnect
```

## Maintenance Windows

**Recommended Schedule:**

- Weekly: Patch updates (Sunday 2-4 AM)
- Monthly: Database optimization (First Sunday)
- Quarterly: Major version updates
- Semi-annually: Security audit
