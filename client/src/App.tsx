import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import PromptGenerator from "@/pages/prompt-generator";
import Platforms from "@/pages/platforms";
import RAGDatabase from "@/pages/rag-database";
import MCPHub from "@/pages/mcp-hub";
import A2AProtocol from "@/pages/a2a-protocol";
import DeepSeekIntegration from "@/pages/deepseek-integration";
import Analytics from "@/pages/analytics";
import Monitoring from "@/pages/monitoring";
import AdminPortal from "@/pages/admin-portal";
import Documentation from "@/pages/documentation";
import NotFound from "@/pages/not-found";
import { AppStoreProvider } from "@/store/app-store";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-950 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-dark-950 p-6">
          <div className="max-w-7xl mx-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/prompt-generator" component={PromptGenerator} />
              <Route path="/platforms" component={Platforms} />
              <Route path="/rag-database" component={RAGDatabase} />
              <Route path="/mcp-hub" component={MCPHub} />
              <Route path="/a2a-protocol" component={A2AProtocol} />
              <Route path="/deepseek-integration" component={DeepSeekIntegration} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/monitoring" component={Monitoring} />
              <Route path="/admin-portal" component={AdminPortal} />
              <Route path="/documentation" component={Documentation} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppStoreProvider>
    </QueryClientProvider>
  );
}

export default App;
