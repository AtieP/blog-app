import React from "react"
import "./global.css"
import Header from "@components/Header"
import Footer from "@components/Footer"
import type { Viewport } from 'next'
 

export default async function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html>
            <head>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
            </head>
            <body>
                <div className="flex flex-col h-screen">
                    <Header/>
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer/>
                </div>
            </body>
        </html>
    )
}