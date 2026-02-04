// scripts/backup.js
const { BackupService } = require("../src/lib/services/backup.service");

async function createBackup() {
  console.log("Creating database backup...");

  try {
    const filepath = await BackupService.createBackup();
    console.log(`Backup created successfully: ${filepath}`);
    process.exit(0);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

createBackup();
