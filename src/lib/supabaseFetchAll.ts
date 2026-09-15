/**
 * Reads every row a query matches, a thousand at a time.
 *
 * PostgREST stops at its row limit without saying so, which is how the driver
 * payments screen once totalled only the latest 200 movements of an account.
 * Anything that sums a table goes through here.
 */

const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;

export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

/** A table that does not exist yet, because its migration has not been run. */
export function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42P01" ||
    e?.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(e?.message ?? "")
  );
}
