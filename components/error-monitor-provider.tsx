"use client"

import { useEffect } from 'react'
import { errorMonitor } from '@/lib/error-monitoring'

/**
 * Error Monitor Provider Component
 * Initializes comprehensive error monitoring on the client side
 */
export function ErrorMonitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize error monitoring system
    errorMonitor.init()

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Error monitoring system initialized')
      
      // Add global access for debugging
      ;(window as any).__errorMonitor = errorMonitor
      
      // Log error summary every 30 seconds in development
      const interval = setInterval(() => {
        const summary = errorMonitor.getErrorSummary()
        if (summary.totalErrors > 0 || summary.totalPerformanceViolations > 0) {
          console.group('📊 Error Monitor Summary')
          console.log('Total Errors:', summary.totalErrors)
          console.log('Performance Violations:', summary.totalPerformanceViolations)
          console.log('Errors by Type:', summary.errorsByType)
          if (summary.recentErrors.length > 0) {
            console.log('Recent Errors:', summary.recentErrors)
          }
          if (summary.recentViolations.length > 0) {
            console.log('Recent Performance Violations:', summary.recentViolations)
          }
          console.groupEnd()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [])

  return <>{children}</>
}

/**
 * Hook to access error monitoring functionality
 */
export function useErrorMonitor() {
  return {
    getErrorSummary: () => errorMonitor.getErrorSummary(),
    clearErrors: () => errorMonitor.clear(),
    recordPerformanceViolation: (violation: any) => errorMonitor.recordPerformanceViolation(violation)
  }
}
