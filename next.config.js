/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          net: false,
          path: false,
          http: false,
          https: false,
        };
      }
  
      return config;
    },
  };
  
  module.exports = nextConfig;
  