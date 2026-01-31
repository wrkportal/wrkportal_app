import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: string
  updatedAt?: string
  author: {
    name: string
    email?: string
    avatar?: string
  }
  categories: string[]
  keywords?: string[]
  featuredImage?: string
  readTime: number
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: string
  }
}

const postsDirectory = path.join(process.cwd(), 'content/blog')

// Calculate read time (average reading speed: 200 words per minute)
function calculateReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.ceil(words / 200)
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return []
    }

    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames
      .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.(mdx|md)$/, '')
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
          slug,
          title: data.title || 'Untitled',
          excerpt: data.excerpt || '',
          content,
          publishedAt: data.publishedAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          author: {
            name: data.author?.name || 'wrkportal.com Team',
            email: data.author?.email,
            avatar: data.author?.avatar,
          },
          categories: data.categories || [],
          keywords: data.keywords || [],
          featuredImage: data.featuredImage,
          readTime: calculateReadTime(content),
          seo: data.seo,
        } as BlogPost
      })

    // Sort by published date (newest first)
    return allPostsData.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  } catch (error) {
    console.error('Error reading blog posts:', error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Try .mdx first, then .md
    const extensions = ['.mdx', '.md']
    let filePath: string | null = null
    let fileName: string | null = null

    for (const ext of extensions) {
      const potentialPath = path.join(postsDirectory, `${slug}${ext}`)
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath
        fileName = `${slug}${ext}`
        break
      }
    }

    if (!filePath || !fileName) {
      return null
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      content,
      publishedAt: data.publishedAt || new Date().toISOString(),
      updatedAt: data.updatedAt,
      author: {
        name: data.author?.name || 'wrkportal.com Team',
        email: data.author?.email,
        avatar: data.author?.avatar,
      },
      categories: data.categories || [],
      keywords: data.keywords || [],
      featuredImage: data.featuredImage,
      readTime: calculateReadTime(content),
      seo: data.seo,
    } as BlogPost
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error)
    return null
  }
}
