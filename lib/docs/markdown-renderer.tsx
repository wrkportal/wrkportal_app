/**
 * Markdown Renderer Component
 * Renders markdown content with proper styling
 */

'use client'

interface MarkdownRendererProps {
  content: string
}

// Simple markdown renderer without external dependencies
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Convert markdown to HTML with basic formatting
  const formatMarkdown = (text: string): string => {
    let html = text
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
    
    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline">$1</a>')
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    
    // Paragraphs (split by double newlines)
    const paragraphs = html.split(/\n\n+/)
    html = paragraphs.map(p => {
      p = p.trim()
      if (p && !p.match(/^<[h|u|o|l|p|d]/)) {
        return `<p class="mb-4 leading-relaxed">${p}</p>`
      }
      return p
    }).join('\n')
    
    // Wrap lists
    html = html.replace(/(<li.*<\/li>)/gs, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="list-decimal ml-6 mb-4 space-y-2">${match}</ol>`
      }
      return `<ul class="list-disc ml-6 mb-4 space-y-2">${match}</ul>`
    })
    
    // Line breaks
    html = html.replace(/\n/gim, '<br />')
    
    return html
  }

  return (
    <div 
      className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  )
}

