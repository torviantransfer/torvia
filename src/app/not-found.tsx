// next/link, not the one from @/i18n/routing: this is the root 404, which
// renders its own <html> outside the locale layout and so has no next-intl
// provider above it. The locale is written into the href instead.
import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#FFFFFF",
          color: "#1d1d1f",
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p
            style={{
              fontSize: "6rem",
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(135deg, #007AFF, #5856D6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Page Not Found
          </h1>
          <p style={{ color: "#86868b", marginBottom: "2rem" }}>
            The page you are looking for does not exist.
          </p>
          <Link
            href="/en"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              backgroundColor: "#007AFF",
              color: "#fff",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
