'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Database,
  BarChart3,
  FileStack,
  LayoutGrid,
  Sparkles,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Code2,
  Brain,
  Beaker,
} from 'lucide-react'
import Link from 'next/link'
import { HelpDialog } from '@/components/help/help-dialog'

export default function ReportingStudioPage() {
  return (
    <>
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-4xl font-bold">
              Your Complete Reporting & Analytics Solution
            </h2>
            <HelpDialog page="reporting-studio" />
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Build powerful dashboards, create advanced visualizations, and uncover insights with AI-powered analytics.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/reporting-studio/data-sources">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Database className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>
                  Upload files or connect databases
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reporting-studio/datasets">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileStack className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Datasets</CardTitle>
                <CardDescription>
                  Manage your data datasets
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reporting-studio/visualizations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Visualizations</CardTitle>
                <CardDescription>
                  Create charts and graphs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reporting-studio/query-builder">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Code2 className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle>Query Builder</CardTitle>
                <CardDescription>
                  Build SQL queries visually
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reporting-studio/dashboards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <LayoutGrid className="h-8 w-8 text-indigo-500 mb-2" />
                <CardTitle>Dashboards</CardTitle>
                <CardDescription>
                  Create interactive dashboards
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reporting-studio/predictive-analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Brain className="h-8 w-8 text-pink-500 mb-2" />
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>
                  Forecasting, regression & classification
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Unified Data Sources</CardTitle>
              <CardDescription>
                Connect to any database, API, or file. One platform for all your data needs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Advanced Visualizations</CardTitle>
              <CardDescription>
                50+ chart types including geospatial, network graphs, and 3D visualizations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>AI-Powered Analytics</CardTitle>
              <CardDescription>
                Natural language queries, auto-insights, and predictive analytics powered by AI.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <LayoutGrid className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Interactive Dashboards</CardTitle>
              <CardDescription>
                Build beautiful, interactive dashboards with drag-and-drop simplicity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-red-500 mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Multi-level access control, row-level security, and enterprise-grade encryption.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle>Seamless Integration</CardTitle>
              <CardDescription>
                Connect to Salesforce, QuickBooks, Stripe, and 50+ other services.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Capabilities Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Capabilities</CardTitle>
            <CardDescription>
              Everything you need for comprehensive reporting and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Data Management</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Unlimited data sources (SQL, APIs, Files)</li>
                  <li>• Handle billions of rows efficiently</li>
                  <li>• Real-time and batch data processing</li>
                  <li>• Data quality and profiling tools</li>
                  <li>• Excel-like grid editor for small datasets</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Visualizations</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 50+ chart types (standard + advanced)</li>
                  <li>• Interactive maps and geospatial analysis</li>
                  <li>• Network and graph visualizations</li>
                  <li>• Custom D3.js chart builder</li>
                  <li>• 3D visualizations for complex data</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">AI & Analytics</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Natural Language Query (NLQ)</li>
                  <li>• Auto-generated insights</li>
                  <li>• Predictive analytics and forecasting</li>
                  <li>• Anomaly detection</li>
                  <li>• Self-hosted AI models (data privacy)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Enterprise Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Multi-level access control (Org → Function → Role)</li>
                  <li>• Row-level and column-level security</li>
                  <li>• Real-time collaboration</li>
                  <li>• API and embedding capabilities</li>
                  <li>• SOC 2, ISO 27001 compliance ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Timeline */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Timeline</CardTitle>
            <CardDescription>
              18-month phased rollout with clear milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 1 (Months 1-3)</div>
                  <div className="text-xs text-muted-foreground">Foundation</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Data layer, file upload, database connections, query builder
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 2 (Months 4-6)</div>
                  <div className="text-xs text-muted-foreground">Visualizations</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Chart library, dashboard builder, interactivity, report generation
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 3 (Months 7-9)</div>
                  <div className="text-xs text-muted-foreground">AI & Analytics</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Self-hosted AI, NLQ, auto-insights, predictive analytics
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 4 (Months 10-12)</div>
                  <div className="text-xs text-muted-foreground">Enterprise</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Security, access control, collaboration, API, governance
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 5 (Months 13-15)</div>
                  <div className="text-xs text-muted-foreground">Integrations</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  SaaS integrations, Excel-like editor, transformations, marketplace
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-semibold">Phase 6 (Months 16-18)</div>
                  <div className="text-xs text-muted-foreground">Launch</div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  Polish, testing, security hardening, documentation, launch preparation
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
