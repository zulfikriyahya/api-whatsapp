import { messageQueue } from "@/lib/whatsapp/message-queue";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";

console.log("Starting message queue processor...");

const shutdown = async () => {
  console.log("Shutting down gracefully...");
  messageQueue.stopProcessing();
  await whatsappClientManager.disconnectAllClients();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("Message queue processor is running...");
