// scripts/seed.ts
import { v4 as uuidv4 } from "uuid";
import { query, closeDatabase } from "../src/lib/db";
import { UserRole, MessageStatus } from "../src/types/database.types";
// import bcrypt from "bcryptjs"; // Pastikan install: yarn add bcryptjs

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Create Admin User
    const adminId = uuidv4();
    // Password hash (password: "admin123")
    // Note: Di real app, gunakan NextAuth Google, ini hanya untuk testing local manual jika perlu
    await query(
      `INSERT INTO users (id, email, name, role, is_active, created_at)
       VALUES (?, ?, ?, ?, true, NOW())`,
      [adminId, "admin@example.com", "Admin System", UserRole.ADMIN],
    );
    console.log("Admin user created");

    // 2. Create Dummy Device
    const deviceId = uuidv4();
    await query(
      `INSERT INTO devices (id, name, phone_number, status, is_ready, user_id, created_at)
       VALUES (?, ?, ?, 'CONNECTED', true, ?, NOW())`,
      [deviceId, "Office Main WA", "6281234567890", adminId],
    );
    console.log("Dummy device created");

    // 3. Create Dummy Contacts (50 contacts)
    const contacts = [];
    for (let i = 0; i < 50; i++) {
      const id = uuidv4();
      contacts.push([
        id,
        `Customer ${i + 1}`,
        `6281${Math.floor(Math.random() * 1000000000)}`,
        `customer${i}@mail.com`,
        JSON.stringify(i % 2 === 0 ? ["vip"] : ["new"]),
        adminId,
      ]);
    }

    // Bulk insert contacts
    for (const contact of contacts) {
      await query(
        `INSERT INTO contacts (id, name, phone_number, email, tags, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
        contact,
      );
    }
    console.log("50 Dummy contacts created");

    // 4. Create Message History (Generate data for Chart)
    // Kita buat data mundur 24 jam ke belakang
    // const messages = [];
    const now = new Date();

    for (let i = 0; i < 200; i++) {
      const msgId = uuidv4();
      const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Random time within 24h
      const createdAt = new Date(now.getTime() - timeOffset);

      const status =
        Math.random() > 0.1 ? MessageStatus.SENT : MessageStatus.FAILED;

      await query(
        `INSERT INTO messages (id, device_id, user_id, to_number, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msgId,
          deviceId,
          adminId,
          `6285${Math.floor(Math.random() * 100000000)}`,
          `Test message sequence #${i}`,
          status,
          createdAt,
        ],
      );
    }
    console.log("200 Dummy messages created for statistics");

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

seed();
