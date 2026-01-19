/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: swcMinify is no longer needed in Next.js 16 (SWC is default)
  typescript: {
    // Disable type checking during production builds
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Add empty turbopack config to silence the warning
  // The webpack config below will be used when running with --webpack flag
  turbopack: {},
  // Disable dev indicator overlay (optional - remove if you want to see it)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // For Electron: only use standalone output in production builds
  // This creates a self-contained server that can run in Electron
  // In development, this can cause chunk loading issues
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting for better performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              ...config.optimization.splitChunks?.cacheGroups?.default,
              minChunks: 1,
            },
            // Separate vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate recharts (large library)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate react-grid-layout
            reactGridLayout: {
              test: /[\\/]node_modules[\\/]react-grid-layout[\\/]/,
              name: 'react-grid-layout',
              priority: 20,
              reuseExistingChunk: true,
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
