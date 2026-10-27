import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { EcgBackground } from "./components/EcgBackground";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Lazy-loaded routes for code-splitting
const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Assessment = lazy(() => import("./pages/Assessment").then((m) => ({ default: m.Assessment })));
const Result = lazy(() => import("./pages/Result").then((m) => ({ default: m.Result })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const BatchPredict = lazy(() => import("./pages/BatchPredict").then((m) => ({ default: m.BatchPredict })));
const History = lazy(() => import("./pages/History").then((m) => ({ default: m.History })));
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

// Error Boundary Component
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FBFF] text-center">
          <div className="max-w-md p-8 rounded-2xl bg-white border border-rose-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              An unexpected client error occurred. Please refresh or navigate back to the home page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen flex flex-col relative selection:bg-teal-500 selection:text-white">
            <EcgBackground />
            <Navbar />
            <main className="flex-1">
              <Suspense
                fallback={
                  <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Loading CardioCare Interface...</p>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/assessment" element={<Assessment />} />
                  <Route path="/diabetes" element={<Navigate to="/assessment" replace />} />
                  <Route path="/result" element={<Result />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/batch" element={<BatchPredict />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
