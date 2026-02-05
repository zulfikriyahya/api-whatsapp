import { NextRequest } from "next/server";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/utils/api-response";

export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (req: NextRequest, validated: T) => Promise<Response>) => {
    return async (req: NextRequest) => {
      try {
        const body = await req.json();
        const validated = schema.parse(body);
        return handler(req, validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return validationErrorResponse(
            error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          );
        }
        throw error;
      }
    };
  };
}
