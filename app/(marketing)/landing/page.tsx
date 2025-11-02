'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
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
} from "lucide-react"

// Animated particle component
const Particle = ({ delay = 0, duration = 3 }: { delay?: number; duration?: number }) => {
    const [position] = useState({
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration + Math.random() * 2}s`,
    })

    return (
        <div
            className="absolute w-1 h-1 bg-purple-500 rounded-full opacity-30"
            style={{...position, animation: 'subtle-float 6s ease-in-out infinite'}}
        />
    )
}

// AI Neural Network Background
const NeuralNetwork = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const nodes: { x: number; y: number; vx: number; vy: number }[] = []
        const nodeCount = 50

        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
            })
        }

        let animationFrame: number

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Update and draw nodes
            nodes.forEach((node, i) => {
                node.x += node.vx
                node.y += node.vy

                if (node.x < 0 || node.x > canvas.width) node.vx *= -1
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1

                // Draw node
                ctx.beginPath()
                ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'
                ctx.fill()

                // Draw connections
                nodes.forEach((otherNode, j) => {
                    if (i === j) return
                    const dx = node.x - otherNode.x
                    const dy = node.y - otherNode.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 150) {
                        ctx.beginPath()
                        ctx.moveTo(node.x, node.y)
                        ctx.lineTo(otherNode.x, otherNode.y)
                        ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 * (1 - distance / 150)})`
                        ctx.lineWidth = 1
                        ctx.stroke()
                    }
                })
            })

            animationFrame = requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        return () => {
            cancelAnimationFrame(animationFrame)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-30" />
}

// Typewriter effect
const TypewriterText = ({ texts, className = "" }: { texts: string[]; className?: string }) => {
    const [displayText, setDisplayText] = useState("")
    const [textIndex, setTextIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentText = texts[textIndex]
        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (displayText.length < currentText.length) {
                        setDisplayText(currentText.slice(0, displayText.length + 1))
                    } else {
                        setTimeout(() => setIsDeleting(true), 2000)
                    }
                } else {
                    if (displayText.length > 0) {
                        setDisplayText(displayText.slice(0, -1))
                    } else {
                        setIsDeleting(false)
                        setTextIndex((textIndex + 1) % texts.length)
                    }
                }
            },
            isDeleting ? 50 : 100
        )

        return () => clearTimeout(timeout)
    }, [displayText, textIndex, isDeleting, texts])

    return <span className={className}>{displayText}<span className="animate-pulse">|</span></span>
}

// Floating AI Icon
const FloatingAIIcon = ({ icon: Icon, delay = 0, duration = 4 }: { icon: any; delay?: number; duration?: number }) => {
    return (
        <div
            className="absolute opacity-20"
            style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 90 + 5}%`,
                animation: `subtle-float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
        >
            <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50"></div>
                <Icon className="relative h-12 w-12 text-purple-400" />
            </div>
        </div>
    )
}

