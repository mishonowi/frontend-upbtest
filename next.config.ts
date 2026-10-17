import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un sitio estático en /out para que Firebase Hosting lo sirva
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
