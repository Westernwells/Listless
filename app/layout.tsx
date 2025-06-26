import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth/context"
import { QueryProvider } from "@/components/providers/query-provider"
import { ErrorMonitorProvider } from "@/components/error-monitor-provider"
import { createClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If there's an error getting the user, we'll let the client handle it
  // This prevents server-side errors from breaking the entire app
  const initialUser = error ? null : user

  return (
    <html lang="en">
      <head>
        <title>AI Task Management</title>
        {/* Initialize error monitoring system */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize comprehensive error monitoring
              (function() {
                // Basic error handling for immediate protection
                window.addEventListener('unhandledrejection', function(event) {
                  console.warn('Unhandled promise rejection:', event.reason);

                  // Check if it's a browser extension related error
                  if (event.reason && typeof event.reason === 'object') {
                    const errorMessage = event.reason.message || event.reason.toString();
                    if (errorMessage.includes('message channel') ||
                        errorMessage.includes('Extension context') ||
                        errorMessage.includes('chrome-extension')) {
                      event.preventDefault();
                      console.warn('Browser extension communication error suppressed:', errorMessage);
                    }
                  }
                });

                // Handle message channel errors specifically
                window.addEventListener('error', function(event) {
                  if (event.message && event.message.includes('message channel closed')) {
                    console.warn('Message channel error suppressed:', event.message);
                    event.preventDefault();
                  }
                });

                // Mark that basic error handling is active
                window.__errorHandlingActive = true;
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ErrorMonitorProvider>
          <QueryProvider>
            <AuthProvider
              initialSession={null}
              initialUser={initialUser}
            >
              {children}
            </AuthProvider>
          </QueryProvider>
        </ErrorMonitorProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
