/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.FINTRACK_E2E === "1" ? { distDir: ".next-e2e" } : {}),
  output: "standalone",
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const responseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ];
    if (!isDevelopment) {
      responseHeaders.push({ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" });
    }
    if (process.env.NODE_ENV === "production") {
      responseHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [
      {
        source: "/(.*)",
        headers: responseHeaders
      }
    ];
  }
};
module.exports = nextConfig;
