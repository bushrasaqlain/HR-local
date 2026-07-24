/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Required for Capacitor static Android build
  output: "export",

  images: {
    unoptimized: true,
    domains: ["localhost"],
  },

  sassOptions: {
    silenceDeprecations: [
      "legacy-js-api",
      "import",
      "global-builtin",
      "color-functions",
    ],
  },

  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@vladmandic\/face-api/ },
    ];
    return config;
  },

  outputFileTracingRoot: require("path").join(__dirname, "../"),
};

module.exports = nextConfig;