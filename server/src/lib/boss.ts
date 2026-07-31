import { PgBoss } from "pg-boss";

export const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on("error", (error) => console.error("pg-boss error:", error));

export const CLASSIFY_TICKET_QUEUE = "classify-ticket";
export const AUTO_RESOLVE_TICKET_QUEUE = "auto-resolve-ticket";

export async function startBoss() {
  await boss.start();
  await boss.createQueue(CLASSIFY_TICKET_QUEUE);
  await boss.createQueue(AUTO_RESOLVE_TICKET_QUEUE);
}
