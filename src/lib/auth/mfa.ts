// src/lib/auth/mfa.ts
import speakeasy from "speakeasy";
import { query, queryOne } from "@/lib/db";

export class MFAService {
  static generateSecret(email: string): {
    secret: string;
    otpauth_url: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `WhatsApp Dashboard (${email})`,
      issuer: "WhatsApp Dashboard",
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url || "",
    };
  }

  static verifyOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });
  }

  static async enableMFA(
    userId: string,
    email: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const { secret, otpauth_url } = this.generateSecret(email);

    await query(
      "UPDATE users SET mfa_enabled = true, mfa_secret = ? WHERE id = ?",
      [secret, userId],
    );

    return {
      secret,
      qrCodeUrl: otpauth_url,
    };
  }

  static async disableMFA(userId: string): Promise<void> {
    await query(
      "UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = ?",
      [userId],
    );
  }

  static async verifyUserOTP(userId: string, token: string): Promise<boolean> {
    const user: any = await queryOne(
      "SELECT mfa_secret FROM users WHERE id = ? AND mfa_enabled = true",
      [userId],
    );

    if (!user?.mfa_secret) {
      return false;
    }

    return this.verifyOTP(user.mfa_secret, token);
  }
}
