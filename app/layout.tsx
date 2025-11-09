import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { LayoutContent } from "@/components/layout/layout-content"
import { AuthSessionProvider } from "@/components/providers/session-provider"

export const metadata: Metadata = {
    title: {
        default: "ManagerBook - Professional Project Management Platform",
        template: "%s | ManagerBook"
    },
    description: "ManagerBook is a comprehensive project management platform with AI-powered features, OKR tracking, Gantt charts, task management, and team collaboration tools. Perfect for teams of all sizes.",
    keywords: ["project management", "task management", "OKR tracking", "team collaboration", "Gantt chart", "AI assistant", "productivity", "workflow management"],
    authors: [{ name: "ManagerBook Team" }],
    creator: "ManagerBook",
    publisher: "ManagerBook",
    metadataBase: new URL('https://www.managerbook.in'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.managerbook.in',
        title: 'ManagerBook - Professional Project Management Platform',
        description: 'Comprehensive project management with AI-powered features, OKR tracking, and team collaboration tools.',
        siteName: 'ManagerBook',
        images: [
            {
                url: '/logo.png',
                width: 1200,
                height: 630,
                alt: 'ManagerBook Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ManagerBook - Professional Project Management Platform',
        description: 'Comprehensive project management with AI-powered features, OKR tracking, and team collaboration tools.',
        images: ['/logo.png'],
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
        icon: '/icon.png',
        apple: '/icon.png',
    },
    manifest: '/manifest.json',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <body className="font-sans antialiased">
                <AuthSessionProvider>
                    <LayoutContent>{children}</LayoutContent>
                </AuthSessionProvider>
            </body>
        </html>
    )
}
