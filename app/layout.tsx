import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { LayoutContent } from "@/components/layout/layout-content"
import { AuthSessionProvider } from "@/components/providers/session-provider"

export const metadata: Metadata = {
    title: "ManagerBook",
    description: "Professional project management platform",
    icons: {
        icon: '/icon.png',
    },
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
