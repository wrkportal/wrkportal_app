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
    ArrowRight,
    Sparkles,
    Target,
    Users,
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    CheckCircle2,
    Brain,
    Rocket,
    Clock,
    DollarSign,
    AlertTriangle,
    MessageSquare,
    Search,
    FileText,
    Calendar,
    ChevronRight,
    Globe,
    Lock,
    Layers,
    Activity,
    Database,
    Star,
    Award,
    Play,
    Bot,
    Cpu,
    Network,
    Atom,
    Send,
    ChevronDown,
    Check,
    X,
    PenTool,
    Image as ImageIcon,
    Video,
    Plus,
    Lightbulb,
    Palette,
    Briefcase,
    ClipboardList,
    UserCheck,
} from "lucide-react"

// Helper functions
const hasVisitedBefore = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('hasVisitedBefore') === 'true'
}

const markAsVisited = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem('hasVisitedBefore', 'true')
}

// Animated Background Component
const AnimatedBackground = () => {
    const [dots, setDots] = useState<Array<{ left: number; top: number; delay: number; duration: number }>>([])

    useEffect(() => {
        setDots(
            Array.from({ length: 50 }, () => ({
                left: Math.random() * 100,
                top: Math.random() * 100,
                delay: Math.random() * 3,
                duration: 2 + Math.random() * 2,
            }))
        )
    }, [])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-white opacity-90"></div>
            {dots.map((dot, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-purple-500 rounded-full opacity-40 animate-pulse shadow-lg shadow-purple-400"
                    style={{
                        left: `${dot.left}%`,
                        top: `${dot.top}%`,
                        animationDelay: `${dot.delay}s`,
                        animationDuration: `${dot.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

// Floating Glow Orbs
const FloatingOrb = ({ delay = 0, size = 200, x = 50, y = 50, color = "purple" }: { delay?: number; size?: number; x?: number; y?: number; color?: string }) => {
    const colorClasses = {
        purple: "bg-purple-200/60 shadow-lg shadow-purple-300/50",
        pink: "bg-pink-200/60 shadow-lg shadow-pink-300/50",
        blue: "bg-blue-200/60 shadow-lg shadow-blue-300/50",
    }
    return (
        <div
            className={`absolute rounded-full blur-3xl ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple} animate-pulse`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

// Typing Effect Component
const TypingFeatureText = ({ features, className = "" }: { features: string[]; className?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [displayText, setDisplayText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentText = features[currentIndex] || ""
        let timeoutId: NodeJS.Timeout

        if (!isDeleting && displayText.length < currentText.length) {
            timeoutId = setTimeout(() => {
                setDisplayText(currentText.slice(0, displayText.length + 1))
            }, 100)
        } else if (!isDeleting && displayText.length === currentText.length) {
            timeoutId = setTimeout(() => {
                setIsDeleting(true)
            }, 2000)
        } else if (isDeleting && displayText.length > 0) {
            timeoutId = setTimeout(() => {
                setDisplayText(currentText.slice(0, displayText.length - 1))
            }, 50)
        } else if (isDeleting && displayText.length === 0) {
            setIsDeleting(false)
            setCurrentIndex((prev) => (prev + 1) % features.length)
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [displayText, isDeleting, currentIndex, features])

    useEffect(() => {
        setDisplayText("")
        setIsDeleting(false)
    }, [currentIndex])

    return (
        <span className={`inline-block min-w-[300px] text-left ${className}`}>
            {displayText}
            <span className="animate-pulse text-purple-600">|</span>
        </span>
    )
}

// Floating Feature Card
const FloatingFeatureCard = ({
    title,
    gradient,
    onClick,
    isSelected = false
}: {
    title: string;
    gradient: string;
    onClick?: () => void;
    isSelected?: boolean;
}) => {
    return (
        <div
            className={`relative border-2 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer group ${isSelected
                ? `border-purple-400 shadow-xl shadow-purple-300/50 bg-gradient-to-br from-purple-50 to-pink-50`
                : 'border-purple-200 bg-white/80 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 shadow-md'
                }`}
            onClick={onClick}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient} ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                } transition-opacity duration-300`}></div>
            <div className="relative px-6 py-4 flex items-center justify-center min-h-[60px]">
                {isSelected && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
                )}
                <h3 className={`relative text-base font-semibold text-center transition-all duration-300 ${isSelected
                    ? 'text-purple-700'
                    : 'text-purple-600 group-hover:text-purple-700'
                    }`}>
                    {title}
                </h3>
                {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-400"></div>
                )}
            </div>
        </div>
    )
}

