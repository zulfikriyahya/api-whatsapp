// scripts/cleanup.js
const { MessageQueries } = require("../src/lib/db/queries/message.queries");
const { AuditLogQueries } = require("../src/lib/db/queries/audit-log.queries");
const { BackupService } = require("../src/lib/services/backup.service");
const { StorageService } = require("../src/lib/utils/storage");

async function cleanup() {
  console.log("Starting cleanup process...");

  try {
    const messagesDeleted = await MessageQueries.deleteOld(30);
    console.log(`Deleted ${messagesDeleted} old messages`);

    const logsDeleted = await AuditLogQueries.deleteOld(90);
    console.log(`Deleted ${logsDeleted} old audit logs`);

    const uploadsDeleted = await StorageService.cleanupOldUploads(7);
    console.log(`Deleted ${uploadsDeleted} old uploads`);

    const backupsDeleted = await BackupService.cleanupOldBackups(30);
    console.log(`Deleted ${backupsDeleted} old backups`);

    console.log("Cleanup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
