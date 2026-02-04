import { MessageService } from "@/lib/services/message.service";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { MessageQueries } from "@/lib/db/queries/message.queries";
import { messageQueue } from "@/lib/whatsapp/message-queue";
import { DeviceStatus } from "@/types/database.types";

// Mock dependencies
jest.mock("@/lib/db/queries/device.queries");
jest.mock("@/lib/db/queries/message.queries");
jest.mock("@/lib/whatsapp/message-queue");

describe("MessageService", () => {
  const mockDevice = {
    id: "device-123",
    status: DeviceStatus.AUTHENTICATED,
    is_ready: true,
    user_id: "user-1",
  };

  const mockMessageDTO = {
    device_id: "device-123",
    user_id: "user-1",
    to_number: "628123456789",
    message: "Hello World",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should successfully queue a message when device is ready", async () => {
      (DeviceQueries.findById as jest.Mock).mockResolvedValue(mockDevice);
      (MessageQueries.create as jest.Mock).mockResolvedValue({
        id: "msg-1",
        ...mockMessageDTO,
      });

      const result = await MessageService.sendMessage(mockMessageDTO);

      expect(DeviceQueries.findById).toHaveBeenCalledWith("device-123");
      expect(MessageQueries.create).toHaveBeenCalledWith(mockMessageDTO);
      expect(messageQueue.addMessage).toHaveBeenCalledWith(
        "msg-1",
        "device-123",
      );
      expect(result).toHaveProperty("id", "msg-1");
    });

    it("should throw error if device not found", async () => {
      (DeviceQueries.findById as jest.Mock).mockResolvedValue(null);

      await expect(MessageService.sendMessage(mockMessageDTO)).rejects.toThrow(
        "Device not found",
      );
    });

    it("should throw error if device is not ready", async () => {
      (DeviceQueries.findById as jest.Mock).mockResolvedValue({
        ...mockDevice,
        is_ready: false,
      });

      await expect(MessageService.sendMessage(mockMessageDTO)).rejects.toThrow(
        "Device is not ready",
      );
    });
  });
});
