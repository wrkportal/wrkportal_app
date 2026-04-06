'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Upload, Globe, Mail, Eye, Save, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BrandingPage() {
  const [branding, setBranding] = React.useState({
    appName: 'wrkportal',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    customDomain: '',
    emailFromName: 'wrkportal',
    emailFooterText: 'Sent from wrkportal.com',
  })

  const updateField = (field: string, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Branding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Customize the look and feel of your workspace</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/30">
                  <Upload className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 512x512px, PNG or SVG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for buttons, links, and accents</p>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for highlights and secondary elements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">App Name</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  value={branding.appName}
                  onChange={(e) => updateField('appName', e.target.value)}
                  placeholder="Your workspace name"
                />
                <p className="text-xs text-muted-foreground">Shown in the header, emails, and browser tab</p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Custom Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  value={branding.customDomain}
                  onChange={(e) => updateField('customDomain', e.target.value)}
                  placeholder="portal.yourcompany.com"
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain's CNAME to <code className="bg-muted px-1 rounded">custom.wrkportal.com</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={branding.emailFromName}
                  onChange={(e) => updateField('emailFromName', e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input
                  value={branding.emailFooterText}
                  onChange={(e) => updateField('emailFooterText', e.target.value)}
                  placeholder="Sent from Your Company"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                {/* Mini header preview */}
                <div className="h-10 flex items-center px-3 border-b bg-background">
                  <div
                    className="w-6 h-6 rounded-md mr-2"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                  <span className="text-xs font-semibold">{branding.appName}</span>
                </div>

                {/* Mini sidebar */}
                <div className="flex">
                  <div className="w-14 border-r bg-muted/30 py-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-2 mx-3 rounded-full',
                          i === 0 ? 'opacity-100' : 'opacity-30'
                        )}
                        style={{ backgroundColor: i === 0 ? branding.primaryColor : '#888' }}
                      />
                    ))}
                  </div>

                  {/* Mini content */}
                  <div className="flex-1 p-3 space-y-2">
                    <div className="h-2 w-20 rounded-full bg-foreground/20" />
                    <div className="grid grid-cols-2 gap-1.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 rounded border bg-muted/20" />
                      ))}
                    </div>
                    <div
                      className="h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      <span className="text-[8px] text-white font-medium">Button</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email preview */}
              <div className="mt-4 rounded-lg border p-3 bg-muted/10">
                <p className="text-[10px] text-muted-foreground mb-1">Email Preview</p>
                <div className="text-xs space-y-1">
                  <p className="font-medium">From: {branding.emailFromName}</p>
                  <div className="border-t pt-1 text-muted-foreground text-[10px]">
                    {branding.emailFooterText}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
