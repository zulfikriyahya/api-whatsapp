// src/config/database.config.ts
import { appConfig } from "./app.config";

export const databaseConfig = {
  host: appConfig.database.host,
  port: appConfig.database.port,
  user: appConfig.database.user,
  password: appConfig.database.password,
  database: appConfig.database.database,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: "+00:00",
  multipleStatements: false,
  namedPlaceholders: true,
};
