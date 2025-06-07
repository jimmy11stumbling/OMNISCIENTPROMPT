import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { ragAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  FileText, 
  Code, 
  Lightbulb, 
  Settings,
  Heart,
  Zap,
  Terminal,
  MousePointer,
  Wind,
  Database,
  Network,
  ArrowLeftRight,
  Brain,
  Activity,
  Users,
  Shield,
  Bookmark,
  Download,
  Share
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSection[];
}

const platformDocs = {
  lovable: {
    icon: Heart,
    color: "text-purple-400",
    sections: [
      {
        id: "getting-started",
        title: "Getting Started",
        content: "Learn the basics of Lovable's drag-and-drop editor and how to create your first project.",
        subsections: [
          {
            id: "setup",
            title: "Initial Setup",
            content: "Create your Lovable account and set up your first project workspace. Configure your preferences and explore the interface."
          },
          {
            id: "first-project", 
            title: "Your First Project",
            content: "Build a simple landing page using Lovable's visual editor. Learn about components, layouts, and styling options."
          }
        ]
      },
      {
        id: "payment-integration",
        title: "Payment Integration",
        content: "Set up payment processing with Stripe, PayPal, and other providers. Configure webhooks and handle transactions securely.",
        subsections: [
          {
            id: "stripe-setup",
            title: "Stripe Integration",
            content: "Connect your Stripe account and configure payment forms. Set up subscription billing and one-time payments."
          },
          {
            id: "webhooks",
            title: "Webhook Configuration", 
            content: "Set up webhook endpoints to handle payment events. Process successful payments and failed transactions."
          }
        ]
      },
      {
        id: "video-embedding",
        title: "Video Embedding",
        content: "Embed YouTube, Vimeo, and custom video content. Configure autoplay, controls, and responsive sizing.",
        subsections: [
          {
            id: "youtube",
            title: "YouTube Integration",
            content: "Embed YouTube videos with custom thumbnails and player controls. Set up playlists and autoplay sequences."
          },
          {
            id: "custom-video",
            title: "Custom Video Players",
            content: "Upload and host your own video content. Configure adaptive bitrate streaming and video analytics."
          }
        ]
      }
    ]
  },
  bolt: {
    icon: Zap,
    color: "text-yellow-400",
    sections: [
      {
        id: "rapid-development",
        title: "Rapid Development",
        content: "Build applications quickly using Bolt's performance-optimized framework and pre-built components.",
        subsections: [
          {
            id: "quick-start",
            title: "Quick Start Guide",
            content: "Get up and running with Bolt in minutes. Set up your development environment and create your first app."
          },
          {
            id: "components",
            title: "Component Library",
            content: "Explore Bolt's extensive component library. Use pre-built UI elements and customize them for your needs."
          }
        ]
      },
      {
        id: "database-setup",
        title: "Database Integration",
        content: "Connect to PostgreSQL, MySQL, or MongoDB databases. Configure connection pooling and SSL settings.",
        subsections: [
          {
            id: "postgres",
            title: "PostgreSQL Setup",
            content: "Configure PostgreSQL connections with connection pooling and SSL. Set up read replicas and backup strategies."
          },
          {
            id: "mongodb",
            title: "MongoDB Integration",
            content: "Connect to MongoDB clusters and configure sharding. Set up indexes and optimize query performance."
          }
        ]
      },
      {
        id: "performance",
        title: "Performance Optimization",
        content: "Optimize your Bolt applications for maximum performance. Use code splitting, caching, and monitoring.",
        subsections: [
          {
            id: "code-splitting",
            title: "Code Splitting",
            content: "Implement dynamic imports and route-based code splitting. Reduce bundle sizes and improve load times."
          },
          {
            id: "caching",
            title: "Caching Strategies",
            content: "Set up Redis caching, CDN integration, and browser caching. Configure cache invalidation policies."
          }
        ]
      }
    ]
  },
  replit: {
    icon: Terminal,
    color: "text-orange-400",
    sections: [
      {
        id: "cloud-ide",
        title: "Cloud IDE",
        content: "Use Replit's cloud-based development environment for collaborative coding and instant deployment.",
        subsections: [
          {
            id: "workspace",
            title: "Workspace Setup",
            content: "Configure your Replit workspace with custom environments, packages, and development tools."
          },
          {
            id: "collaboration",
            title: "Real-time Collaboration",
            content: "Invite team members to collaborate on code in real-time. Use multiplayer editing and shared terminals."
          }
        ]
      },
      {
        id: "github-integration",
        title: "GitHub Integration",
        content: "Connect your Replit projects to GitHub repositories. Enable automatic syncing and deployment workflows.",
        subsections: [
          {
            id: "repo-sync",
            title: "Repository Synchronization",
            content: "Link your Replit project to a GitHub repository. Configure automatic syncing and branch management."
          },
          {
            id: "cicd",
            title: "CI/CD Workflows",
            content: "Set up continuous integration and deployment using GitHub Actions. Automate testing and deployment."
          }
        ]
      },
      {
        id: "deployment",
        title: "Deployment & Hosting",
        content: "Deploy your applications using Replit's containerized hosting platform with custom domains and SSL.",
        subsections: [
          {
            id: "container-hosting",
            title: "Container Deployment",
            content: "Deploy applications in isolated containers with automatic scaling and load balancing."
          },
          {
            id: "custom-domains",
            title: "Custom Domain Setup",
            content: "Configure custom domains with SSL certificates. Set up DNS records and domain forwarding."
          }
        ]
      }
    ]
  },
  cursor: {
    icon: MousePointer,
    color: "text-blue-400",
    sections: [
      {
        id: "ui-design",
        title: "UI Design Tools",
        content: "Create beautiful user interfaces using Cursor's advanced design tools and component library.",
        subsections: [
          {
            id: "design-system",
            title: "Design System",
            content: "Build consistent design systems with reusable components, color palettes, and typography."
          },
          {
            id: "responsive-design",
            title: "Responsive Design",
            content: "Create responsive layouts that work across all devices. Use breakpoints and flexible grids."
          }
        ]
      },
      {
        id: "api-binding",
        title: "API Data Binding",
        content: "Connect external APIs to your Cursor components. Configure authentication and data mapping.",
        subsections: [
          {
            id: "rest-apis",
            title: "REST API Integration",
            content: "Connect to REST APIs with authentication headers and request/response mapping."
          },
          {
            id: "graphql",
            title: "GraphQL Integration",
            content: "Set up GraphQL queries and mutations. Configure schema introspection and caching."
          }
        ]
      },
      {
        id: "export-options",
        title: "Code Export",
        content: "Export your designs to React, Vue, Angular, or static HTML with optimized code generation.",
        subsections: [
          {
            id: "react-export",
            title: "React Code Export",
            content: "Generate clean React components with TypeScript support and modern hooks."
          },
          {
            id: "static-export",
            title: "Static Site Export",
            content: "Export to static HTML, CSS, and JavaScript for deployment to any hosting platform."
          }
        ]
      }
    ]
  },
  windsurf: {
    icon: Wind,
    color: "text-teal-400",
    sections: [
      {
        id: "workflow-automation",
        title: "Workflow Automation",
        content: "Automate your development and deployment workflows with Windsurf's powerful automation tools.",
        subsections: [
          {
            id: "triggers",
            title: "Workflow Triggers",
            content: "Set up automated workflows triggered by code commits, schedules, or external events."
          },
          {
            id: "actions",
            title: "Custom Actions",
            content: "Create custom workflow actions for testing, building, and deploying your applications."
          }
        ]
      },
      {
        id: "email-automation",
        title: "Email Automation",
        content: "Set up automated email campaigns with triggers, conditions, and personalization.",
        subsections: [
          {
            id: "campaigns",
            title: "Email Campaigns",
            content: "Create and manage email campaigns with templates, scheduling, and A/B testing."
          },
          {
            id: "triggers",
            title: "Email Triggers",
            content: "Set up trigger-based emails for user actions, events, and conditions."
          }
        ]
      },
      {
        id: "scaling",
        title: "Application Scaling",
        content: "Configure auto-scaling policies and load balancing for high-traffic applications.",
        subsections: [
          {
            id: "auto-scaling",
            title: "Auto-scaling Setup",
            content: "Configure automatic scaling based on CPU, memory, and request metrics."
          },
          {
            id: "load-balancing",
            title: "Load Balancing",
            content: "Set up load balancers and failover mechanisms for high availability."
          }
        ]
      }
    ]
  }
};

