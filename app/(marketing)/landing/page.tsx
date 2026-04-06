'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  ArrowRight, Target, Users, TrendingUp, Shield, Zap, BarChart3,
  CheckCircle2, Brain, Clock, DollarSign, MessageSquare, Search,
  FileText, Calendar, ChevronRight, Globe, Lock, Layers, Activity,
  Star, Bot, Cpu, Network, Send, ChevronDown, Check, X, Wrench,
  UserPlus, Headphones, Monitor, FolderKanban, ListTodo, Flame,
  AlertTriangle, Mail, Github, Sparkles,
} from "lucide-react"

// ============================================================
// LANDING PAGE — Enterprise-grade design
// ============================================================

export default function LandingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)
  const [activeTab, setActiveTab] = useState('projects')
  const [contactForm, setContactForm] = useState({ name: '', email: '', type: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasVisitedBefore', 'true')
    }
  }, [])

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        setSubmitSuccess(true)
        setContactForm({ name: '', email: '', type: '', subject: '', message: '' })
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        const data = await res.json()
        setSubmitError(data.error || 'Failed to send message')
      }
    } catch { setSubmitError('Failed to send. Please try again.') }
    finally { setSubmitting(false) }
  }

  // ============================================================
  // SECTION DATA
  // ============================================================

  const stats = [
    { value: '8', label: 'Departments', icon: <Layers className="h-4 w-4" /> },
    { value: '11', label: 'AI Tools', icon: <Brain className="h-4 w-4" /> },
    { value: '14', label: 'Integrations', icon: <Network className="h-4 w-4" /> },
    { value: '99.9%', label: 'Uptime SLA', icon: <Activity className="h-4 w-4" /> },
  ]

  const departments = [
    { id: 'projects', icon: <FolderKanban className="h-5 w-5" />, name: 'Project Management', desc: 'Gantt charts, Kanban boards, sprint planning, OKRs, and resource management. Support for Agile, Waterfall, and Hybrid methodologies.', features: ['Gantt & Timeline Views', 'Kanban Boards', 'Sprint Planning', 'OKR Tracking', 'RAID Management'] },
    { id: 'sales', icon: <TrendingUp className="h-5 w-5" />, name: 'Sales CRM', desc: 'Full pipeline management with AI deal scoring, revenue forecasting, quote generation, and email intelligence.', features: ['Lead Scoring', 'Pipeline Management', 'Revenue Forecasting', 'Quote Generation', 'Attribution Modeling'] },
    { id: 'finance', icon: <DollarSign className="h-5 w-5" />, name: 'Finance', desc: 'Budget tracking, expense management, invoice generation, and AI-powered budget forecasting across all projects.', features: ['Budget vs Actual', 'Invoice Management', 'Expense Tracking', 'Rate Cards', 'Financial Reporting'] },
    { id: 'it', icon: <Monitor className="h-5 w-5" />, name: 'IT Services', desc: 'Ticket management, asset tracking, deployment monitoring, SLA enforcement, and security management.', features: ['Ticket System', 'Asset Management', 'SLA Monitoring', 'Deployment Tracking', 'License Management'] },
    { id: 'hr', icon: <UserPlus className="h-5 w-5" />, name: 'Recruitment & HR', desc: 'Full ATS with job posting, candidate tracking, interview scheduling, offer management, and onboarding.', features: ['Job Postings', 'Candidate Pipeline', 'Interview Scheduling', 'Offer Management', 'Employee Onboarding'] },
    { id: 'ops', icon: <Wrench className="h-5 w-5" />, name: 'Operations', desc: 'Work orders, asset management, maintenance scheduling, vendor management, and compliance tracking.', features: ['Work Orders', 'Asset Tracking', 'Maintenance Scheduling', 'Vendor Management', 'Compliance Monitoring'] },
    { id: 'cs', icon: <Headphones className="h-5 w-5" />, name: 'Customer Service', desc: 'Support tickets, case management, knowledge base, contact center, and SLA tracking.', features: ['Ticket Management', 'Knowledge Base', 'SLA Tracking', 'Contact Center', 'Customer Satisfaction'] },
  ]

  const aiAgents = [
    { name: 'Standup Reporter', desc: 'Generates daily team summaries at 9 AM', icon: <FileText className="h-4 w-4" /> },
    { name: 'Sprint Planner', desc: 'Optimizes task distribution by capacity', icon: <Zap className="h-4 w-4" /> },
    { name: 'Budget Guardian', desc: 'Monitors spending 24/7, alerts on overruns', icon: <DollarSign className="h-4 w-4" /> },
    { name: 'Lead Qualifier', desc: 'Scores and routes inbound leads instantly', icon: <TrendingUp className="h-4 w-4" /> },
    { name: 'SLA Monitor', desc: 'Auto-escalates tickets before breach', icon: <Shield className="h-4 w-4" /> },
    { name: 'Risk Scanner', desc: 'Scans projects weekly for emerging risks', icon: <AlertTriangle className="h-4 w-4" /> },
  ]

  const integrations = [
    { name: 'Slack', emoji: '💬' }, { name: 'Teams', emoji: '👥' }, { name: 'Google', emoji: '📧' },
    { name: 'Microsoft 365', emoji: '📎' }, { name: 'GitHub', emoji: '🐙' }, { name: 'GitLab', emoji: '🦊' },
    { name: 'Jira', emoji: '🔷' }, { name: 'Zapier', emoji: '⚡' }, { name: 'QuickBooks', emoji: '💰' },
    { name: 'Stripe', emoji: '💳' }, { name: 'Salesforce', emoji: '☁️' }, { name: 'HubSpot', emoji: '🧡' },
    { name: 'DocuSign', emoji: '✍️' }, { name: 'Figma', emoji: '🎨' },
  ]

  const securityFeatures = [
    { icon: <Shield className="h-5 w-5" />, label: 'SOC 2 Ready' },
    { icon: <Globe className="h-5 w-5" />, label: 'GDPR Compliant' },
    { icon: <Lock className="h-5 w-5" />, label: 'AES-256 Encryption' },
    { icon: <Shield className="h-5 w-5" />, label: 'AWS WAF' },
    { icon: <Lock className="h-5 w-5" />, label: 'MFA / 2FA' },
    { icon: <Users className="h-5 w-5" />, label: 'SSO / SAML' },
    { icon: <FileText className="h-5 w-5" />, label: 'Audit Logs' },
    { icon: <Layers className="h-5 w-5" />, label: '11 User Roles' },
  ]

  const pricingPlans = [
    { name: 'Free', price: '$0', period: 'month', desc: 'For individuals getting started', features: ['Up to 10 users', '1 project', '100 MB storage', '10 automations/month', 'Basic support'], popular: false, cta: 'Get Started' },
    { name: 'Starter', price: billingPeriod === 'monthly' ? '$8' : '$76', period: billingPeriod === 'monthly' ? 'user/month' : 'user/year', desc: 'For growing teams', features: ['Up to 10 users', '100 projects', '20 GB storage', '100 automations/month', 'Email support'], popular: false, cta: 'Start Free Trial' },
    { name: 'Professional', price: billingPeriod === 'monthly' ? '$15' : '$144', period: billingPeriod === 'monthly' ? 'user/month' : 'user/year', desc: 'AI-powered insights for teams', features: ['Up to 50 users', 'Unlimited projects', '50 GB storage', '250 automations/month', '50 AI queries/month', 'Priority support'], popular: true, cta: 'Start Free Trial' },
    { name: 'Business', price: billingPeriod === 'monthly' ? '$25' : '$240', period: billingPeriod === 'monthly' ? 'user/month' : 'user/year', desc: 'Premium AI & enterprise infra', features: ['Unlimited users', 'Unlimited projects', '250 GB storage', 'Unlimited automations', '500 AI queries/month', 'AWS Aurora database', '24/7 priority support'], popular: false, cta: 'Start Free Trial' },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large organizations', features: ['Everything in Business', 'Unlimited AI queries', 'Unlimited storage', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-labeling'], popular: false, cta: 'Contact Sales' },
  ]

  const faqs = [
    { q: 'What is wrkportal?', a: 'wrkportal is an AI-powered enterprise platform that unifies project management, sales CRM, finance, HR, IT services, operations, and customer service into one system. Every department works from the same data, and AI understands it all.' },
    { q: 'How is this different from using Monday.com + Salesforce + ServiceNow separately?', a: 'With separate tools, data lives in silos. Your sales team closes a deal but the delivery team has no context. wrkportal connects everything — when a deal closes, the project team already has the details. One platform, one source of truth, one subscription.' },
    { q: 'What AI features are included?', a: 'wrkportal includes 11 AI tools (risk prediction, budget forecasting, meeting notes extraction, status report generation, and more) plus 6 autonomous AI agents that work in the background — monitoring budgets, qualifying leads, tracking SLAs, and generating standup reports.' },
    { q: 'Is my data secure?', a: 'Yes. wrkportal runs on AWS with encryption at rest (AES-256 via KMS) and in transit (TLS 1.3). We offer MFA, SSO/SAML, role-based access control with 11 user roles, WAF protection, audit logging via CloudTrail, and threat detection via GuardDuty.' },
    { q: 'Can I try it before purchasing?', a: 'Absolutely. The Free plan lets you explore all core features with up to 10 users and 1 project. No credit card required. Paid plans come with a 14-day free trial.' },
    { q: 'Can I white-label wrkportal for my clients?', a: 'Yes. Enterprise plans include white-labeling — upload your logo, set brand colors, use a custom domain, and customize email branding. Your clients see your brand, not ours.' },
  ]

  const activeDept = departments.find(d => d.id === activeTab) || departments[0]

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ==================== NAVBAR ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="wrkportal" className="h-20 w-20 object-contain" />
            </div>
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#ai" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">AI</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/login')} className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
              <Button onClick={() => router.push('/signup')} className="bg-gray-900 text-white hover:bg-gray-800">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139,92,246,0.2) 0%, transparent 50%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Copy */}
            <div>
              <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered Enterprise Platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                One platform for{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  every department
                </span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
                Projects, Sales, Finance, HR, IT, Operations, and Customer Service — unified in one system with AI that understands your entire business.
              </p>
              <div className="flex items-center gap-4 mb-10">
                <Button size="lg" onClick={() => router.push('/signup')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 h-12">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5 h-12 px-8">
                  Book a Demo
                </Button>
              </div>
              <p className="text-sm text-gray-500">Free plan available. No credit card required.</p>
            </div>

            {/* Right - CSS Dashboard Mockup */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl blur-2xl" />

                {/* Dashboard mockup */}
                <div className="relative bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
                  {/* Header bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-gray-800 rounded-md px-4 py-1 text-[10px] text-gray-500">www.wrkportal.com</div>
                    </div>
                  </div>

                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-14 bg-gray-900/50 border-r border-gray-800 py-3 space-y-3">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`mx-3 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-gray-700/50'}`} />
                      ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2">
                        {['#6366f1', '#8b5cf6', '#ec4899', '#10b981'].map((color, i) => (
                          <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                            <div className="h-1.5 w-8 rounded-full bg-gray-600 mb-2" />
                            <div className="h-3 w-12 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
                          </div>
                        ))}
                      </div>

                      {/* Chart area */}
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                        <div className="h-1.5 w-20 rounded-full bg-gray-600 mb-4" />
                        <div className="flex items-end gap-1.5 h-24">
                          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500/40 to-indigo-500/80 transition-all" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>

                      {/* Table rows */}
                      <div className="space-y-1.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-800/20 rounded-md p-2 border border-gray-700/20">
                            <div className="w-6 h-6 rounded-full bg-gray-700/50" />
                            <div className="flex-1 h-1.5 rounded-full bg-gray-700/40" />
                            <div className="w-12 h-1.5 rounded-full bg-indigo-500/30" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS BAR ==================== */}
      <section className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-indigo-500">{stat.icon}</span>
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES / DEPARTMENTS ==================== */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gray-100 text-gray-700 border-gray-200">All-in-One Platform</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Replace 10+ tools with one
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every department works from the same system. When sales closes a deal, the project team already has context. No more silos.
            </p>
          </div>

          {/* Department tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveTab(dept.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === dept.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {dept.icon}
                <span className="hidden sm:inline">{dept.name}</span>
              </button>
            ))}
          </div>

          {/* Active department detail */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{activeDept.name}</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">{activeDept.desc}</p>
              <div className="space-y-3">
                {activeDept.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-8 bg-gray-900 text-white hover:bg-gray-800" onClick={() => router.push('/signup')}>
                Try {activeDept.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Department visual - CSS mockup */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
              <div className="space-y-4">
                {/* Mini stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  {activeDept.features.slice(0, 3).map((f, i) => (
                    <div key={f} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                      <div className="text-xs text-gray-400 mb-1">{f}</div>
                      <div className="text-xl font-bold text-gray-900">{[142, 38, 94][i]}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        +{[12, 8, 15][i]}%
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mini table */}
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Recent Activity</span>
                    <Badge variant="secondary" className="text-[10px]">Live</Badge>
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">{['AP', 'SK', 'MR', 'JD'][i]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-700">{['Updated project status', 'Completed sprint review', 'Added new team member', 'Closed quarterly report'][i]}</div>
                        <div className="text-xs text-gray-400">{['2m ago', '15m ago', '1h ago', '3h ago'][i]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== AI SECTION ==================== */}
      <section id="ai" className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
              <Brain className="h-3 w-3 mr-1" />
              Artificial Intelligence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              AI that works while you sleep
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Not just AI that answers questions — autonomous agents that do the work. Your standup report writes itself at 9 AM. Budgets get monitored 24/7. Leads get scored instantly.
            </p>
          </div>

          {/* AI Agents Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {aiAgents.map((agent) => (
              <div key={agent.name} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    {agent.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{agent.name}</h4>
                    <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">Autonomous</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>

          {/* AI Tools count */}
          <div className="text-center">
            <p className="text-gray-400 mb-6">Plus 11 AI tools: Risk Predictor, Budget Forecaster, Meeting Notes AI, Status Report Generator, Task Assignment AI, Semantic Search, and more.</p>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5" onClick={() => router.push('/signup')}>
              Explore AI Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== INTEGRATIONS ==================== */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connects to your existing tools</h2>
            <p className="text-gray-500">Don't rip and replace. wrkportal works alongside the tools you already use.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-lg">{int.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECURITY ==================== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise-grade security</h2>
            <p className="text-gray-500">Built on AWS. Your CISO will approve this.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {securityFeatures.map((feat) => (
              <div key={feat.label} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-5 py-3 border border-gray-200">
                <span className="text-indigo-500">{feat.icon}</span>
                <span className="text-sm font-medium text-gray-700">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 mb-6">Start free. Scale as you grow. No surprises.</p>
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                Yearly <span className="text-green-600 text-xs ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-500 text-white border-0">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500 ml-1">/{plan.period}</span>}
                  </div>
                  <Button
                    className={`w-full mb-4 ${plan.popular ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    size="sm"
                    onClick={() => plan.name === 'Enterprise' ? document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) : router.push('/signup')}
                  >
                    {plan.cta}
                  </Button>
                  <div className="space-y-2">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600">{feat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${openFAQ === i ? 'rotate-180' : ''}`} />
                </button>
                {openFAQ === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}
      <section id="contact" className="py-24 bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in touch</h2>
            <p className="text-gray-500">Have questions? Want a demo? We'd love to hear from you.</p>
          </div>

          <Card className="border-gray-200 shadow-lg">
            <CardContent className="p-8">
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm">Thank you! We'll get back to you soon.</p>
                </div>
              )}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleContact} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Name *</Label>
                    <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email *</Label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@company.com" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Inquiry Type *</Label>
                    <Select value={contactForm.type} onValueChange={(v) => setContactForm({ ...contactForm, type: v })} required>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="query">General Query</SelectItem>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subject</Label>
                    <Input value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="Brief subject" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Message *</Label>
                  <Textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Tell us more..." rows={5} required />
                </div>
                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11" disabled={submitting}>
                  {submitting ? 'Sending...' : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className="py-20 bg-gradient-to-r from-slate-950 to-indigo-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to unify your business?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join teams that replaced 10+ separate tools with one platform. Start free — upgrade when you're ready.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => router.push('/signup')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 h-12">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-white/5 h-12 px-8" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#ai" className="block hover:text-white transition-colors">AI Tools</a>
                <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
                <Link href="/blog" className="block hover:text-white transition-colors">Blog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Departments</h4>
              <div className="space-y-2 text-sm">
                <p className="hover:text-white transition-colors cursor-pointer">Project Management</p>
                <p className="hover:text-white transition-colors cursor-pointer">Sales CRM</p>
                <p className="hover:text-white transition-colors cursor-pointer">Finance</p>
                <p className="hover:text-white transition-colors cursor-pointer">IT Services</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#contact" className="block hover:text-white transition-colors">Contact</a>
                <Link href="/terms" className="block hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/security" className="block hover:text-white transition-colors">Security</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <p className="hover:text-white transition-colors cursor-pointer">Documentation</p>
                <p className="hover:text-white transition-colors cursor-pointer">API Reference</p>
                <p className="hover:text-white transition-colors cursor-pointer">System Status</p>
                <p className="hover:text-white transition-colors cursor-pointer">help@wrkportal.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="wrkportal" className="h-10 w-10 object-contain brightness-200" />
              <span className="text-sm text-gray-500">&copy; {new Date().getFullYear()} wrkportal.com. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">Built on AWS</span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-600">Powered by AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
