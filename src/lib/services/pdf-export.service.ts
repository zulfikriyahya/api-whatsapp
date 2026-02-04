import PDFDocument from "pdfkit";
import { Message } from "@/types/database.types";
import { format } from "date-fns";

export class PdfExportService {
  static async generateMessageReport(
    messages: Message[],
    title: string = "Message Report",
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(20).text("WhatsApp Dashboard", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: "center" });
      doc
        .fontSize(10)
        .text(`Generated: ${format(new Date(), "PPpp")}`, { align: "center" });
      doc.moveDown(2);

      // Table Header
      const tableTop = 150;
      const colDate = 50;
      const colTo = 180;
      const colStatus = 280;
      const colMsg = 380;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", colDate, tableTop);
      doc.text("To", colTo, tableTop);
      doc.text("Status", colStatus, tableTop);
      doc.text("Message", colMsg, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Rows
      let y = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      messages.forEach((msg) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(
          format(new Date(msg.created_at), "yyyy-MM-dd HH:mm"),
          colDate,
          y,
        );
        doc.text(msg.to_number, colTo, y);
        doc.text(msg.status, colStatus, y);

        // Truncate message for PDF view
        const truncatedMsg =
          msg.message.length > 50
            ? msg.message.substring(0, 47) + "..."
            : msg.message;
        doc.text(truncatedMsg, colMsg, y, { width: 170 });

        y += 20;
      });

      // Footer
      const stats = {
        total: messages.length,
        sent: messages.filter((m) =>
          ["SENT", "DELIVERED", "READ"].includes(m.status),
        ).length,
        failed: messages.filter((m) => m.status === "FAILED").length,
      };

      doc.moveDown(2);
      doc.fontSize(11).font("Helvetica-Bold").text("Summary");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Total Messages: ${stats.total}`);
      doc.text(`Successful: ${stats.sent}`);
      doc.text(`Failed: ${stats.failed}`);

      doc.end();
    });
  }
}
