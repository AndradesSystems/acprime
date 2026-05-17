import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Subscriptions from "./pages/Subscriptions";
import Contracts from "./pages/Contracts";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import { authService } from "@/lib/auth";
import Balance from "./pages/Balance";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/balance"
            element={
              <PrivateRoute>
                <Layout>
                  <Balance />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <PrivateRoute>
                <Layout>
                  <Subscriptions />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/contracts"
            element={
              <PrivateRoute>
                <Layout>
                  <Contracts />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Layout>
                  <Clients />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Layout>
                  <Reports />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
