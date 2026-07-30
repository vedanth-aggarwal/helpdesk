import { isAxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  if (isAxiosError(error)) return error.response?.data?.error || error.message;
  return fallback;
}
