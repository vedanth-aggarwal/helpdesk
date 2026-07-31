import { readFileSync } from "fs";
import { join } from "path";

export function loadKnowledgeBase(): string {
  return readFileSync(join(process.cwd(), "knowledge-base.md"), "utf-8");
}
