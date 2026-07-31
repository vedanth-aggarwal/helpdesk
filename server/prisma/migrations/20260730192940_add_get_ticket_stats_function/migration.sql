-- Stored function backing GET /api/tickets/stats (server/src/routes/tickets.ts).
-- Not represented in schema.prisma (Prisma has no DSL for functions) — this
-- migration is the only source of truth for it; edit here, then a fresh
-- `--create-only` migration with `CREATE OR REPLACE FUNCTION` to change it.
--
-- The AI agent's email is hardcoded below to match AI_AGENT_EMAIL in
-- server/src/lib/aiAgent.ts — keep the two in sync if that constant changes.
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM ticket),
    'open', (SELECT COUNT(*) FROM ticket WHERE status = 'OPEN'),
    'resolvedByAi', (
      SELECT COUNT(*)
      FROM ticket t
      JOIN "user" u ON u.id = t."assigneeId"
      WHERE t.status = 'RESOLVED' AND u.email = 'ai@helpdesk.internal'
    ),
    'avgResolutionSeconds', (
      SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")))
      FROM ticket
      WHERE "resolvedAt" IS NOT NULL
    ),
    'ticketsPerDay', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object('date', to_char(gs.day, 'YYYY-MM-DD'), 'count', daily.count)
          ORDER BY gs.day
        ),
        '[]'::jsonb
      )
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS gs(day)
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM ticket t2
        WHERE date_trunc('day', t2."createdAt") = gs.day
      ) daily ON true
    )
  );
$$;
