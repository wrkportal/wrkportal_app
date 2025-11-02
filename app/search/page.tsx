'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Search,
    Briefcase,
    CheckSquare,
    Users,
    FileText,
    Folder,
    Calendar,
    ArrowRight,
    Loader2,
    TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

type SearchResult = {
    id: string
    type: 'project' | 'task' | 'user' | 'document' | 'program' | 'portfolio'
    title: string
    description: string
    status?: string
    priority?: string
    url: string
    metadata?: Record<string, any>
}

function SearchPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<SearchResult[]>([])
    const [activeTab, setActiveTab] = useState('all')
    const [suggestions, setSuggestions] = useState<SearchResult[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const query = searchParams?.get('q')
        if (query) {
            setSearchQuery(query)
            performSearch(query)
        }
    }, [searchParams])

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setResults([])
            return
        }

        setIsSearching(true)

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setResults(data.results || [])
            } else {
                console.error('Search failed')
                setResults([])
            }
        } catch (error) {
            console.error('Error performing search:', error)
            setResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim() || query.trim().length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        setIsFetchingSuggestions(true)

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                const topResults = (data.results || []).slice(0, 8) // Show top 8 suggestions
                setSuggestions(topResults)
                setShowSuggestions(topResults.length > 0)
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error)
        } finally {
            setIsFetchingSuggestions(false)
        }
    }, [])

    const handleInputChange = (value: string) => {
        setSearchQuery(value)

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Set new timer for debounced search
        if (value.trim().length >= 2) {
            debounceTimerRef.current = setTimeout(() => {
                fetchSuggestions(value)
            }, 300) // 300ms debounce
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            setShowSuggestions(false)
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
            performSearch(searchQuery)
        }
    }

    const handleSuggestionClick = (result: SearchResult) => {
        setShowSuggestions(false)
        setSearchQuery(result.title)
        router.push(result.url)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'project':
                return <Briefcase className="h-5 w-5" />
            case 'task':
                return <CheckSquare className="h-5 w-5" />
            case 'user':
                return <Users className="h-5 w-5" />
            case 'document':
                return <FileText className="h-5 w-5" />
            case 'program':
                return <Folder className="h-5 w-5" />
            case 'portfolio':
                return <TrendingUp className="h-5 w-5" />
            default:
                return <FileText className="h-5 w-5" />
        }
    }

    const getTypeLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    const filteredResults = activeTab === 'all'
        ? results
        : results.filter(r => r.type === activeTab)

    const resultCounts = {
        all: results.length,
        project: results.filter(r => r.type === 'project').length,
        task: results.filter(r => r.type === 'task').length,
        user: results.filter(r => r.type === 'user').length,
        document: results.filter(r => r.type === 'document').length,
        program: results.filter(r => r.type === 'program').length,
        portfolio: results.filter(r => r.type === 'portfolio').length,
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Search
                </h1>
                <p className="text-muted-foreground mt-2">
                    Find projects, tasks, people, and documents across your workspace
                </p>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400 z-10" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search projects, tasks, people, documents..."
                                value={searchQuery}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onFocus={() => {
                                    if (suggestions.length > 0) {
                                        setShowSuggestions(true)
                                    }
                                }}
                                className="pl-10 h-11"
                                autoFocus
                                autoComplete="off"
                            />

                            {/* Auto-suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[400px] overflow-y-auto"
                                >
                                    {isFetchingSuggestions && (
                                        <div className="p-3 text-center text-sm text-slate-500">
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                            Searching...
                                        </div>
                                    )}
                                    <div className="p-2">
                                        {suggestions.map((result) => (
                                            <button
                                                key={result.id}
                                                type="button"
                                                onClick={() => handleSuggestionClick(result)}
                                                className="w-full text-left p-3 hover:bg-slate-50 rounded-md transition-colors flex items-start gap-3 group"
                                            >
                                                <div className="mt-1 text-purple-600">
                                                    {getIcon(result.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm group-hover:text-purple-600 transition-colors truncate">
                                                            {result.title}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            {getTypeLabel(result.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-1">
                                                        {result.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-100 p-2 bg-slate-50">
                                        <button
                                            type="submit"
                                            onClick={(e) => {
                                                setShowSuggestions(false)
                                                handleSearch(e)
                                            }}
                                            className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium py-2"
                                        >
                                            See all results for &quot;{searchQuery}&quot;
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            disabled={isSearching || !searchQuery.trim()}
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Search Results */}
            {searchQuery && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-white border">
                        <TabsTrigger value="all">
                            All ({resultCounts.all})
                        </TabsTrigger>
                        <TabsTrigger value="project">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Projects ({resultCounts.project})
                        </TabsTrigger>
                        <TabsTrigger value="task">
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Tasks ({resultCounts.task})
                        </TabsTrigger>
                        <TabsTrigger value="user">
                            <Users className="h-4 w-4 mr-2" />
                            People ({resultCounts.user})
                        </TabsTrigger>
                        <TabsTrigger value="program">
                            <Folder className="h-4 w-4 mr-2" />
                            Programs ({resultCounts.program})
                        </TabsTrigger>
                        <TabsTrigger value="portfolio">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Portfolios ({resultCounts.portfolio})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {isSearching ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <div className="text-center space-y-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                                        <p className="text-muted-foreground">Searching...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : filteredResults.length > 0 ? (
                            <div className="space-y-3">
                                {filteredResults.map((result) => (
                                    <Card
                                        key={result.id}
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.push(result.url)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="mt-1 text-purple-600">
                                                        {getIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-lg">
                                                                {result.title}
                                                            </h3>
                                                            <Badge variant="outline" className="text-xs">
                                                                {getTypeLabel(result.type)}
                                                            </Badge>
                                                            {result.status && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {result.status}
                                                                </Badge>
                                                            )}
                                                            {result.priority && (
                                                                <Badge
                                                                    variant={
                                                                        result.priority === 'HIGH' || result.priority === 'CRITICAL'
                                                                            ? 'destructive'
                                                                            : 'outline'
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {result.priority}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {result.description}
                                                        </p>
                                                        {result.metadata && (
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                                {result.metadata.owner && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {result.metadata.owner}
                                                                    </span>
                                                                )}
                                                                {result.metadata.dueDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {result.metadata.dueDate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-slate-400 mt-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Search className="h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700">
                                        No results found
                                    </h3>
                                    <p className="text-muted-foreground text-center mt-2">
                                        Try adjusting your search terms or browse by category
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State - No Search Yet */}
            {!searchQuery && !isSearching && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center space-y-4">
                            <Search className="h-16 w-16 text-slate-300 mx-auto" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-slate-700">
                                    Start Searching
                                </h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Enter keywords to search across projects, tasks, people, and documents in your workspace
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 mt-6">
                                <Badge variant="outline" className="text-sm py-1 px-3">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    Projects
                                </Badge>
                                <Badge variant="outline" className="text-sm py-1 px-3">
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    Tasks
                                </Badge>
                                <Badge variant="outline" className="text-sm py-1 px-3">
                                    <Users className="h-3 w-3 mr-1" />
                                    People
                                </Badge>
                                <Badge variant="outline" className="text-sm py-1 px-3">
                                    <Folder className="h-3 w-3 mr-1" />
                                    Programs
                                </Badge>
                                <Badge variant="outline" className="text-sm py-1 px-3">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Portfolios
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-6 max-w-6xl">
                <Card>
                    <CardContent className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Loading search...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    )
}

