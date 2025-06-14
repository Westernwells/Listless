import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <head>
        <title>AI Task Management</title>
      </head>
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider
          initialSession={session}
          initialUser={session?.user ?? null}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
