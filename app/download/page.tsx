'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Monitor, CheckCircle2, Zap, Database, Globe, AlertCircle, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function DownloadPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [fileStatus, setFileStatus] = useState<Record<string, boolean | 'checking'>>({})
  const [autoDetectedPlatform, setAutoDetectedPlatform] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Use direct file links - browsers handle these better than API routes for .exe files
  // This avoids browser security warnings and "unconfirmed" downloads
  const downloadLinks = {
    windows: process.env.NEXT_PUBLIC_DESKTOP_WINDOWS_URL || '/downloads/Project-Management-Studio-Setup.exe',
    mac: process.env.NEXT_PUBLIC_DESKTOP_MAC_URL || '/downloads/Project-Management-Studio.dmg',
    linux: process.env.NEXT_PUBLIC_DESKTOP_LINUX_URL || '/downloads/Project-Management-Studio.AppImage'
  }
  
  // For file existence check, use the direct file path
  const fileCheckPaths = {
    windows: '/downloads/Project-Management-Studio-Setup.exe',
    mac: '/downloads/Project-Management-Studio.dmg',
    linux: '/downloads/Project-Management-Studio.AppImage'
  }

  // Set client-side flag and detect platform only on client
  useEffect(() => {
    setIsClient(true)
    const detectPlatform = () => {
      if (typeof window === 'undefined') return null
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('win')) return 'windows'
      if (userAgent.includes('mac')) return 'mac'
      if (userAgent.includes('linux')) return 'linux'
      return null
    }
    setAutoDetectedPlatform(detectPlatform())
  }, [])

  // Check if files exist
  useEffect(() => {
    const checkFiles = async () => {
      const status: Record<string, boolean | 'checking'> = {}
      for (const [platform, url] of Object.entries(fileCheckPaths)) {
        status[platform] = 'checking'
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          status[platform] = response.ok
        } catch (error: any) {
          // Silently handle 404s and network errors - this is expected when files don't exist
          // 404 errors are normal when installers haven't been built yet
          // Only log in development, and only if it's not a 404
          if (process.env.NODE_ENV === 'development' && error?.name !== 'AbortError') {
            // Suppress 404 errors in console - they're expected for missing installers
            const is404 = error?.message?.includes('404') || error?.message?.includes('Not Found')
            if (!is404) {
              console.debug(`File check for ${platform}:`, error.message)
            }
          }
          status[platform] = false
        }
      }
      setFileStatus(status)
    }
    checkFiles()
  }, [])

  const handleDownload = (platform: string) => {
    const link = downloadLinks[platform as keyof typeof downloadLinks]
    const exists = fileStatus[platform]
    
    if (exists === 'checking') {
      alert('Still checking for installer availability. Please wait a moment.')
      return
    }
    
    if (!exists) {
      alert('The installer is not available yet. Please build the desktop app first using: npm run electron:build')
      return
    }
    
    if (link) {
      // Use window.open with download attribute - most reliable for .exe files
      // This forces the browser to download instead of trying to open
      const linkElement = document.createElement('a')
      linkElement.href = link
      linkElement.download = platform === 'windows' ? 'Project-Management-Studio-Setup.exe' :
                            platform === 'mac' ? 'Project-Management-Studio.dmg' :
                            'Project-Management-Studio.AppImage'
      linkElement.style.display = 'none'
      document.body.appendChild(linkElement)
      
      // Trigger download
      linkElement.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(linkElement)
      }, 100)
    } else {
      alert('Download link not available. Please contact support.')
    }
  }

  const hasAnyFile = Object.values(fileStatus).some(exists => exists === true)
  const isCheckingAnyFile = Object.values(fileStatus).some(status => status === 'checking')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Download Desktop App</h1>
          <p className="text-muted-foreground text-lg">
            Work offline with full data processing capabilities
          </p>
        </div>

        {/* Notice if files don't exist */}
        {!hasAnyFile && isClient && !isCheckingAnyFile && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Installers Not Available Yet</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The desktop app installers haven't been built yet. To create them:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Build the Next.js app: <code className="bg-muted px-1 rounded">npm run build</code></li>
                <li>Build the Electron app: <code className="bg-muted px-1 rounded">npm run electron:build</code></li>
                <li>Copy installers from <code className="bg-muted px-1 rounded">dist/</code> to <code className="bg-muted px-1 rounded">public/downloads/</code></li>
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                See <code className="bg-muted px-1 rounded">BUILD_AND_DISTRIBUTE_DESKTOP_APP.md</code> for detailed instructions.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle className="text-base">Offline Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Work completely offline. No internet required for data processing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-base">Fast Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Local DuckDB engine handles millions of rows instantly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-base">Cloud Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sync your work to cloud when online. Best of both worlds.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Download Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Choose Your Platform</CardTitle>
            <CardDescription>
              {isClient && autoDetectedPlatform && (
                <span className="text-green-600">
                  We detected you're on {autoDetectedPlatform === 'windows' ? 'Windows' : 
                                         autoDetectedPlatform === 'mac' ? 'Mac' : 'Linux'}. 
                  Recommended download below:
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Windows */}
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatform === 'windows' || autoDetectedPlatform === 'windows'
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlatform('windows')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Monitor className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">Windows</h3>
                      <p className="text-sm text-muted-foreground">
                        Windows 10/11 (64-bit)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload('windows')
                    }}
                    disabled={fileStatus.windows === 'checking' || fileStatus.windows === false}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {fileStatus.windows === 'checking' ? 'Checking...' : fileStatus.windows === false ? 'Not Available' : 'Download'}
                  </Button>
                </div>
              </div>

              {/* Mac */}
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatform === 'mac' || autoDetectedPlatform === 'mac'
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlatform('mac')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Monitor className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">macOS</h3>
                      <p className="text-sm text-muted-foreground">
                        macOS 10.15 or later (Intel & Apple Silicon)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload('mac')
                    }}
                    disabled={fileStatus.mac === 'checking' || fileStatus.mac === false}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {fileStatus.mac === 'checking' ? 'Checking...' : fileStatus.mac === false ? 'Not Available' : 'Download'}
                  </Button>
                </div>
              </div>

              {/* Linux */}
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatform === 'linux' || autoDetectedPlatform === 'linux'
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlatform('linux')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Monitor className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">Linux</h3>
                      <p className="text-sm text-muted-foreground">
                        AppImage (works on most distributions)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload('linux')
                    }}
                    disabled={fileStatus.linux === 'checking' || fileStatus.linux === false}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {fileStatus.linux === 'checking' ? 'Checking...' : fileStatus.linux === false ? 'Not Available' : 'Download'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Windows</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .exe file</li>
                <li>Run the installer</li>
                <li>Follow the installation wizard</li>
                <li>Launch from Start Menu or Desktop shortcut</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">macOS</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .dmg file</li>
                <li>Open the .dmg file</li>
                <li>Drag the app to Applications folder</li>
                <li>If you see a security warning, go to System Preferences → Security & Privacy → Open Anyway</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Linux</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .AppImage file</li>
                <li>Make it executable: <code className="bg-muted px-1 rounded">chmod +x Project-Management-Studio.AppImage</code></li>
                <li>Run: <code className="bg-muted px-1 rounded">./Project-Management-Studio.AppImage</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* System Requirements */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Minimum</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 4 GB RAM</li>
                  <li>• 500 MB free disk space</li>
                  <li>• Internet connection (for initial setup)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recommended</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 8 GB RAM</li>
                  <li>• 2 GB free disk space</li>
                  <li>• SSD storage (for faster performance)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

