/// <reference types="vite/client" />
import React from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State { hasError: boolean; error: Error | null; resetKey: number; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
            {import.meta.env.DEV && this.state.error?.message && (
              <p className="text-sm text-slate-500 mt-1">{this.state.error.message}</p>
            )}
          </div>
          <button
            onClick={() => this.setState(s => ({ hasError: false, error: null, resetKey: s.resetKey + 1 }))}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

export const LocationAwareErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
};
