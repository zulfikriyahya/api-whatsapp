export class PhoneFormatter {
  /**
   * Formats a phone number for WhatsApp ID (e.g., 62812345678@c.us)
   */
  static formatForWhatsApp(
    phoneNumber: string,
    countryCode: string = "62",
  ): string {
    let formatted = phoneNumber.replace(/\D/g, "");

    if (formatted.startsWith("0")) {
      formatted = countryCode + formatted.substring(1);
    } else if (!formatted.startsWith(countryCode)) {
      formatted = countryCode + formatted;
    }

    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }

    return formatted;
  }

  /**
   * Validates minimal length for phone number
   */
  static validate(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Removes non-numeric characters
   */
  static normalize(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, "");
  }

  /**
   * Display format (International or Local)
   */
  static format(
    phoneNumber: string,
    format: "international" | "local" = "international",
  ): string {
    const cleaned = this.normalize(phoneNumber);

    if (format === "international") {
      if (cleaned.startsWith("62")) {
        return `+${cleaned}`;
      }
      return `+62${cleaned}`;
    }

    if (cleaned.startsWith("62")) {
      return `0${cleaned.substring(2)}`;
    }

    return cleaned.startsWith("0") ? cleaned : `0${cleaned}`;
  }
}
