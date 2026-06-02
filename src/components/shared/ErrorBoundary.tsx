import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 glass rounded-2xl border border-red-500/20 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 text-3xl">
            ⚠️
          </div>
          <h3 className="text-white font-bold text-lg mb-2">حصل خطأ غير متوقع</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed font-sans">
            حصل خطأ أثناء تحميل البيانات، يرجى المحاولة لاحقاً.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
