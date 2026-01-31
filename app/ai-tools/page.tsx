'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  FileText,
  AlertTriangle,
  BarChart3,
  Users,
  MessageSquare,
  DollarSign,
  Target,
  Activity,
  Bell,
  Search,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const AI_TOOLS = [
  {
    id: 'pdf-metrics',
    title: 'PDF Metrics Analyzer',
    description: 'Upload PDFs and extract metrics with AI-driven checks',
    icon: FileText,
    href: '/ai-tools/pdf-metrics',
    features: ['PDF parsing', 'Metric summaries', 'Custom conditions'],
  },
  {
    id: 'automations',
    title: 'Automations',
    description: 'Create powerful no-code automations and workflows',
    icon: Workflow,
    href: '/automations',
    features: ['Trigger-based actions', 'Smart notifications', 'Time-saving workflows'],
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Chat with AI to manage projects, tasks, and get insights',
    icon: Sparkles,
    href: '/ai-assistant',
    features: ['Natural language queries', 'Function calling', 'Real-time help'],
  },
  {
    id: 'charter',
    title: 'Charter Generator',
    description: 'AI-powered project charter creation with best practices',
    icon: FileText,
    href: '/ai-tools/charter',
    features: ['PMI/PMBOK standards', 'Stakeholder analysis', 'Risk identification'],
  },
  {
    id: 'risk',
    title: 'Risk Predictor',
    description: 'Predict project risks before they become issues',
    icon: AlertTriangle,
    href: '/ai-tools/risk-predictor',
    features: ['Early warnings', 'Pattern analysis', 'Mitigation strategies'],
  },
  {
    id: 'reports',
    title: 'Status Reports',
    description: 'Auto-generate executive status reports',
    icon: BarChart3,
    href: '/ai-tools/status-reports',
    features: ['Executive summaries', 'Health indicators', 'Action items'],
  },
  {
    id: 'assignment',
    title: 'Task Assignment',
    description: 'Intelligent task assignment recommendations',
    icon: Users,
    href: '/ai-tools/task-assignment',
    features: ['Skill matching', 'Workload analysis', 'Performance history'],
  },
  {
    id: 'meetings',
    title: 'Meeting Analyzer',
    description: 'Extract action items from meeting notes',
    icon: MessageSquare,
    href: '/ai-tools/meeting-notes',
    features: ['Action extraction', 'Decision logging', 'Follow-up tracking'],
  },
  {
    id: 'budget',
    title: 'Budget Forecasting',
    description: 'AI-powered budget predictions and cost optimization',
    icon: DollarSign,
    href: '/ai-tools/budget-forecast',
    features: ['Cost forecasting', 'Threshold alerts', 'Optimization tips'],
  },
  {
    id: 'okr',
    title: 'OKR Tracking',
    description: 'Smart OKR progress tracking and recommendations',
    icon: Target,
    href: '/ai-tools/okr-tracking',
    features: ['Progress analysis', 'Confidence scoring', 'Blocker identification'],
  },
  {
    id: 'anomaly',
    title: 'Anomaly Detection',
    description: 'Detect unusual patterns in project metrics',
    icon: Activity,
    href: '/ai-tools/anomaly-detection',
    features: ['Pattern detection', 'Outlier alerts', 'Trend analysis'],
  },
  {
    id: 'notifications',
    title: 'Smart Summaries',
    description: 'Intelligent notification digests',
    icon: Bell,
    href: '/ai-tools/notification-summary',
    features: ['Priority grouping', 'Noise reduction', 'Action focus'],
  },
  {
    id: 'search',
    title: 'Semantic Search',
    description: 'Search by meaning, not just keywords',
    icon: Search,
    href: '/ai-tools/semantic-search',
    features: ['Natural language', 'Context awareness', 'Smart ranking'],
  },
]

export default function AIToolsPage() {
  return (
    <div>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI-Powered Tools</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Supercharge your project management with AI</p>
          </div>
        </div>
      </div>

      {/* Featured Tool */}
      <Card className="p-6 mb-8 border-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">AI Assistant</h2>
            </div>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              Chat with your AI assistant to manage projects, get insights, and automate tasks.
              Ask questions in natural language and get instant, actionable answers.
            </p>
            <Button asChild variant="outline">
              <Link href="/ai-assistant">
                Launch AI Assistant →
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AI_TOOLS.filter(tool => tool.id !== 'assistant').map((tool) => {
          const Icon = tool.icon
          return (
            <Card key={tool.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 rounded-lg bg-muted mb-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
              <p className="text-muted-foreground mb-4 text-sm">{tool.description}</p>
              
              <ul className="space-y-1 mb-4">
                {tool.features.map((feature, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button asChild className="w-full" variant="outline">
                <Link href={tool.href}>
                  Open Tool
                </Link>
              </Button>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

