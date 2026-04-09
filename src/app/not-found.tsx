import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#111113",
          color: "#f5f5f7",
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
              background: "linear-gradient(135deg, #F97316, #F97316)",
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
          <a
            href="/en"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              backgroundColor: "#F97316",
              color: "#fff",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