const systemDocs = {
  "rag-database": {
    icon: Database,
    title: "RAG Database",
    sections: [
      {
        id: "overview",
        title: "RAG 2.0 Overview",
        content: "Learn about Retrieval-Augmented Generation 2.0 and how it enhances prompt generation with contextual information."
      },
      {
        id: "vector-search",
        title: "Vector Search",
        content: "Understand how vector similarity search works to find relevant documentation for your prompts."
      },
      {
        id: "document-indexing",
        title: "Document Indexing",
        content: "Learn how documents are processed, embedded, and indexed for efficient retrieval."
      }
    ]
  },
  "mcp-protocol": {
    icon: Network,
    title: "MCP Protocol",
    sections: [
      {
        id: "protocol-overview",
        title: "Protocol Overview",
        content: "Understand the Model Context Protocol and how it enables communication between AI services."
      },
      {
        id: "server-setup",
        title: "Server Setup",
        content: "Configure and manage MCP servers for distributed AI processing."
      },
      {
        id: "message-handling",
        title: "Message Handling",
        content: "Learn about message routing, processing, and error handling in the MCP system."
      }
    ]
  },
  "a2a-protocol": {
    icon: ArrowLeftRight,
    title: "A2A Protocol",
    sections: [
      {
        id: "agent-communication",
        title: "Agent Communication",
        content: "Understand how agents communicate and coordinate tasks using the A2A protocol."
      },
      {
        id: "task-management",
        title: "Task Management",
        content: "Learn about task assignment, prioritization, and execution across multiple agents."
      },
      {
        id: "load-balancing",
        title: "Load Balancing",
        content: "Configure load balancing and failover mechanisms for agent networks."
      }
    ]
  },
  "deepseek-api": {
    icon: Brain,
    title: "DeepSeek Integration",
    sections: [
      {
        id: "api-setup",
        title: "API Setup",
        content: "Configure DeepSeek API credentials and connection settings."
      },
      {
        id: "reasoning-engine",
        title: "Reasoning Engine",
        content: "Understand how DeepSeek's reasoning capabilities enhance prompt generation."
      },
      {
        id: "optimization",
        title: "Performance Optimization",
        content: "Optimize API calls, token usage, and response times for better performance."
      }
    ]
  }
};

