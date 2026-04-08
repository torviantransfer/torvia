const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}, 60_000);

export function rateLimit(
  key: string,
  opts: { maxRequests: number; windowMs: number }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, remaining: opts.maxRequests - 1 };
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: opts.maxRequests - entry.count };
}
