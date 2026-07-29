import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(tr|en|de|pl|ru|nl)/:path*",
    "/((?!api|auth|_next|_vercel|driver|.*\\..*).*)",
  ],
};
