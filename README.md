# README.md

# WhatsApp Web Dashboard

Multi-device WhatsApp messaging platform with comprehensive management features.

## Features

- Multi-device support with QR code authentication
- Role-based access control (ADMIN, USER_A, USER_B, USER_C, DST)
- Google OAuth authentication with optional MFA
- Message queue with rate limiting and retry mechanism
- Auto-response rules with priority system
- Contact management with CSV/VCF import/export
- Message templates with variables
- Webhook integration for external applications
- API key management for chatbot integration
- Database backup and restore
- Audit logging
- Real-time statistics and analytics

## Prerequisites

- Node.js >= 20.0.0
- MariaDB/MySQL >= 10.0
- npm >= 10.0.0

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd whatsapp-web-dashboard
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

4. Setup database

```bash
npm run db:migrate
```

5. Run development server

```bash
npm run dev
```

6. Start message queue processor

```bash
npm run queue:start
```

## Environment Variables

See `.env.example` for all required environment variables.

## Docker Deployment

```bash
docker-compose up -d
```

## API Documentation

### Authentication

All API endpoints except `/api/health` and `/api/auth/*` require authentication.

### Endpoints

- `POST /api/auth/[...nextauth]` - Authentication
- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `POST /api/messages/send` - Send message
- `GET /api/contacts` - List contacts
- `POST /api/contacts/import` - Import contacts
- `GET /api/stats` - Get statistics

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run queue:start` - Start message queue processor
- `npm run backup` - Create database backup
- `npm run cleanup` - Clean up old data

## License

MIT
