/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during production builds
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
  },
  // For Electron: only use standalone output in production builds
  // This creates a self-contained server that can run in Electron
  // In development, this can cause chunk loading issues
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  webpack: (config, { isServer }) => {
    // Increase chunk loading timeout to prevent ChunkLoadError
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              ...config.optimization.splitChunks?.cacheGroups?.default,
              minChunks: 1,
            },
          },
        },
      }
    }
    
    // Make mongodb an external dependency - don't bundle it
    // This allows the code to use dynamic imports without failing the build
    if (isServer) {
      config.externals = config.externals || []
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (request === 'mongodb') {
              return callback(null, 'commonjs mongodb')
            }
            callback()
          },
        ]
      } else if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request === 'mongodb') {
            return callback(null, 'commonjs mongodb')
          }
          callback()
        })
      }
    }
    
    return config
  },
}

module.exports = nextConfig
