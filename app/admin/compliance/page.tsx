'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Shield, CheckCircle2, AlertTriangle, Clock, Download,
  Users, Lock, FileText, Database, ChevronDown, ChevronRight, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceItem {
  id: string
  label: string
  status: 'compliant' | 'partial' | 'non_compliant'
  description: string
}

interface ComplianceFramework {
  name: string
  score: number
  items: ComplianceItem[]
}

const frameworks: ComplianceFramework[] = [
  {
    name: 'GDPR',
    score: 85,
    items: [
      { id: 'gdpr-1', label: 'Data encryption at rest', status: 'compliant', description: 'All data encrypted via AWS KMS' },
      { id: 'gdpr-2', label: 'Data encryption in transit', status: 'compliant', description: 'TLS 1.3 enforced on all connections' },
      { id: 'gdpr-3', label: 'Right to data portability', status: 'partial', description: 'Export API available, UI pending' },
      { id: 'gdpr-4', label: 'Right to erasure', status: 'partial', description: 'Manual process, automation pending' },
      { id: 'gdpr-5', label: 'Data processing agreements', status: 'compliant', description: 'DPAs in place with all sub-processors' },
      { id: 'gdpr-6', label: 'Breach notification (72h)', status: 'compliant', description: 'Automated alerting via GuardDuty + SNS' },
      { id: 'gdpr-7', label: 'Privacy policy', status: 'compliant', description: 'Published at /privacy' },
    ],
  },
  {
    name: 'SOC 2',
    score: 72,
    items: [
      { id: 'soc-1', label: 'Access controls', status: 'compliant', description: 'RBAC with 11 role types' },
      { id: 'soc-2', label: 'Audit logging', status: 'compliant', description: 'CloudTrail + application audit logs' },
      { id: 'soc-3', label: 'Change management', status: 'partial', description: 'CI/CD pipeline, approval gates pending' },
      { id: 'soc-4', label: 'Incident response plan', status: 'non_compliant', description: 'Needs formal documentation' },
      { id: 'soc-5', label: 'Vendor management', status: 'partial', description: 'AWS responsibility matrix documented' },
      { id: 'soc-6', label: 'Employee background checks', status: 'non_compliant', description: 'Process not formalized' },
    ],
  },
]

const auditEvents = [
  { id: '1', action: 'User login', user: 'sandeep@wrkportal.com', ip: '103.xx.xx.45', time: '2 min ago', severity: 'low' },
  { id: '2', action: 'Permission changed', user: 'admin@wrkportal.com', ip: '103.xx.xx.45', time: '15 min ago', severity: 'high' },
  { id: '3', action: 'Data exported (CSV)', user: 'sandeep@wrkportal.com', ip: '103.xx.xx.45', time: '1 hour ago', severity: 'medium' },
  { id: '4', action: 'New user invited', user: 'admin@wrkportal.com', ip: '103.xx.xx.45', time: '3 hours ago', severity: 'low' },
  { id: '5', action: 'API key generated', user: 'sandeep@wrkportal.com', ip: '103.xx.xx.45', time: '1 day ago', severity: 'high' },
]

const retentionPolicies = [
  { entity: 'Audit Logs', retention: '2 years', action: 'Archive to S3 Glacier', lastRun: 'Mar 28, 2026' },
  { entity: 'Deleted Items', retention: '90 days', action: 'Permanent delete', lastRun: 'Mar 30, 2026' },
  { entity: 'Session Data', retention: '30 days', action: 'Purge', lastRun: 'Mar 30, 2026' },
  { entity: 'File Uploads', retention: '1 year', action: 'Move to IA storage', lastRun: 'Mar 25, 2026' },
]

const statusColors = {
  compliant: 'text-green-500',
  partial: 'text-yellow-500',
  non_compliant: 'text-red-500',
}

const statusLabels = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non-compliant',
}

const severityColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500',
}

export default function ComplianceDashboard() {
  const [expandedFramework, setExpandedFramework] = React.useState<string | null>('GDPR')

  const overallScore = Math.round(frameworks.reduce((acc, f) => acc + f.score, 0) / frameworks.length)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance & Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor security posture and regulatory compliance</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">{overallScore}%</p>
            <Progress value={overallScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        {frameworks.map((f) => (
          <Card key={f.name}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{f.name}</p>
                <CheckCircle2 className={cn('h-4 w-4', f.score >= 80 ? 'text-green-500' : 'text-yellow-500')} />
              </div>
              <p className="text-3xl font-bold">{f.score}%</p>
              <Progress value={f.score} className="h-2 mt-2" />
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold">3</p>
            <p className="text-xs text-muted-foreground mt-1">Access reviews due this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checklists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Checklists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {frameworks.map((framework) => (
            <div key={framework.name} className="border rounded-lg">
              <button
                onClick={() => setExpandedFramework(expandedFramework === framework.name ? null : framework.name)}
                className="flex items-center justify-between w-full p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedFramework === framework.name ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">{framework.name}</span>
                  <Badge variant="secondary">{framework.score}%</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {framework.items.filter((i) => i.status === 'compliant').length}/{framework.items.length} compliant
                </span>
              </button>
              {expandedFramework === framework.name && (
                <div className="px-4 pb-4 space-y-2">
                  {framework.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
                      <CheckCircle2 className={cn('h-4 w-4 shrink-0', statusColors[item.status])} />
                      <div className="flex-1">
                        <p className="text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{statusLabels[item.status]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Audit Events</CardTitle>
              <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" /> View All</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                <Badge className={cn('text-[10px]', severityColors[event.severity])}>{event.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{event.action}</p>
                  <p className="text-xs text-muted-foreground">{event.user}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Retention Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {retentionPolicies.map((policy) => (
                <div key={policy.entity} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                  <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{policy.entity}</p>
                    <p className="text-xs text-muted-foreground">
                      {policy.retention} &middot; {policy.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Last: {policy.lastRun}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
