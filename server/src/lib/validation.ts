import type { Response } from "express";
import type { ZodError } from "zod";

export function sendValidationError(res: Response, error: ZodError, fallback: string) {
  res.status(400).json({ error: error.issues[0]?.message ?? fallback });
}
