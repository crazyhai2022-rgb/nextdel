/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\" \"https://sdk.cashfree.com\")" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig = {
  // Self-contained server in .next/standalone (Hostinger detects and runs it).
  output: "standalone",
  poweredByHeader: false,
  // Lint and type checks run separately (`npm run check`, and GitHub Actions on every PR),
  // so the build on the small hosting container skips them to save memory and threads.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Low-resource build: one worker, no worker threads, no separate webpack build worker.
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1000,
  },
  reactStrictMode: true,
  serverExternalPackages: ["nodemailer", "sanitize-html", "bcryptjs"],
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [{ pathname: "/media/**" }],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
