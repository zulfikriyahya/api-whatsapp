import { NextRequest } from "next/server";
import { z } from "zod";
import {
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

type RouteHandler<T = any> = (
  req: NextRequest,
  validated: T,
  context?: any,
) => Promise<Response>;

interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  options?: ValidationOptions,
) {
  return (handler: RouteHandler<T>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const contentType = req.headers.get("content-type") || "";

        let body: unknown;

        if (contentType.includes("application/json")) {
          try {
            body = await req.json();
          } catch {
            return validationErrorResponse([
              { field: "body", message: "Invalid JSON payload" },
            ]);
          }
        } else if (contentType.includes("multipart/form-data")) {
          const formData = await req.formData();
          body = Object.fromEntries(formData.entries());
        } else {
          return validationErrorResponse([
            { field: "content-type", message: "Unsupported content type" },
          ]);
        }

        const result = schema.safeParse(body);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        return handler(req, result.data, context);
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Validation error"));
      }
    };
  };
}

export function withQueryValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: RouteHandler<T>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const { searchParams } = new URL(req.url);
        const params = Object.fromEntries(searchParams.entries());

        const result = schema.safeParse(params);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        return handler(req, result.data, context);
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Query validation error"));
      }
    };
  };
}

export function withMultipartValidation<T>(
  schema: z.ZodSchema<T>,
  fileFields?: string[],
) {
  return (handler: RouteHandler<T & { files?: Record<string, File> }>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        const formData = await req.formData();
        const data: Record<string, any> = {};
        const files: Record<string, File> = {};

        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            if (fileFields && fileFields.includes(key)) {
              files[key] = value;
            }
          } else {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        }

        const result = schema.safeParse(data);

        if (!result.success) {
          const errors = result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          }));

          return validationErrorResponse(errors);
        }

        const validatedData =
          Object.keys(files).length > 0
            ? { ...result.data, files }
            : result.data;

        return handler(
          req,
          validatedData as T & { files?: Record<string, File> },
          context,
        );
      } catch (error) {
        if (error instanceof Error) {
          return serverErrorResponse(error);
        }
        return serverErrorResponse(new Error("Multipart validation error"));
      }
    };
  };
}

export function sanitizeInput<T extends Record<string, any>>(input: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = value
        .trim()
        .replace(/[<>]/g, "") as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string" ? item.trim().replace(/[<>]/g, "") : item,
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}
