# SEO & Google Search Visibility Setup Guide

## Overview

This guide will help you make your wrkportal.com application discoverable on Google and other search engines.

## Step 1: Create SEO Files

### A. Create Sitemap (`app/sitemap.ts`)

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
```

### B. Create Robots.txt (`app/robots.ts`)

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'
  
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
```

### C. Update Root Layout Metadata (`app/layout.tsx`)

Add comprehensive metadata:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'),
  title: {
    default: 'wrkportal.com - Enterprise Project Management Platform',
    template: '%s | wrkportal.com',
  },
  description: 'All-in-one enterprise project management platform. Manage projects, teams, finances, sales, and HR workflows in one unified platform.',
  keywords: [
    'project management',
    'enterprise software',
    'team collaboration',
    'workflow automation',
    'project planning',
    'task management',
    'team productivity',
    'business management software',
  ],
  authors: [{ name: 'wrkportal.com' }],
  creator: 'wrkportal.com',
  publisher: 'wrkportal.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL || 'https://your-app.vercel.app',
    siteName: 'wrkportal.com',
    title: 'wrkportal.com - Enterprise Project Management Platform',
    description: 'All-in-one project management, finance, sales, and HR platform.',
    images: [
      {
        url: '/og-image.png', // Create this image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'wrkportal.com',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'wrkportal.com - Enterprise Project Management',
    description: 'All-in-one project management platform',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // From Google Search Console
  },
}
```

## Step 2: Submit to Google Search Console

1. **Go to [Google Search Console](https://search.google.com/search-console)**
2. **Add Property:**
   - Click "Add Property"
   - Enter your Vercel URL: `https://your-app.vercel.app`
   - Choose "URL prefix" method
3. **Verify Ownership:**
   - **Option 1: HTML file** (Easiest)
     - Download the HTML verification file
     - Add to `public/` folder
     - Push to GitHub
     - Click "Verify" in Search Console
   - **Option 2: HTML tag**
     - Copy the meta tag
     - Add to `app/layout.tsx` in `<head>`
     - Push and verify
   - **Option 3: DNS record** (If you have custom domain)
4. **Submit Sitemap:**
   - Once verified, go to "Sitemaps" in left menu
   - Enter: `sitemap.xml`
   - Click "Submit"

## Step 3: Create Open Graph Image

Create `public/og-image.png`:
- Size: 1200x630 pixels
- Include: Your logo, tagline, key features
- Use tools like Canva or Figma

## Step 4: Add Structured Data (Schema.org)

Add JSON-LD to your landing page for rich search results:

```typescript
// In app/(marketing)/landing/page.tsx
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "wrkportal.com",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "100"
  }
}

// Add to page:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>
```

## Step 5: Content Optimization

### Landing Page SEO:
- ✅ Clear H1 heading with main keyword
- ✅ Descriptive meta description (150-160 characters)
- ✅ Internal links to important pages
- ✅ Fast page load (Vercel handles this)
- ✅ Mobile-friendly (already responsive)

### Blog/Content Strategy:
- Create `/blog` section
- Write about:
  - Project management best practices
  - Team productivity tips
  - Workflow automation guides
  - Industry-specific use cases

## Step 6: Build Backlinks

1. **Submit to Directories:**
   - Product Hunt
   - G2
   - Capterra
   - Software Advice
   - GetApp

2. **Social Media:**
   - Share on LinkedIn
   - Twitter/X
   - Reddit (relevant communities)
   - Hacker News (Show HN)

3. **Guest Posts:**
   - Write for project management blogs
   - Include links back to your site

## Step 7: Monitor Performance

1. **Google Search Console:**
   - Check indexing status
   - Monitor search queries
   - Fix any crawl errors

2. **Google Analytics:**
   - Add GA4 tracking code
   - Monitor traffic sources
   - Track conversions

3. **Page Speed:**
   - Use Google PageSpeed Insights
   - Vercel already optimizes, but monitor

## Step 8: Local SEO (If Applicable)

If you serve specific regions:
- Add location to metadata
- Create location-specific pages
- Get listed in local directories

## Quick Checklist

- [ ] Create `app/sitemap.ts`
- [ ] Create `app/robots.ts`
- [ ] Update `app/layout.tsx` metadata
- [ ] Create `public/og-image.png`
- [ ] Submit to Google Search Console
- [ ] Verify ownership
- [ ] Submit sitemap
- [ ] Add structured data
- [ ] Set up Google Analytics
- [ ] Create blog/content section
- [ ] Submit to directories
- [ ] Share on social media

## Expected Timeline

- **Immediate:** Sitemap and robots.txt (1 day)
- **Week 1:** Google Search Console setup, verification
- **Week 2-4:** First pages indexed by Google
- **Month 2-3:** Start appearing in search results
- **Month 3-6:** Regular organic traffic

## Important Notes

1. **Be Patient:** SEO takes time (3-6 months typically)
2. **Quality over Quantity:** Better to have fewer high-quality pages
3. **Regular Updates:** Google favors regularly updated content
4. **Mobile-First:** Ensure mobile experience is excellent
5. **Page Speed:** Fast sites rank higher

---

## Need Help?

- Google Search Console Help: https://support.google.com/webmasters
- Next.js SEO Documentation: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
