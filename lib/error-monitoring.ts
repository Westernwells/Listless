/**
 * Comprehensive error monitoring system for Listless application
 * Handles console errors, promise rejections, and performance violations
 */

export interface ErrorReport {
  type: 'promise-rejection' | 'console-error' | 'performance-violation' | 'message-channel'
  message: string
  stack?: string
  timestamp: number
  url?: string
  lineNumber?: number
  columnNumber?: number
  userAgent: string
  additionalData?: Record<string, any>
}

export interface PerformanceViolation {
  type: 'click-handler' | 'message-handler' | 'scroll-handler' | 'other'
  duration: number
  element?: string
  timestamp: number
}

class ErrorMonitor {
  private errors: ErrorReport[] = []
  private performanceViolations: PerformanceViolation[] = []
  private isInitialized = false
  private maxErrors = 100 // Limit stored errors to prevent memory issues

  /**
   * Initialize error monitoring
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.setupUnhandledRejectionHandler()
    this.setupErrorHandler()
    this.setupPerformanceMonitoring()
    this.setupMessageChannelErrorHandler()
    
    this.isInitialized = true
    console.log('🔍 Error monitoring initialized')
  }

  /**
   * Handle unhandled promise rejections
   */
  private setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorReport = {
        type: 'promise-rejection',
        message: this.extractErrorMessage(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        additionalData: {
          reason: event.reason,
          promise: event.promise
        }
      }

      // Check if it's a browser extension error that should be suppressed
      if (this.isBrowserExtensionError(error.message)) {
        console.warn('Browser extension error suppressed:', error.message)
        event.preventDefault()
        return
      }

      this.recordError(error)
      
      // Only prevent default for non-critical errors
      if (this.isNonCriticalError(error.message)) {
        event.preventDefault()
      }
    })
  }

  /**
   * Handle general JavaScript errors
   */
  private setupErrorHandler() {
    window.addEventListener('error', (event) => {
      const error: ErrorReport = {
        type: 'console-error',
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        userAgent: navigator.userAgent,
        additionalData: {
          error: event.error
        }
      }

      // Handle message channel errors specifically
      if (event.message.includes('message channel closed')) {
        error.type = 'message-channel'
        console.warn('Message channel error detected:', error.message)
        event.preventDefault()
        return
      }

      this.recordError(error)
    })
  }

  /**
   * Monitor performance violations
   */
  private setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 150) { // Tasks longer than 150ms
              const violation: PerformanceViolation = {
                type: 'other',
                duration: entry.duration,
                timestamp: Date.now()
              }
              this.recordPerformanceViolation(violation)
            }
          }
        })
        
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Performance monitoring not available:', error)
      }
    }

    // Monitor click handler performance
    this.monitorClickPerformance()
  }

  /**
   * Monitor click handler performance
   */
  private monitorClickPerformance() {
    const originalAddEventListener = EventTarget.prototype.addEventListener
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'click' && typeof listener === 'function') {
        const wrappedListener = function(this: any, event: Event) {
          const startTime = performance.now()
          
          try {
            const result = listener.call(this, event)
            
            // Handle async listeners
            if (result instanceof Promise) {
              result.finally(() => {
                const duration = performance.now() - startTime
                if (duration > 150) {
                  errorMonitor.recordPerformanceViolation({
                    type: 'click-handler',
                    duration,
                    element: (event.target as Element)?.tagName || 'unknown',
                    timestamp: Date.now()
                  })
                }
              })
            } else {
              const duration = performance.now() - startTime
              if (duration > 150) {
                errorMonitor.recordPerformanceViolation({
                  type: 'click-handler',
                  duration,
                  element: (event.target as Element)?.tagName || 'unknown',
                  timestamp: Date.now()
                })
              }
            }
            
            return result
          } catch (error) {
            const duration = performance.now() - startTime
            errorMonitor.recordError({
              type: 'console-error',
              message: `Click handler error: ${error}`,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              additionalData: { duration, element: (event.target as Element)?.tagName }
            })
            throw error
          }
        }
        
        return originalAddEventListener.call(this, type, wrappedListener, options)
      }
      
      return originalAddEventListener.call(this, type, listener, options)
    }
  }

  /**
   * Handle message channel specific errors
   */
  private setupMessageChannelErrorHandler() {
    // Override console.error to catch message channel errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('message channel') || 
          message.includes('Extension context') ||
          message.includes('chrome-extension')) {
        
        this.recordError({
          type: 'message-channel',
          message: `Message channel error: ${message}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
        
        // Still log to console but mark as handled
        originalConsoleError.call(console, '[HANDLED]', ...args)
        return
      }
      
      originalConsoleError.call(console, ...args)
    }
  }

  /**
   * Record an error
   */
  private recordError(error: ErrorReport) {
    this.errors.push(error)
    
    // Limit stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Error Monitor] ${error.type}:`, error.message)
    }
  }

  /**
   * Record a performance violation
   */
  recordPerformanceViolation(violation: PerformanceViolation) {
    this.performanceViolations.push(violation)
    
    // Limit stored violations
    if (this.performanceViolations.length > this.maxErrors) {
      this.performanceViolations = this.performanceViolations.slice(-this.maxErrors)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance Monitor] ${violation.type}: ${violation.duration}ms`)
    }
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.toString) return error.toString()
    return 'Unknown error'
  }

  /**
   * Check if error is from browser extension
   */
  private isBrowserExtensionError(message: string): boolean {
    const extensionPatterns = [
      'chrome-extension://',
      'moz-extension://',
      'Extension context',
      'message channel closed',
      'listener indicated an asynchronous response'
    ]
    
    return extensionPatterns.some(pattern => message.includes(pattern))
  }

  /**
   * Check if error is non-critical and can be suppressed
   */
  private isNonCriticalError(message: string): boolean {
    const nonCriticalPatterns = [
      'ResizeObserver loop limit exceeded',
      'Non-passive event listener',
      'message channel',
      'Extension context'
    ]
    
    return nonCriticalPatterns.some(pattern => message.includes(pattern))
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    return {
      totalErrors: this.errors.length,
      totalPerformanceViolations: this.performanceViolations.length,
      errorsByType: this.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentErrors: this.errors.slice(-10),
      recentViolations: this.performanceViolations.slice(-10)
    }
  }

  /**
   * Clear all recorded errors and violations
   */
  clear() {
    this.errors = []
    this.performanceViolations = []
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor()

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  errorMonitor.init()
}
