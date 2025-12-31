/**
 * Developer Guide Page
 */

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MarkdownRenderer } from '@/lib/docs/markdown-renderer'

export default function DeveloperGuidePage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docs/developer/developer-guide.md')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error loading documentation:', error)
        setContent('# Developer Guide\n\nContent loading...')
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mt-4 sm:mt-6 lg:mt-8">
      <div className="mb-6 sm:mb-8">
        <Link href="/docs">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading content...</p>
            </div>
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

