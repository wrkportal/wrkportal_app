import { MetadataRoute } from 'next'
import { getAllBlogPosts } from '@/lib/blog/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.wrkportal.com'
    
    // Define your main pages (only include pages that actually exist)
    const routes = [
        { path: '', priority: 1 },          // Homepage
        { path: '/landing', priority: 0.9 }, // Landing page
        { path: '/blog', priority: 0.8 },   // Blog listing page
        { path: '/login', priority: 0.7 },   // Login page
        { path: '/signup', priority: 0.7 },  // Signup page
        { path: '/privacy', priority: 0.6 }, // Privacy policy
        { path: '/terms', priority: 0.6 },   // Terms of service
        { path: '/security', priority: 0.6 }, // Security page
        // Add more public pages as needed
    ].map((route) => ({
        url: `${baseUrl}${route.path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route.priority,
    }))

    // Add blog posts to sitemap
    try {
        const posts = await getAllBlogPosts()
        const blogRoutes = posts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updatedAt || post.publishedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }))
        
        return [...routes, ...blogRoutes]
    } catch (error) {
        console.error('Error fetching blog posts for sitemap:', error)
        return routes
    }
}

