-- =============================================
-- "Which pages are people on" — counted in people, answered in SQL
--
-- The panel needs a ranked list of pages, and the honest count for it is the
-- number of distinct visits that opened each one. Doing that in the app would
-- mean pulling every page_view of the range across the wire just to group it,
-- which is the shape of the problem migration 081 exists to fix.
--
-- Safe to run on its own and safe to run twice.
-- =============================================

CREATE OR REPLACE FUNCTION analytics_page_counts(
  p_since timestamptz,
  p_limit integer DEFAULT 12
) RETURNS TABLE (page text, visitors bigint, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.page,
    count(DISTINCT e.session_id) AS visitors,
    count(*) AS views
  FROM analytics_events e
  WHERE e.event_type = 'page_view'
    AND e.created_at >= p_since
    AND e.page IS NOT NULL
    -- Staff browsing the panel are not visitors; the tracker skips these
    -- already, but older rows predate that and would still rank.
    AND e.page NOT LIKE '/%/admin%'
  GROUP BY e.page
  ORDER BY visitors DESC, views DESC
  LIMIT greatest(1, least(p_limit, 100));
$$;

REVOKE ALL ON FUNCTION analytics_page_counts(timestamptz, integer) FROM PUBLIC, anon, authenticated;
