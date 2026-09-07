import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    // Must stay a literal: Next statically analyses `matcher` at build time and
    // silently ignores any entry built from a variable, so generating this from
    // `locales` would delete the rule rather than fix it.
    //
    // Keep in sync with src/i18n/config.ts. It stopped at `nl` while Romanian
    // was live — harmless in practice, because the catch-all below still
    // matched /ro/*, but the one line in this file that names the languages
    // named six of seven, and the next person to reason about routing would
    // have believed it.
    "/(tr|en|de|pl|ru|nl|ro)/:path*",
    "/((?!api|auth|_next|_vercel|driver|.*\\..*).*)",
  ],
};
