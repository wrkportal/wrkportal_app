import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { LayoutContent } from "@/components/layout/layout-content"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import Script from "next/script"

export const metadata: Metadata = {
    title: {
        default: "ManagerBook - Manager Book | Professional Project Management Platform",
        template: "%s | ManagerBook - Manager Book"
    },
    description: "ManagerBook (Manager Book) is a comprehensive project management platform with AI-powered features, OKR tracking, Gantt charts, reporting tools, business intelligence, and team collaboration. The ultimate manager book for project success.",
    keywords: [
        "ManagerBook",
        "Manager Book",
        "manager book",
        "managerbook",
        "project management platform",
        "manager's handbook",
        "project manager book",
        "management book software",
        "project management",
        "task management",
        "OKR tracking",
        "team collaboration",
        "Gantt chart",
        "AI assistant",
        "productivity",
        "workflow management",
        "reporting tool",
        "business reporting software",
        "project reporting",
        "analytics dashboard",
        "data visualization",
        "business intelligence tool",
        "custom reports",
        "project analytics",
        "reporting solution",
        "dashboard software",
        "KPI tracking",
        "performance reporting",
        "project management software",
        "manager tool",
        "management platform"
    ],
    authors: [{ name: "ManagerBook Team" }],
    creator: "ManagerBook",
    publisher: "ManagerBook",
    metadataBase: new URL('https://www.managerbook.in'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.managerbook.in',
        title: 'ManagerBook - Manager Book | Professional Project Management Platform',
        description: 'ManagerBook (Manager Book) - Comprehensive project management with AI-powered features, OKR tracking, advanced reporting tools, business intelligence, and team collaboration.',
        siteName: 'ManagerBook - Manager Book',
        images: [
            {
                url: 'https://www.managerbook.in/logo.png',
                width: 1200,
                height: 630,
                alt: 'ManagerBook Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ManagerBook - Manager Book | Professional Project Management Platform',
        description: 'ManagerBook (Manager Book) - Comprehensive project management with AI-powered features, OKR tracking, advanced reporting tools, business intelligence, and team collaboration.',
        images: ['https://www.managerbook.in/logo.png'],
        creator: '@ManagerBook',
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
    icons: {
        icon: [
            { url: '/icon.png', type: 'image/png', sizes: '32x32' },
            { url: '/icon.png', type: 'image/png', sizes: '192x192' },
            { url: '/logo.png', type: 'image/png', sizes: '512x512' },
        ],
        apple: [
            { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        shortcut: '/icon.png',
    },
    manifest: '/manifest.json',
    verification: {
        google: 'your-google-verification-code', // Add your Google Search Console verification code here
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <head>
                {/* Organization Schema for Google */}
                <Script
                    id="organization-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "ManagerBook",
                            "alternateName": "Manager Book",
                            "url": "https://www.managerbook.in",
                            "logo": "https://www.managerbook.in/logo.png",
                            "description": "ManagerBook (Manager Book) is a professional project management platform with AI-powered features, OKR tracking, advanced reporting tools, and team collaboration.",
                            "sameAs": [
                                // Add your social media profiles here
                                // "https://www.facebook.com/managerbook",
                                // "https://twitter.com/managerbook",
                                // "https://www.linkedin.com/company/managerbook"
                            ],
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "contactType": "customer support",
                                "url": "https://www.managerbook.in/contact"
                            }
                        })
                    }}
                />
                
                {/* WebSite Schema */}
                <Script
                    id="website-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "ManagerBook",
                            "url": "https://www.managerbook.in",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": "https://www.managerbook.in/search?q={search_term_string}",
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
                />

                {/* Software Application Schema */}
                <Script
                    id="software-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "ManagerBook",
                            "operatingSystem": "Web",
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
                        })
                    }}
                />
            </head>
            <body className="font-sans antialiased">
                <AuthSessionProvider>
                    <LayoutContent>{children}</LayoutContent>
                </AuthSessionProvider>
            </body>
        </html>
    )
}
