/**
 * Documentation API Route
 * Serves markdown files from the docs directory
 * Uses catch-all route [...path] to handle nested paths
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Join the path array to form the full file path
    // e.g., ['quick-start', 'quick-start-guide.md'] -> 'quick-start/quick-start-guide.md'
    const filePath = params.path.join('/')
    
    // Construct the full path to the markdown file
    const fullPath = join(process.cwd(), 'docs', filePath)
    
    // Read the markdown file
    const content = await readFile(fullPath, 'utf-8')
    
    // Return the content as text
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch (error: any) {
    console.error('Error reading documentation file:', error)
    return NextResponse.json(
      { error: 'Documentation file not found', path: params.path },
      { status: 404 }
    )
  }
}

