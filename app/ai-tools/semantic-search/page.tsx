"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Loader2, ExternalLink, Clock } from "lucide-react"

interface SearchResult {
  title: string
  content: string
  type: string
  relevanceScore: number
  metadata?: {
    author?: string
    date?: string
    projectName?: string
    [key: string]: any
  }
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a search query")
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch("/api/ai/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error("Search failed")

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      alert("Search failed. Please try again.")
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "project":
        return "📁"
      case "task":
        return "✅"
      case "document":
        return "📄"
      case "comment":
        return "💬"
      case "meeting":
        return "🗓️"
      default:
        return "📌"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "project":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "task":
        return "bg-green-100 text-green-700 border-green-300"
      case "document":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "comment":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "meeting":
        return "bg-pink-100 text-pink-700 border-pink-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Semantic Search
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Search by meaning, not just keywords
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-8 shadow-xl border-2 border-slate-200">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything... e.g., 'projects with budget issues', 'tasks assigned to Sarah', 'meeting notes about Q4'"
                className="pl-14 pr-4 py-6 text-lg border-2 border-slate-300 focus:border-indigo-500"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </Button>

            {/* Example Queries */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show me high-priority tasks",
                  "Projects over budget",
                  "What did we discuss about marketing?",
                  "Documents about security",
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(example)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {results.map((result, idx) => (
              <Card key={idx} className="p-5 shadow-lg border-2 border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(result.type)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {result.title}
                </h3>

                <p className="text-slate-600 text-sm mb-3 line-clamp-3">
                  {result.content}
                </p>

                {result.metadata && (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-3 border-t">
                    {result.metadata.author && (
                      <span>👤 {result.metadata.author}</span>
                    )}
                    {result.metadata.projectName && (
                      <span>📁 {result.metadata.projectName}</span>
                    )}
                    {result.metadata.date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.metadata.date}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && query && (
          <Card className="p-12 text-center shadow-lg border-2 border-slate-200">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No results found
            </h3>
            <p className="text-slate-500">
              Try rephrasing your query or use different keywords
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

