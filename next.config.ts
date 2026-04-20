import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Ensure Prisma's Linux query engine binaries are bundled into every
  // server route's Vercel deployment. Without this, Vercel's tree-shaker
  // leaves them out and we get "Query Engine for rhel-openssl-3.0.x not
  // found" at runtime.
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },

  // Prisma's generated client is CommonJS; bundling it as a server
  // component external ensures it's loaded correctly at runtime.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
