import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
          <div className="bg-white rounded-lg border border-[#dde2ea] p-8 max-w-md text-center">
            <div className="text-3xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-[#1a2332] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#6b7a99] mb-6">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
