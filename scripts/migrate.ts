// scripts/migrate.ts

import { migrationRunner } from "../src/lib/db/migrations";

const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  switch (command) {
    case "up":
      await migrationRunner.run();
      break;
    case "down":
      await migrationRunner.rollback();
      break;
    case "create":
      if (!arg) {
        console.error("Please provide migration name");
        process.exit(1);
      }
      await migrationRunner.create(arg);
      break;
    default:
      console.log("Usage:");
      console.log("  npm run migrate up       - Run pending migrations");
      console.log("  npm run migrate down     - Rollback last migration");
      console.log("  npm run migrate create <name> - Create new migration");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration error:", error);
  process.exit(1);
});