export default function Documentation() {
  const { setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState("platforms");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("lovable");
  const [selectedSystemDoc, setSelectedSystemDoc] = useState("rag-database");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentPage("documentation");
  }, [setCurrentPage]);

  // Search documents
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/rag/search", searchQuery],
    queryFn: () => ragAPI.search({ query: searchQuery, limit: 10 }),
    enabled: searchQuery.length > 2,
  });

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  const renderDocSection = (section: DocSection, level: number = 0) => {
    const isOpen = openSections.has(section.id);
    
    return (
      <div key={section.id} className="space-y-3">
        <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-3 hover:bg-dark-800 text-left",
                level > 0 && "ml-4 border-l border-gray-700 pl-6"
              )}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <span className="font-medium text-white">{section.title}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={cn("p-4 bg-dark-800 rounded-lg ml-4", level > 0 && "ml-8")}>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {section.content}
              </p>
              {section.subsections && (
                <div className="space-y-2">
                  {section.subsections.map(subsection => renderDocSection(subsection, level + 1))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documentation Hub</h1>
          <p className="text-gray-400 mt-2">
            Comprehensive guides and documentation for all platform integrations and system components
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-600">
            <Bookmark className="w-4 h-4 mr-2" />
            Bookmarks
          </Button>
          <Button variant="outline" className="border-gray-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-dark-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documentation, guides, and examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-dark-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchQuery.length > 2 && (
            <div className="mt-6">
              {searchLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-dark-800 rounded-lg p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : searchResults?.documents?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Search Results ({searchResults.totalFound})</h3>
                  {searchResults.documents.map((doc: any, index: number) => (
                    <div key={index} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-medium text-white mb-2">{doc.title}</h4>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {doc.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                          {doc.platform}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                          {doc.documentType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No results found for "{searchQuery}"</p>
                  <p className="text-gray-500 text-sm mt-1">Try different keywords or browse the categories below</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border border-gray-700">
          <TabsTrigger value="platforms" className="data-[state=active]:bg-primary-600">
            <Settings className="w-4 h-4 mr-2" />
            Platform Guides
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-primary-600">
            <Activity className="w-4 h-4 mr-2" />
            System Documentation
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary-600">
            <Code className="w-4 h-4 mr-2" />
            API Reference
          </TabsTrigger>
          <TabsTrigger value="examples" className="data-[state=active]:bg-primary-600">
            <Lightbulb className="w-4 h-4 mr-2" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Platform Selector */}
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(platformDocs).map(([platform, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={platform}
                      variant={selectedPlatform === platform ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        selectedPlatform === platform ? "bg-primary-600" : "hover:bg-dark-800"
                      )}
                      onClick={() => setSelectedPlatform(platform)}
                    >
                      <Icon className={cn("w-4 h-4 mr-2", config.color)} />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Platform Documentation */}
            <div className="lg:col-span-3">
              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {platformDocs[selectedPlatform as keyof typeof platformDocs] && (
                      <>
                        <platformDocs[selectedPlatform as keyof typeof platformDocs].icon 
                          className={cn("w-6 h-6", platformDocs[selectedPlatform as keyof typeof platformDocs].color)} 
                        />
                        <CardTitle className="text-white capitalize">
                          {selectedPlatform} Documentation
                        </CardTitle>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {platformDocs[selectedPlatform as keyof typeof platformDocs]?.sections.map(section => 
                        renderDocSection(section)
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* System Component Selector */}
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">System Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(systemDocs).map(([component, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={component}
                      variant={selectedSystemDoc === component ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        selectedSystemDoc === component ? "bg-primary-600" : "hover:bg-dark-800"
                      )}
                      onClick={() => setSelectedSystemDoc(component)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {config.title}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* System Documentation */}
            <div className="lg:col-span-3">
              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {systemDocs[selectedSystemDoc as keyof typeof systemDocs] && (
                      <>
                        <systemDocs[selectedSystemDoc as keyof typeof systemDocs].icon className="w-6 h-6" />
                        <CardTitle className="text-white">
                          {systemDocs[selectedSystemDoc as keyof typeof systemDocs].title}
                        </CardTitle>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {systemDocs[selectedSystemDoc as keyof typeof systemDocs]?.sections.map((section, index) => (
                        <div key={index} className="bg-dark-800 rounded-lg p-4">
                          <h3 className="font-medium text-white mb-2">{section.title}</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {/* API Reference */}
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-dark-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-3">Authentication</h3>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300 mb-3">
                    <div className="text-green-400">// Include API key in headers</div>
                    <div>Authorization: Bearer YOUR_API_KEY</div>
                  </div>
                  <p className="text-gray-400 text-sm">All API requests require authentication using your API key.</p>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-3">Generate Prompt</h3>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300 mb-3">
                    <div className="text-blue-400">POST</div>
                    <div>/api/prompts/generate</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300 mb-3">
                    <div className="text-yellow-400">// Request body</div>
                    <div>{'{'}</div>
                    <div>  "platform": "replit",</div>
                    <div>  "query": "Set up GitHub integration",</div>
                    <div>  "tone": "professional"</div>
                    <div>{'}'}</div>
                  </div>
                  <p className="text-gray-400 text-sm">Generate optimized prompts for specific platforms.</p>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-3">Search RAG Database</h3>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300 mb-3">
                    <div className="text-green-400">GET</div>
                    <div>/api/rag/search?query=github&platform=replit</div>
                  </div>
                  <p className="text-gray-400 text-sm">Search documentation and examples in the RAG database.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          {/* Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Prompt Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-dark-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Replit GitHub Setup</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Example prompt for setting up GitHub integration on Replit.
                  </p>
                  <div className="bg-gray-900 rounded p-3 text-sm text-gray-300">
                    "I want to connect my Replit project to a GitHub repository with automatic syncing..."
                  </div>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Lovable Payment Setup</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Example prompt for integrating Stripe payments in Lovable.
                  </p>
                  <div className="bg-gray-900 rounded p-3 text-sm text-gray-300">
                    "Help me set up Stripe payment processing for my e-commerce site in Lovable..."
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Integration Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-dark-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">API Integration</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Example of using the prompt generation API.
                  </p>
                  <div className="bg-gray-900 rounded p-3 font-mono text-xs text-gray-300">
                    <div>const response = await fetch('/api/prompts/generate', {'{'}</div>
                    <div>  method: 'POST',</div>
                    <div>  headers: {'{'} 'Content-Type': 'application/json' {'}'},</div>
                    <div>  body: JSON.stringify({'{'} platform: 'bolt', query: '...' {'}'})</div>
                    <div>{'}'});</div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Webhook Setup</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Example webhook handler for real-time updates.
                  </p>
                  <div className="bg-gray-900 rounded p-3 font-mono text-xs text-gray-300">
                    <div>app.post('/webhook', (req, res) => {'{'}</div>
                    <div>  const event = req.body;</div>
                    <div>  // Handle prompt generation events</div>
                    <div>  res.status(200).send('OK');</div>
                    <div>{'}'});</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
