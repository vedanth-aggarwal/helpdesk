import { prisma } from "../db";

export const AI_AGENT_EMAIL = "ai@helpdesk.internal";

let cachedAiAgentId: string | null = null;

export async function getAiAgentId(): Promise<string> {
  if (cachedAiAgentId) {
    return cachedAiAgentId;
  }

  const agent = await prisma.user.findUniqueOrThrow({ where: { email: AI_AGENT_EMAIL } });
  cachedAiAgentId = agent.id;
  return cachedAiAgentId;
}
