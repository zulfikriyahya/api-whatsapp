"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6 mb-6 shadow-xl shadow-red-500/10">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Something went wrong
          </h2>
          <p className="max-w-md text-muted-foreground mb-8 text-lg">
            {this.state.error?.message ||
              "An unexpected error occurred while processing your request."}
          </p>
          <button
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCw size={18} /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
