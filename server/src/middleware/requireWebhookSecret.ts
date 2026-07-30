import type { NextFunction, Request, Response } from "express";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const expected = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
