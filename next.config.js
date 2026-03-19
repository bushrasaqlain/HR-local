/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@vladmandic\/face-api/ },
    ];
    return config;
  },
};

module.exports = nextConfig;