// AI Data Stream
const DataStream = ({ delay = 0 }: { delay?: number }) => {
    return (
        <div
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-slide-down"
            style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

export default function LandingPage() {
    const router = useRouter()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [activeFeature, setActiveFeature] = useState(0)
    const [scrollY, setScrollY] = useState(0)
    const [statsInView, setStatsInView] = useState(false)
    const statsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStatsInView(true)
                }
            },
            { threshold: 0.5 }
        )

        if (statsRef.current) {
            observer.observe(statsRef.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 6)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const aiTexts = [
        "Predict Project Risks",
        "Optimize Resources",
        "Generate Reports",
        "Analyze Patterns",
        "Automate Decisions",
        "Forecast Budgets",
    ]

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Intelligence",
            description: "Advanced machine learning algorithms predict risks, optimize resources, and automate decision-making.",
            color: "from-purple-500 via-pink-500 to-rose-500",
        },
        {
            icon: Target,
            title: "Strategic Alignment",
            description: "Connect every task to company objectives with OKR tracking and real-time visibility.",
            color: "from-blue-500 via-cyan-500 to-teal-500",
        },
        {
            icon: TrendingUp,
            title: "Portfolio Intelligence",
            description: "Manage unlimited projects with real-time health monitoring and predictive analytics.",
            color: "from-green-500 via-emerald-500 to-teal-500",
        },
        {
            icon: Users,
            title: "Resource Optimization",
            description: "AI-driven capacity planning ensures the right people work on the right projects.",
            color: "from-orange-500 via-amber-500 to-yellow-500",
        },
        {
            icon: BarChart3,
            title: "Predictive Analytics",
            description: "Machine learning models forecast budgets, timelines, and risks with precision.",
            color: "from-indigo-500 via-purple-500 to-pink-500",
        },
        {
            icon: Shield,
            title: "Enterprise Security",
            description: "SOC 2, ISO 27001, GDPR compliant with end-to-end encryption.",
            color: "from-slate-500 via-gray-500 to-zinc-500",
        },
    ]

    const aiCapabilities = [
        {
            icon: AlertTriangle,
            title: "Risk Prediction",
            description: "AI analyzes 50+ factors to predict issues before they occur",
            metric: "87%",
            label: "early detection",
            gradient: "from-red-500 to-orange-500",
        },
        {
            icon: Users,
            title: "Smart Assignment",
            description: "Match tasks based on skills and performance",
            metric: "3x",
            label: "faster allocation",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: DollarSign,
            title: "Budget Intelligence",
            description: "Forecast spending and optimize resources",
            metric: "23%",
            label: "cost reduction",
            gradient: "from-green-500 to-emerald-500",
        },
        {
            icon: FileText,
            title: "Auto Reports",
            description: "Generate executive-ready status reports",
            metric: "10hrs",
            label: "saved per week",
            gradient: "from-purple-500 to-pink-500",
        },
        {
            icon: Search,
            title: "Semantic Search",
            description: "Find anything using natural language",
            metric: "< 1s",
            label: "search time",
            gradient: "from-yellow-500 to-orange-500",
        },
        {
            icon: Activity,
            title: "Anomaly Detection",
            description: "Identify unusual patterns automatically",
            metric: "Real-time",
            label: "alerts",
            gradient: "from-indigo-500 to-purple-500",
        },
    ]

    const stats = [
        { value: "99.9%", label: "Uptime SLA", icon: Activity, count: 99.9 },
        { value: "500K+", label: "Projects Managed", icon: Rocket, count: 500000 },
        { value: "2.5M+", label: "Users Worldwide", icon: Users, count: 2500000 },
        { value: "45%", label: "Efficiency Gain", icon: TrendingUp, count: 45 },
    ]

    const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0))

    useEffect(() => {
        if (statsInView) {
            stats.forEach((stat, index) => {
                let start = 0
                const end = stat.count
                const duration = 2000
                const increment = end / (duration / 16)

                const timer = setInterval(() => {
                    start += increment
                    if (start >= end) {
                        start = end
                        clearInterval(timer)
                    }
                    setAnimatedStats((prev) => {
                        const newStats = [...prev]
                        newStats[index] = start
                        return newStats
                    })
                }, 16)
            })
        }
    }, [statsInView])

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            {/* Custom animations CSS */}
            <style jsx global>{`
                @keyframes slide-down {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.5); }
                    50% { box-shadow: 0 0 60px rgba(168, 85, 247, 0.8); }
                }
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes scale-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes subtle-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-slide-down { animation: slide-down 3s linear infinite; }
                .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
                .animate-gradient-shift { 
                    animation: gradient-shift 3s ease infinite;
                    background-size: 200% 200%;
                }
                .animate-scale-pulse { animation: scale-pulse 2s ease-in-out infinite; }
            `}</style>

            {/* Fixed Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center animate-glow-pulse">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-100 blur-md"></div>
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 animate-gradient-shift">
                                    <Rocket className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                    ManagerBook
                                </span>
                                <div className="text-[10px] text-muted-foreground -mt-1 flex items-center gap-1">
                                    <Sparkles className="h-2 w-2" />
                                    AI-Powered Platform
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium hover:text-purple-600 transition-colors relative group">
                                Platform
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all"></span>
                            </a>
                            <a href="#ai-capabilities" className="text-sm font-medium hover:text-purple-600 transition-colors relative group">
                                AI Features
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all"></span>
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => router.push('/login')} className="font-medium">
                                Sign In
                            </Button>
                            <Button 
                                onClick={() => router.push('/signup')} 
                                className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 font-medium shadow-lg shadow-purple-500/30 animate-gradient-shift relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center">
                                    Start Free Trial 
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Neural Network */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Neural Network Background */}
                <NeuralNetwork />

                {/* Animated Particles */}
                {[...Array(30)].map((_, i) => (
                    <Particle key={i} delay={i * 0.2} duration={3 + i * 0.1} />
                ))}

                {/* Data Streams */}
                {[...Array(10)].map((_, i) => (
                    <DataStream key={i} delay={i * 0.5} />
                ))}

                {/* Floating AI Icons */}
                <FloatingAIIcon icon={Brain} delay={0} duration={6} />
                <FloatingAIIcon icon={Cpu} delay={1} duration={7} />
                <FloatingAIIcon icon={Network} delay={2} duration={8} />
                <FloatingAIIcon icon={Bot} delay={1.5} duration={6.5} />
                <FloatingAIIcon icon={Atom} delay={0.5} duration={7.5} />

                {/* Cursor Glow Effect */}
                <div
                    className="fixed w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none transition-all duration-300"
                    style={{
                        left: mousePosition.x - 192,
                        top: mousePosition.y - 192,
                    }}
                />

                {/* Hero Content */}
                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="flex flex-col items-center text-center">
                        <Badge variant="secondary" className="mb-6 px-6 py-2 text-sm border border-purple-200 dark:border-purple-800 shadow-lg backdrop-blur-sm">
                            <Sparkles className="mr-2 h-4 w-4 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
                            Powered by Advanced AI & Machine Learning
                        </Badge>
                        
                        <h1 className="max-w-6xl text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight mb-8">
                            <span className="inline-block">Enterprise PM</span>
                            <br />
                            <span className="relative inline-block">
                                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-3xl opacity-50 animate-pulse"></span>
                                <span className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-shift">
                                    Meets AI Magic
                                </span>
                            </span>
                        </h1>

                        <div className="min-h-[120px] flex flex-col items-center justify-center mb-8">
                            <p className="text-2xl sm:text-3xl font-bold mb-4 text-muted-foreground">
                                Let AI help you:
                            </p>
                            <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                <TypewriterText texts={aiTexts} />
                            </div>
                        </div>

                        <p className="max-w-3xl text-xl text-muted-foreground mb-12 leading-relaxed">
                            The first truly AI-native project management platform. Watch AI predict risks, optimize resources, 
                            and make intelligent decisions in real-time.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Button
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-lg px-10 py-7 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 animate-scale-pulse relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center">
                                    <Brain className="mr-2 h-5 w-5" />
                                    Experience AI Platform
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                </span>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => router.push('/ai-tools')}
                                className="text-lg px-10 py-7 border-2 hover:bg-accent group backdrop-blur-sm"
                            >
                                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                Watch AI in Action
                            </Button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-20">
                            {[
                                { icon: CheckCircle2, text: "14-day free trial" },
                                { icon: CheckCircle2, text: "No credit card" },
                                { icon: CheckCircle2, text: "Full AI access" },
                                { icon: CheckCircle2, text: "Cancel anytime" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <item.icon className="h-4 w-4 text-green-500" />
                                    {item.text}
                                </div>
                            ))}
                        </div>

                        {/* Animated Stats Counter */}
                        <div ref={statsRef} className="grid grid-cols-2 gap-6 sm:grid-cols-4 w-full max-w-5xl">
                            {stats.map((stat, index) => (
                                <Card 
                                    key={index} 
                                    className="relative overflow-hidden border-2 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105 hover:-translate-y-2 group backdrop-blur-sm bg-background/80"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    <CardContent className="p-6 text-center relative">
                                        <stat.icon className="h-10 w-10 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                                        <div className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                                            {statsInView ? stat.value : '0'}
                                        </div>
                                        <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-purple-500 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-purple-500 rounded-full animate-slide-down"></div>
                    </div>
                </div>
            </section>

            {/* Interactive AI Demo Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-pink-950/50 to-blue-950/50"></div>
                <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/20 opacity-20"></div>

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <Badge variant="outline" className="mb-6 text-sm px-4 py-2 backdrop-blur-sm">
                            <Bot className="mr-2 h-4 w-4 animate-pulse" />
                            Live AI Demonstration
                        </Badge>
                        <h2 className="text-5xl font-black tracking-tight sm:text-6xl mb-6">
                            Watch AI Work
                            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                In Real-Time
                            </span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            See how artificial intelligence transforms project management from reactive to predictive
                        </p>
                    </div>

                    {/* AI Visualization Dashboard */}
                    <Card className="max-w-6xl mx-auto border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 backdrop-blur-sm bg-background/80 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-2">
                                {/* Left: AI Processing */}
                                <div className="p-10 bg-gradient-to-br from-slate-950 to-purple-950 text-white">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-green-400">AI PROCESSING</span>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {[
                                            { label: "Analyzing project data", progress: 95, icon: Database },
                                            { label: "Predicting risk factors", progress: 87, icon: AlertTriangle },
                                            { label: "Optimizing resource allocation", progress: 92, icon: Users },
                                            { label: "Generating insights", progress: 78, icon: Brain },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <span className="font-bold">{item.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-1000 animate-gradient-shift"
                                                        style={{ width: `${item.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg backdrop-blur-sm">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse mt-0.5" />
                                            <div>
                                                <div className="font-semibold mb-1">AI Recommendation</div>
                                                <div className="text-sm text-gray-300">
                                                    Based on current data, Project Alpha has 78% risk of delay. 
                                                    Recommend reallocating 2 senior developers to accelerate timeline.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Results */}
                                <div className="p-10 bg-gradient-to-br from-background to-purple-50 dark:to-purple-950/30">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI INSIGHTS</span>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { 
                                                icon: TrendingUp, 
                                                label: "Efficiency Boost", 
                                                value: "+45%",
                                                color: "text-green-600 dark:text-green-400",
                                                bgColor: "bg-green-100 dark:bg-green-900/30"
                                            },
                                            { 
                                                icon: DollarSign, 
                                                label: "Cost Savings", 
                                                value: "$125K",
                                                color: "text-blue-600 dark:text-blue-400",
                                                bgColor: "bg-blue-100 dark:bg-blue-900/30"
                                            },
                                            { 
                                                icon: Clock, 
                                                label: "Time Saved", 
                                                value: "240hrs",
                                                color: "text-purple-600 dark:text-purple-400",
                                                bgColor: "bg-purple-100 dark:bg-purple-900/30"
                                            },
                                            { 
                                                icon: Target, 
                                                label: "Accuracy", 
                                                value: "99.2%",
                                                color: "text-orange-600 dark:text-orange-400",
                                                bgColor: "bg-orange-100 dark:bg-orange-900/30"
                                            },
                                        ].map((item, idx) => (
                                            <Card 
                                                key={idx} 
                                                className="border-2 hover:border-purple-500 transition-all duration-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 group"
                                            >
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-12 w-12 ${item.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                            <item.icon className={`h-6 w-6 ${item.color}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-muted-foreground">{item.label}</div>
                                                            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* AI Capabilities Grid */}
            <section id="ai-capabilities" className="py-32 bg-slate-950 text-white relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <Badge variant="secondary" className="mb-6 text-sm px-4 py-2 bg-purple-500/20 border-purple-500/50">
                            <Brain className="mr-2 h-4 w-4 animate-pulse" />
                            AI Superpowers
                        </Badge>
                        <h2 className="text-5xl font-black tracking-tight sm:text-6xl mb-6">
                            6 AI Features That
                            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-shift">
                                Change Everything
                            </span>
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {aiCapabilities.map((capability, index) => (
                            <Card 
                                key={index} 
                                className="group relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm hover:scale-105 hover:-translate-y-2"
                            >
                                {/* Animated gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${capability.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                                <CardContent className="p-8 relative">
                                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${capability.gradient} mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 animate-glow-pulse`}>
                                        <capability.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">{capability.title}</h3>
                                    <p className="text-gray-400 mb-6 leading-relaxed">{capability.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-3xl font-black bg-gradient-to-r ${capability.gradient} bg-clip-text text-transparent`}>
                                                {capability.metric}
                                            </div>
                                            <div className="text-xs text-gray-500">{capability.label}</div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => router.push('/ai-tools')}
                                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                        >
                                            Try Now <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <Button
                            size="lg"
                            onClick={() => router.push('/signup')}
                            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-7 shadow-2xl animate-scale-pulse relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Unlock All AI Features
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                            </span>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <Badge variant="outline" className="mb-6 text-sm px-4 py-2">
                            <Layers className="mr-2 h-4 w-4" />
                            Platform Features
                        </Badge>
                        <h2 className="text-5xl font-black tracking-tight sm:text-6xl mb-6">
                            Everything You Need
                            <span className="block text-purple-600">And More</span>
                        </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className={`group relative overflow-hidden border-2 transition-all duration-500 cursor-pointer hover:scale-105 hover:-translate-y-2 ${
                                    activeFeature === index 
                                        ? 'border-purple-500 shadow-2xl shadow-purple-500/30 scale-105 -translate-y-2' 
                                        : 'hover:border-purple-300 hover:shadow-xl'
                                }`}
                                onMouseEnter={() => setActiveFeature(index)}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <CardContent className="p-8 relative">
                                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                        <feature.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-600 transition-colors">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => router.push('/signup')}
                                        className="p-0 h-auto font-semibold text-purple-600 group-hover:gap-2 transition-all"
                                    >
                                        Learn more <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 shadow-2xl animate-gradient-shift">
                        <div className="absolute inset-0">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                    }}
                                />
                            ))}
                        </div>
                        <CardContent className="relative p-16 sm:p-24 text-center">
                            <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
                                <Brain className="h-5 w-5 text-white animate-pulse" />
                                <span className="text-white font-semibold">AI-Powered Project Management</span>
                            </div>
                            <h2 className="text-5xl font-black text-white sm:text-6xl mb-6">
                                Ready to Experience
                                <span className="block">The Future?</span>
                            </h2>
                            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
                                Join thousands of teams using AI to deliver projects faster, smarter, and with less risk.
                            </p>
                            <Button
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-7 shadow-2xl font-bold animate-scale-pulse"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start Your Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <p className="mt-6 text-white/80 text-sm">
                                14 days free • No credit card • Full AI access
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div 
                            className="flex items-center gap-3 cursor-pointer" 
                            onClick={() => router.push('/landing')}
                        >
                            <div className="relative flex h-8 w-8 items-center justify-center">
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 blur-sm"></div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                                    <Rocket className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <span className="font-bold">ManagerBook</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            &copy; 2025 ManagerBook. Professional Project Management.
                        </p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <button onClick={() => router.push('/login')} className="hover:text-purple-600 transition-colors">Privacy</button>
                            <button onClick={() => router.push('/login')} className="hover:text-purple-600 transition-colors">Terms</button>
                            <button onClick={() => router.push('/login')} className="hover:text-purple-600 transition-colors">Security</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
