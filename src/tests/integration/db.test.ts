import db, { query, closeDatabase } from "@/lib/db";
import { UserRole } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

// Note: These tests require a running database connection
// Use a test database via .env.test for actual execution
describe("Database Integration", () => {
  const testUserId = uuidv4();
  const testEmail = `test-${Date.now()}@example.com`;

  afterAll(async () => {
    await query("DELETE FROM users WHERE id = ?", [testUserId]);
    await closeDatabase();
  });

  it("should connect to database", async () => {
    const isHealthy = await db.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it("should create and retrieve a user", async () => {
    // Create
    await query(
      `INSERT INTO users (id, email, name, role, is_active)
       VALUES (?, ?, 'Test User', ?, true)`,
      [testUserId, testEmail, UserRole.USER_A],
    );

    // Retrieve
    const users: any[] = await query("SELECT * FROM users WHERE id = ?", [
      testUserId,
    ]);

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(testEmail);
    expect(users[0].role).toBe(UserRole.USER_A);
  });

  it("should handle transaction rollback", async () => {
    const initialCount: any = await query("SELECT COUNT(*) as c FROM users");

    try {
      await db.transaction(async (conn) => {
        await conn.execute(
          "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
          [uuidv4(), "fail@test.com", "Fail"],
        );
        throw new Error("Force Rollback");
      });
    } catch (e) {
      // Expected error
    }

    const finalCount: any = await query("SELECT COUNT(*) as c FROM users");
    expect(initialCount[0].c).toBe(finalCount[0].c);
  });
});
