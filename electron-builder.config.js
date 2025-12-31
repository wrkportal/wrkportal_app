/**
 * Electron Builder Configuration
 * Builds desktop app for Windows, Mac, and Linux
 */

module.exports = {
  appId: 'com.projectmanagement.app',
  productName: 'Project Management Studio',
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  files: [
    '.next/standalone/**/*', // Include standalone Next.js server
    '.next/static/**/*', // Include static assets
    'electron/**/*',
    'package.json',
    'public/**/*',
    'node_modules/**/*',
    '!node_modules/electron/**/*',
    '!node_modules/.cache/**/*',
    '!node_modules/**/*.{md,ts,tsx,map}',
    '!node_modules/duckdb/**/*', // Exclude duckdb - requires native compilation
    '!.next/cache/**/*'
  ],
  extraResources: [
    {
      from: 'prisma',
      to: 'prisma',
      filter: ['**/*']
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'public/icon.png',
    signAndEditExecutable: false, // Skip code signing (requires certificate)
    signingHashAlgorithms: null
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/icon.png',
    category: 'public.app-category.business'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    icon: 'public/icon.png',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  publish: null, // Set to your auto-updater service if needed
  // Don't rebuild native dependencies (like duckdb)
  npmRebuild: false,
  // Skip rebuilding native modules that require build tools
  beforeBuild: null,
  // Exclude problematic native modules from rebuild
  buildDependenciesFromSource: false
}

