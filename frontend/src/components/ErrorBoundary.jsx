import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffeeba' }}>
          <strong>Something went wrong rendering this section.</strong>
          <div style={{ marginTop: 8, color: '#856404', fontSize: 13 }}>{String(this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
