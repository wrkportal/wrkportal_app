import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.managerbook.in'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/dashboard/', '/settings/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
