import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      try {
        const parsed = JSON.parse(this.state.error?.message || '{}');
        if (parsed.error) {
          errorMessage = `데이터베이스 오류: ${parsed.error}`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mb-8">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">문제가 발생했습니다</h1>
          <p className="text-gray-500 max-w-md mb-10 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-8 py-4 rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10"
          >
            <RefreshCcw size={20} className="mr-2" />
            <span>페이지 새로고침</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