// Feature Detail Card
const FeatureDetailCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) => {
    return (
        <Card className="border-2 border-purple-200 bg-white/90 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-200/50 hover:scale-105 group animate-fade-in-up shadow-lg">
            <CardContent className="p-5 relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 mb-3 shadow-lg shadow-purple-300/50 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-2">{title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    )
}

// Accordion Component for FAQ
const AccordionItem = ({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) => {
    return (
        <Card className="border-2 border-purple-200 overflow-hidden transition-all duration-300 hover:border-purple-300 bg-white/90 backdrop-blur-sm shadow-md">
            <button
                onClick={onToggle}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-purple-50 transition-colors"
            >
                <span className="font-semibold text-lg pr-8 text-gray-800">{question}</span>
                <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-5 w-5 text-purple-600" />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {answer}
                </div>
            </div>
        </Card>
    )
}

// Contact Form Component
const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        type: '',
        subject: '',
        message: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
                setFormData({
                    name: '',
                    email: '',
                    type: '',
                    subject: '',
                    message: ''
                })
                setTimeout(() => setSuccess(false), 5000)
            } else {
                setError(data.error || 'Failed to send message')
            }
        } catch (err) {
            setError('Failed to send message. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card className="border-2 border-purple-200 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                        <p>Thank you! We'll get back to you soon.</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 shadow-md">
                        <AlertTriangle className="h-5 w-5" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700 font-medium">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your name"
                                required
                                className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your.email@company.com"
                                required
                                className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-gray-700 font-medium">Inquiry Type *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                                required
                            >
                                <SelectTrigger className="bg-white border-purple-200 text-gray-800 focus:border-purple-400 shadow-sm">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="query">General Query</SelectItem>
                                    <SelectItem value="suggestion">Suggestion</SelectItem>
                                    <SelectItem value="pricing">Pricing Request</SelectItem>
                                    <SelectItem value="demo">Request Demo</SelectItem>
                                    <SelectItem value="support">Technical Support</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-gray-700 font-medium">Subject</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Brief subject"
                                className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-gray-700 font-medium">Message *</Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us more about your inquiry..."
                            rows={6}
                            required
                            className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 shadow-sm"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-300/50"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Message
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function LandingPage() {
    const router = useRouter()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
    const [openFAQ, setOpenFAQ] = useState<number | null>(1)
    const [selectedCategory, setSelectedCategory] = useState<'projects' | 'reporting' | 'clients' | 'tasks'>('projects')

    useEffect(() => {
        markAsVisited()
        document.title = "wrkportal.com - AI-Powered Business Platform"
    }, [])

    // Feature details for each category
    const categoryFeatures = {
        projects: [
            { icon: Target, title: "Project Planning", description: "Create detailed project plans with timelines and milestones" },
            { icon: Calendar, title: "Timeline Management", description: "Visual Gantt charts and timeline tracking" },
            { icon: Users, title: "Team Collaboration", description: "Assign tasks and collaborate with your team" },
            { icon: TrendingUp, title: "Progress Tracking", description: "Monitor project health and progress in real-time" },
            { icon: AlertTriangle, title: "Risk Management", description: "Identify and mitigate project risks proactively" },
        ],
        reporting: [
            { icon: BarChart3, title: "Dashboard Reports", description: "Interactive dashboards with real-time data visualization" },
            { icon: FileText, title: "Executive Summaries", description: "Generate comprehensive executive reports automatically" },
            { icon: TrendingUp, title: "Analytics & Insights", description: "Deep analytics and predictive insights" },
            { icon: Activity, title: "Performance Metrics", description: "Track KPIs and performance indicators" },
            { icon: Database, title: "Custom Reports", description: "Build custom reports tailored to your needs" },
        ],
        clients: [
            { icon: UserCheck, title: "Client Profiles", description: "Maintain comprehensive client information and history" },
            { icon: MessageSquare, title: "Communication Hub", description: "Centralized communication and messaging" },
            { icon: FileText, title: "Project Portals", description: "Dedicated portals for client collaboration" },
            { icon: Shield, title: "Secure Access", description: "Role-based access control and permissions" },
            { icon: CheckCircle2, title: "Client Satisfaction", description: "Track feedback and satisfaction metrics" },
        ],
        tasks: [
            { icon: ClipboardList, title: "Task Lists", description: "Organize tasks with lists and boards" },
            { icon: Clock, title: "Time Tracking", description: "Track time spent on tasks and projects" },
            { icon: Zap, title: "Task Automation", description: "Automate recurring tasks and workflows" },
            { icon: CheckCircle2, title: "Status Management", description: "Track task status and completion" },
            { icon: Users, title: "Task Assignment", description: "Assign and delegate tasks to team members" },
        ],
    }

    const handleCtaClick = () => {
        const isReturningVisitor = hasVisitedBefore()
        if (isReturningVisitor) {
            router.push('/login')
        } else {
            router.push('/signup')
        }
    }

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index)
    }

    const pricingPlans = [
        {
            name: "Free",
            price: billingPeriod === 'monthly' ? "$0" : "$0",
            period: "month",
            description: "Perfect for individuals and small teams getting started",
            features: [
                "Up to 10 users",
                "1 project",
                "100 MB storage",
                "10 automations/month",
                "Basic support",
                "All core features",
            ],
            popular: false,
            cta: "Get Started",
        },
        {
            name: "Starter",
            price: billingPeriod === 'monthly' ? "$8" : "$76",
            period: billingPeriod === 'monthly' ? "user/month" : "user/year",
            description: "Best for growing teams and small businesses",
            features: [
                "Up to 10 users",
                "100 projects",
                "20 GB storage",
                "100 automations/month",
                "Email support",
                "All Starter features",
            ],
            popular: false,
            cta: "Start Free Trial",
        },
        {
            name: "Professional",
            price: billingPeriod === 'monthly' ? "$15" : "$144",
            period: billingPeriod === 'monthly' ? "user/month" : "user/year",
            description: "For professional teams that need AI-powered insights",
            features: [
                "Up to 50 users",
                "Unlimited projects",
                "50 GB storage",
                "250 automations/month",
                "50 AI queries/month (GPT-3.5)",
                "Priority email support",
            ],
            popular: true,
            cta: "Start Free Trial",
        },
        {
            name: "Business",
            price: billingPeriod === 'monthly' ? "$25" : "$240",
            period: billingPeriod === 'monthly' ? "user/month" : "user/year",
            description: "For organizations that need premium AI and enterprise infrastructure",
            features: [
                "Unlimited users",
                "Unlimited projects",
                "250 GB storage",
                "Unlimited automations",
                "500 AI queries/month (GPT-4 Turbo)",
                "AWS Aurora database (HIPAA/FedRAMP available)",
                "24/7 priority support",
            ],
            popular: false,
            cta: "Start Free Trial",
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For large organizations with advanced security and compliance needs",
            features: [
                "Unlimited users",
                "Unlimited projects",
                "Unlimited storage",
                "Unlimited automations",
                "Unlimited AI queries (GPT-4 Turbo)",
                "AWS Aurora multi-AZ (HIPAA/FedRAMP)",
                "Dedicated account manager",
                "Custom integrations",
                "SLA guarantee",
            ],
            popular: false,
            cta: "Contact Sales",
        },
    ]

    const faqs = [
        {
            question: "What Is wrkportal.com AI-Powered Platform?",
            answer: "wrkportal.com is an advanced AI-powered business platform that combines intelligent automation with comprehensive management tools. It uses machine learning to predict risks, optimize resources, and automate decision-making, helping teams deliver projects faster and more efficiently across Project Management, Sales, Finance, Ops Management, Recruitment, IT, and Customer Service."
        },
        {
            question: "What platforms does wrkportal.com support?",
            answer: "wrkportal.com is a comprehensive business platform supporting Project Management, Sales & CRM, Finance & Accounting, Ops Management, Recruitment & HR, IT & Development, and Customer Service - all in one unified platform."
        },
        {
            question: "Is there a limitation on how much content I can generate?",
            answer: "Limits vary by plan. Our Free plan offers limited generation capacity, while Starter and Enterprise plans provide extended or unlimited capabilities. Check our pricing section for specific details on each plan's limits and features."
        },
        {
            question: "What Languages does it support?",
            answer: "wrkportal.com supports multiple languages and can process content in various languages for international teams. The AI features are optimized for English but support multilingual workflows for global collaboration."
        },
        {
            question: "What is AI-Powered Management and how do I use it?",
            answer: "AI-Powered Management uses machine learning algorithms to analyze business data, predict risks, optimize resource allocation, and generate insights automatically. Simply start using wrkportal.com, and our AI will begin analyzing patterns, suggesting optimizations, and providing predictive analytics to help you manage more effectively across all platforms."
        },
        {
            question: "Is it helpful for different business functions?",
            answer: "Absolutely! wrkportal.com is designed for Project Managers, Sales Teams, Finance Departments, Ops Managers, HR Teams, IT Departments, and Customer Service Teams. The AI-powered features help automate routine tasks, predict potential issues, and provide actionable insights that make management more efficient and effective across all business functions."
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 text-gray-900 overflow-hidden relative">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Floating Orbs */}
            <FloatingOrb delay={0} size={300} x={10} y={10} color="purple" />
            <FloatingOrb delay={1} size={250} x={80} y={20} color="pink" />
            <FloatingOrb delay={2} size={200} x={50} y={70} color="blue" />

            {/* Fixed Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-200/50 bg-white/90 backdrop-blur-xl shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-36 w-36 items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="wrkportal.com"
                                    className="relative h-36 w-36 rounded-xl object-contain"
                                    style={{ mixBlendMode: 'normal' }}
                                />
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-8">
                            <a href="#ai-tools" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
                                AI Tools
                            </a>
                            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
                                Features
                            </a>
                            <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
                                Pricing
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => router.push('/login')} className="text-gray-700 hover:text-purple-600 hover:bg-purple-50">
                                Sign In
                            </Button>
                            <Button
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-300/50"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-4 pb-4">
                {/* Animated Grid Background */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                                            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                        animation: 'grid-move 20s linear infinite',
                    }}></div>
                </div>

                {/* Animated Gradient Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-pulse shadow-lg shadow-purple-300/30" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl animate-pulse shadow-lg shadow-pink-300/30" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl animate-pulse shadow-lg shadow-blue-300/30" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
                        {/* Badge with Animation */}
                        <Badge className="mb-4 px-6 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md animate-fade-in-up">
                            <Sparkles className="mr-2 h-4 w-4 animate-spin text-purple-600" style={{ animationDuration: '3s' }} />
                            The Only Platform You Need
                        </Badge>

                        {/* Main Headline */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <span className="block text-gray-900 mb-2">One Platform for</span>
                            <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                                <TypingFeatureText
                                    features={[
                                        "Project Management",
                                        "Sales & CRM",
                                        "Finance & Accounting",
                                        "Ops Management",
                                        "Recruitment & HR",
                                        "IT & Development",
                                        "Customer Service"
                                    ]}
                                    className="text-purple-400"
                                />
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-4 max-w-4xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            The all-in-one platform for Project Management, Sales, Finance, Ops Management, Recruitment, IT, and Customer Service
                            <span className="block mt-2 text-lg text-purple-600 font-medium">
                                Everything your business needs, powered by AI
                            </span>
                        </p>

                        {/* Feature Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 my-8 w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <FloatingFeatureCard
                                title="Projects"
                                gradient="from-purple-600 to-pink-600"
                                onClick={() => setSelectedCategory('projects')}
                                isSelected={selectedCategory === 'projects'}
                            />
                            <FloatingFeatureCard
                                title="Reporting"
                                gradient="from-blue-600 to-purple-600"
                                onClick={() => setSelectedCategory('reporting')}
                                isSelected={selectedCategory === 'reporting'}
                            />
                            <FloatingFeatureCard
                                title="Clients"
                                gradient="from-pink-600 to-orange-600"
                                onClick={() => setSelectedCategory('clients')}
                                isSelected={selectedCategory === 'clients'}
                            />
                            <FloatingFeatureCard
                                title="Tasks"
                                gradient="from-indigo-600 to-blue-600"
                                onClick={() => setSelectedCategory('tasks')}
                                isSelected={selectedCategory === 'tasks'}
                            />
                        </div>

                        {/* Feature Details Cards */}
                        <div className="w-full max-w-6xl mt-8 mb-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {categoryFeatures[selectedCategory].map((feature, index) => (
                                    <FeatureDetailCard
                                        key={index}
                                        icon={feature.icon}
                                        title={feature.title}
                                        description={feature.description}
                                        delay={index * 0.1}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <Button
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-10 py-7 shadow-2xl shadow-purple-300/50 hover:shadow-purple-400/70 transition-all duration-300 hover:scale-105 group"
                            >
                                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                                Get Started Free
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleCtaClick}
                                className="text-lg px-10 py-7 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:scale-105 transition-all duration-300 group shadow-md"
                            >
                                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                Watch Demo
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span>No Credit Card Required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span>Free Trial Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span>Cancel Anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Writing Tools Section */}
            <section id="ai-tools" className="relative py-16 overflow-hidden bg-gradient-to-br from-purple-50/60 via-pink-50/40 to-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                        <div className="space-y-6">
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-4">
                                <PenTool className="mr-2 h-3 w-3 text-purple-600" />
                                AI Writing Tools
                            </Badge>
                            <h2 className="text-5xl font-black text-gray-900 mb-4">
                                Write ✍️ Better Content Faster
                            </h2>
                            <p className="text-xl text-gray-700 mb-2 font-medium">
                                The Future of AI Writing Tools is Finally here
                            </p>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                Mastering the Art of AI Content Writing: Unleashing the Power of Automated Creativity
                            </p>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <span>Multiple use cases and templates to pick from to meet all of your writing demands</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <span>Communicate with your customers with emotions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <span>Choose the best AI copy for your message & save as a document</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white mt-6 shadow-lg shadow-purple-300/50"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Get Started
                            </Button>
                        </div>
                        <div className="relative">
                            <Card className="border-2 border-purple-200 bg-white/95 backdrop-blur-sm overflow-hidden shadow-xl">
                                <CardContent className="p-8">
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 space-y-4 shadow-md">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-purple-200 rounded w-3/4 shadow-sm"></div>
                                            <div className="h-4 bg-purple-100 rounded w-1/2 shadow-sm"></div>
                                        </div>
                                        <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded mt-4 flex items-center justify-center shadow-inner">
                                            <PenTool className="h-12 w-12 text-purple-500 opacity-60" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Chat Bot Section */}
            <section className="relative py-32 overflow-hidden bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                        <div className="relative">
                            <Card className="border-2 border-purple-200 bg-white/95 backdrop-blur-sm overflow-hidden shadow-xl">
                                <CardContent className="p-8">
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 space-y-4 shadow-md">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Bot className="h-6 w-6 text-purple-600" />
                                            <span className="text-purple-700 font-semibold">Chat Assistant</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="bg-white rounded-lg p-3 text-sm text-gray-700 shadow-sm border border-purple-100">
                                                How can I help with your project?
                                            </div>
                                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 text-sm text-gray-700 ml-auto w-3/4 shadow-sm border border-purple-200">
                                                Show me risk predictions
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-4">
                                <Bot className="mr-2 h-3 w-3 text-purple-600" />
                                AI Chat Bot
                            </Badge>
                            <h2 className="text-5xl font-black text-gray-900 mb-4">
                                Chat 🤖 Smarter, Not Harder
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                With wrkportal.com AI, you can chat smarter, not harder. Master the art of AI-powered conversations and unleash the power of automated intelligence for your projects.
                            </p>
                            <Button
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-300/50"
                            >
                                Start Chat
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Video Generator Section */}
            <section className="relative py-32 overflow-hidden bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                        <div className="space-y-6">
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-4">
                                <Video className="mr-2 h-3 w-3 text-purple-600" />
                                AI Video Generator
                            </Badge>
                            <h2 className="text-5xl font-black text-gray-900 mb-4">
                                A Wonderful Video May Be Created by Anyone
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                That includes you. By leveraging our leading AI text-to-speech reader, you can breeze through presentations, reports, and documentation with ease.
                            </p>
                            <Button
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-300/50"
                            >
                                Try AI Video
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Card className="border-2 border-purple-200 bg-white/95 backdrop-blur-sm overflow-hidden shadow-xl">
                                <CardContent className="p-8">
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 space-y-4 shadow-md">
                                        <div className="aspect-video bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center shadow-inner">
                                            <Play className="h-16 w-16 text-purple-600 opacity-60" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Image Generator Section */}
            <section className="relative py-32 overflow-hidden bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="grid grid-cols-3 gap-4">
                            {[...Array(9)].map((_, i) => (
                                <Card key={i} className="border-2 border-purple-200 bg-white/95 backdrop-blur-sm aspect-square overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                    <CardContent className="p-0 h-full">
                                        <div className={`h-full w-full bg-gradient-to-br ${i % 3 === 0 ? 'from-purple-200 to-pink-200' :
                                            i % 3 === 1 ? 'from-blue-200 to-purple-200' :
                                                'from-pink-200 to-orange-200'
                                            } flex items-center justify-center shadow-inner`}>
                                            <ImageIcon className="h-8 w-8 text-purple-500/50" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-4">
                                <ImageIcon className="mr-2 h-3 w-3 text-purple-600" />
                                AI Image Generator
                            </Badge>
                            <h2 className="text-5xl font-black text-gray-900 mb-4">
                                Generate Outstanding AI Images Just Using Prompt 💡
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                wrkportal.com is an artificial art generator that turns your ideas into one-of-a-kind artwork and photographs in seconds. Finally, you'll have the perfect image to go with your statement.
                            </p>
                            <ul className="space-y-3 text-gray-700 mb-6">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    <span>Multiple Styles</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    <span>Custom Sizes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    <span>Photo-realistic scenes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    <span>Graphics & Vector Graphics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    <span>And Much More</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-300/50"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Generate AI Image
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-6">
                            <Layers className="mr-2 h-4 w-4 text-purple-600" />
                            Platform Features
                        </Badge>
                        <h2 className="text-5xl font-black mb-6 text-gray-900">
                            Everything You Need
                            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">And More</span>
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {[
                            { icon: Briefcase, title: "Project Management", description: "Complete project lifecycle management with planning, execution, tracking, and delivery." },
                            { icon: TrendingUp, title: "Sales & CRM", description: "Lead management, opportunity tracking, pipeline visualization, and sales forecasting." },
                            { icon: DollarSign, title: "Finance & Accounting", description: "Budget management, invoicing, expense tracking, financial reporting, and profitability analysis." },
                            { icon: Activity, title: "Ops Management", description: "Process automation, workflow management, resource allocation, and operational dashboards." },
                            { icon: UserCheck, title: "Recruitment & HR", description: "Job posting, candidate management, interview scheduling, onboarding, and employee tracking." },
                            { icon: Cpu, title: "IT & Development", description: "Issue tracking, sprint planning, release management, and IT service management." },
                            { icon: MessageSquare, title: "Customer Service", description: "Ticket management, customer interaction tracking, SLA monitoring, and support analytics." },
                            { icon: Brain, title: "AI-Powered Intelligence", description: "Advanced AI tools for automation, predictions, insights, and intelligent recommendations across all modules." },
                            { icon: Shield, title: "Enterprise Security", description: "SOC 2, ISO 27001, GDPR compliant with end-to-end encryption and role-based access control." },
                        ].map((feature, index) => (
                            <Card key={index} className="border-2 border-purple-200 bg-white/95 backdrop-blur-sm hover:border-purple-300 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                                <CardContent className="p-8">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 mb-6 shadow-lg shadow-purple-300/50">
                                        <feature.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative py-32 overflow-hidden bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-6">
                            <DollarSign className="mr-2 h-4 w-4 text-purple-600" />
                            Flexible Pricing
                        </Badge>
                        <h2 className="text-5xl font-black mb-6 text-gray-900">
                            Flexible Pricing Plans
                            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">That Fit Your Needs</span>
                        </h2>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Pay Monthly
                            </span>
                            <button
                                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                                className="relative w-14 h-7 bg-purple-500 rounded-full transition-colors shadow-md"
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${billingPeriod === 'yearly' ? 'translate-x-7' : ''}`} />
                            </button>
                            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'} flex items-center gap-2`}>
                                Pay Yearly
                                {billingPeriod === 'yearly' && (
                                    <Badge className="bg-green-500 text-white text-xs shadow-md">
                                        Save 20%
                                    </Badge>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <Card
                                key={index}
                                className={`relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 shadow-lg ${plan.popular
                                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 scale-105 shadow-xl shadow-purple-300/50'
                                    : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-xl'
                                    } backdrop-blur-sm`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg shadow-md">
                                        Popular
                                    </div>
                                )}
                                <CardContent className="p-8">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                                            <span className="text-gray-600">/{plan.period}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">*Billed monthly until cancelled</p>
                                    </div>
                                    <p className="text-gray-600 mb-6">{plan.description}</p>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        onClick={() => router.push('/signup')}
                                        className={`w-full ${plan.popular
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-300/50'
                                            : 'bg-white hover:bg-purple-50 text-purple-700 border-2 border-purple-300 hover:border-purple-400 shadow-md'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="relative py-32 overflow-hidden bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-md mb-6">
                            <MessageSquare className="mr-2 h-4 w-4 text-purple-600" />
                            Frequently Asked Questions
                        </Badge>
                        <h2 className="text-5xl font-black mb-4 text-gray-900">
                            Questions About Our
                            <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                wrkportal.com Platform?
                            </span>
                        </h2>
                        <p className="text-xl text-purple-600 mt-4 font-medium">We have Answers!</p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFAQ === index}
                                onToggle={() => toggleFAQ(index)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative py-32 overflow-hidden bg-gradient-to-r from-purple-100/80 to-pink-100/80">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="relative overflow-hidden border-2 border-purple-200 bg-white/95 backdrop-blur-sm shadow-2xl">
                        <CardContent className="relative p-16 sm:p-24 text-center">
                            <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm rounded-full border border-purple-300 shadow-md">
                                <Brain className="h-5 w-5 text-purple-600" />
                                <span className="text-purple-700 font-semibold">AI-Powered Business Platform</span>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 sm:text-6xl mb-6">
                                Ready to Transform
                                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Your Entire Business?</span>
                            </h2>
                            <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
                                Join thousands of teams using wrkportal.com to manage projects, drive sales, optimize finance, streamline operations, recruit talent, and deliver exceptional customer service.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">500+</div>
                                    <div className="text-sm text-gray-600">Companies</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
                                    <div className="text-sm text-gray-600">Active Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">99.9%</div>
                                    <div className="text-sm text-gray-600">Uptime</div>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-12 py-7 font-bold shadow-2xl shadow-purple-300/50"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start Your Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <p className="mt-6 text-gray-600 text-sm">
                                Free trial available • No credit card required • Full AI access
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Contact Us Section */}
            <section className="relative py-24 overflow-hidden bg-white">
                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                                <MessageSquare className="mr-1 h-3 w-3" />
                                Get In Touch
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Contact Us
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Have a question, suggestion, or want to discuss pricing? We'd love to hear from you!
                            </p>
                        </div>
                        <ContactForm />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative border-t border-purple-200 py-16 bg-white/95 backdrop-blur-sm">
                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative flex h-36 w-36 items-center justify-center">
                                    <img
                                        src="/logo.png"
                                        alt="wrkportal.com"
                                        className="relative h-36 w-36 rounded-xl object-contain"
                                        style={{ mixBlendMode: 'normal' }}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 max-w-md leading-relaxed mb-4">
                                Transform your entire business with artificial intelligence. Manage projects, drive sales, optimize finance, streamline operations, recruit talent, and deliver exceptional customer service - all in one platform.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-purple-200">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <Link href="/privacy" className="hover:text-purple-600 transition-colors">
                                    Privacy Policy
                                </Link>
                                <Link href="/terms" className="hover:text-purple-600 transition-colors">
                                    Terms of Service
                                </Link>
                                <Link href="/security" className="hover:text-purple-600 transition-colors">
                                    Security
                                </Link>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <p>&copy; 2026 wrkportal.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
