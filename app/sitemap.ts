import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.managerbook.in'
    
    // Define your main pages (only include pages that actually exist)
    const routes = [
        { path: '', priority: 1 },          // Homepage
        { path: '/landing', priority: 0.9 }, // Landing page
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

    return routes
}

