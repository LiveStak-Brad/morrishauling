import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      {
        source: "/MorrisJunkRemoval",
        destination: "/junk-removal",
        permanent: true,
      },
      {
        source: "/morris-junk-removal",
        destination: "/junk-removal",
        permanent: true,
      },
      {
        source: "/MorrisHauling",
        destination: "/hauling",
        permanent: true,
      },
      {
        source: "/morris-hauling",
        destination: "/hauling",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
