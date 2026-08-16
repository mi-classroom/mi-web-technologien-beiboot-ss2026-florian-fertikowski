import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: no Node server at runtime, just prerendered
  // HTML/JS/CSS. Works because the app has no backend of its own
  output: "export",
};

export default nextConfig;
