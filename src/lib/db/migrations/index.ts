// src/lib/db/migrations/index.ts

import * as fs from "fs";
import * as path from "path";
import { query, queryOne } from "../index";

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(process.cwd(), "database", "migrations");
    this.ensureMigrationsTable();
  }

  private async ensureMigrationsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async getExecutedMigrations(): Promise<Migration[]> {
    return query<Migration[]>("SELECT * FROM migrations ORDER BY id ASC");
  }

  async getMigrationFiles(): Promise<string[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    return files;
  }

  async run(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    const migrationFiles = await this.getMigrationFiles();
    const pendingMigrations = migrationFiles.filter(
      (f) => !executedNames.has(f),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    for (const migrationFile of pendingMigrations) {
      const filePath = path.join(this.migrationsPath, migrationFile);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Executing migration: ${migrationFile}`);

      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await query(statement);
      }

      await query("INSERT INTO migrations (name) VALUES (?)", [migrationFile]);

      console.log(`Completed migration: ${migrationFile}`);
    }

    console.log("All migrations completed successfully");
  }

  async rollback(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    console.log(`Rolling back migration: ${lastMigration.name}`);

    await query("DELETE FROM migrations WHERE id = ?", [lastMigration.id]);

    console.log(`Rollback completed: ${lastMigration.name}`);
  }

  async create(name: string): Promise<void> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here

`;

    fs.writeFileSync(filepath, template);
    console.log(`Created migration file: ${filename}`);
  }
}

export const migrationRunner = new MigrationRunner();
