import type React from "react"
import type {Metadata, Viewport} from "next"
import {Inter} from "next/font/google"
import {Analytics} from "@vercel/analytics/next"
import "./globals.css"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inter = Inter({subsets: ["latin"]})

export const metadata: Metadata = {
    title: "Laundry",
    description: "Push notifikace pro praní a sušení",
    generator: "v0.app",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Laundry",
    },
}

export const viewport: Viewport = {
    themeColor: "#0ea5e9",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="cs">
        <body className={`font-sans antialiased`}>
        {children}
        <Analytics/>
        </body>
        </html>
    )
}
