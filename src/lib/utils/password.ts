import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const PEPPER = process.env.PASSWORD_PEPPER || "";
const MIN_PASSWORD_LENGTH = 8;

export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    this.validatePassword(password);
    const pepperedPassword = password + PEPPER;
    return bcrypt.hash(pepperedPassword, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = password + PEPPER;
    return bcrypt.compare(pepperedPassword, hash);
  }

  static validatePassword(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
      throw new Error(
        "Password must contain uppercase, lowercase, number, and special character",
      );
    }
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  static generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(32).toString("base64url");
    return `wwa_${timestamp}_${randomPart}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto
      .createHmac("sha256", process.env.API_KEY_SECRET || "default-secret")
      .update(apiKey)
      .digest("hex");
  }
}
