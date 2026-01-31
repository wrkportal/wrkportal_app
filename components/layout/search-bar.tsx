'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    Mic,
    MicOff,
    Briefcase,
    CheckSquare,
    Users,
    FileText,
    Folder,
    TrendingUp,
    Loader2,
    ArrowRight,
    X,
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

type SearchFilter = 'all' | 'project' | 'task' | 'user' | 'document' | 'program' | 'portfolio'

export function SearchBar() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<SearchResult[]>([])
    const [showResults, setShowResults] = useState(false)
    const [filter, setFilter] = useState<SearchFilter>('all')
    const [isListening, setIsListening] = useState(false)
    const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false)
    const recognitionRef = useRef<any>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Check if speech recognition is available
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            setHasSpeechRecognition(!!SpeechRecognition)
        }
    }, [])

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                resultsRef.current &&
                !resultsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const performSearch = useCallback(async (query: string, searchFilter: SearchFilter = 'all') => {
        if (!query.trim()) {
            setResults([])
            setShowResults(false)
            return
        }

        setIsSearching(true)

        try {
            const filterParam = searchFilter !== 'all' ? `&filter=${searchFilter}` : ''
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${filterParam}`)
            if (response.ok) {
                const data = await response.json()
                let filteredResults = data.results || []
                
                // Apply filter if not 'all'
                if (searchFilter !== 'all') {
                    filteredResults = filteredResults.filter((r: SearchResult) => r.type === searchFilter)
                }
                
                setResults(filteredResults.slice(0, 10)) // Show top 10 results
                setShowResults(true)
            } else {
                setResults([])
            }
        } catch (error) {
            console.error('Error performing search:', error)
            setResults([])
        } finally {
            setIsSearching(false)
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
                performSearch(value, filter)
            }, 300) // 300ms debounce
        } else {
            setResults([])
            setShowResults(false)
        }
    }

    const handleFilterChange = (newFilter: SearchFilter) => {
        setFilter(newFilter)
        if (searchQuery.trim().length >= 2) {
            performSearch(searchQuery, newFilter)
        }
    }

    const startVoiceRecognition = () => {
        if (!hasSpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
            return
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setSearchQuery(transcript)
            performSearch(transcript, filter)
            setIsListening(false)
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            if (event.error === 'no-speech') {
                alert('No speech detected. Please try again.')
            } else if (event.error === 'not-allowed') {
                alert('Microphone permission denied. Please enable microphone access.')
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }

    const handleResultClick = (result: SearchResult) => {
        setShowResults(false)
        if (!router) {
            console.error('[SearchBar] Router not available')
            return
        }
        router.push(result.url)
    }

    const clearSearch = () => {
        setSearchQuery('')
        setResults([])
        setShowResults(false)
        searchInputRef.current?.focus()
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'project':
                return <Briefcase className="h-4 w-4" />
            case 'task':
                return <CheckSquare className="h-4 w-4" />
            case 'user':
                return <Users className="h-4 w-4" />
            case 'document':
                return <FileText className="h-4 w-4" />
            case 'program':
                return <Folder className="h-4 w-4" />
            case 'portfolio':
                return <TrendingUp className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            project: 'Project',
            task: 'Task',
            user: 'People',
            document: 'Document',
            program: 'Program',
            portfolio: 'Portfolio',
        }
        return labels[type] || type
    }

    const getFilterLabel = (filterValue: SearchFilter) => {
        const labels: Record<SearchFilter, string> = {
            all: 'All',
            user: 'People',
            project: 'Projects',
            task: 'Tasks',
            document: 'Documents',
            program: 'Programs',
            portfolio: 'Portfolios',
        }
        return labels[filterValue] || 'All'
    }

    return (
        <div className="relative w-full max-w-2xl md:max-w-xl lg:max-w-lg mx-auto">
            {/* Search Input with Integrated Filter */}
            <div className="relative flex-1">
                <div className="relative flex items-center border border-input rounded-md bg-background">
                    {/* Filter Selector - Inside on left */}
                    <div className="border-r border-border">
                        <Select value={filter || 'all'} defaultValue="all" onValueChange={(value) => handleFilterChange(value as SearchFilter)}>
                            <SelectTrigger className="h-8 w-[115px] text-xs border-0 bg-transparent rounded-l-md rounded-r-none focus:ring-0 focus:ring-offset-0 shadow-none">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="user">People</SelectItem>
                                <SelectItem value="project">Projects</SelectItem>
                                <SelectItem value="task">Tasks</SelectItem>
                                <SelectItem value="document">Documents</SelectItem>
                                <SelectItem value="program">Programs</SelectItem>
                                <SelectItem value="portfolio">Portfolios</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            ref={searchInputRef}
                            placeholder={filter ? `Search ${getFilterLabel(filter).toLowerCase()}...` : "Search all..."}
                            value={searchQuery}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={() => {
                                if (results.length > 0) {
                                    setShowResults(true)
                                }
                            }}
                            className={cn(
                                "pl-9 pr-10 h-8 text-sm border-0 rounded-l-none rounded-r-md focus-visible:ring-0 focus-visible:ring-offset-0",
                                showResults && results.length > 0 && "rounded-b-none"
                            )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSearch}
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Dropdown */}
                    {showResults && (results.length > 0 || isSearching) && (
                        <div
                            ref={resultsRef}
                            className="absolute z-50 w-full top-full mt-0 bg-popover border border-border rounded-b-lg shadow-lg max-h-[500px] overflow-y-auto"
                        >
                            {isSearching && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                    Searching...
                                </div>
                            )}
                            {!isSearching && results.length > 0 && (
                                <div className="p-2">
                                    {results.map((result) => (
                                        <button
                                            key={result.id}
                                            type="button"
                                            onClick={() => handleResultClick(result)}
                                            className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors flex items-start gap-3 group"
                                        >
                                            <div className="mt-1 text-primary shrink-0">
                                                {getIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                                        {result.title}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {getTypeLabel(result.type)}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {result.description}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!isSearching && results.length === 0 && searchQuery.trim().length >= 2 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found for &quot;{searchQuery}&quot;
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

