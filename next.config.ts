import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memoises components automatically; the label and offer editors re-render on every keystroke.
  reactCompiler: true,
  // Next's dev badge sits bottom left by default, over the menu toggle; development only.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
