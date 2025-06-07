import { storage } from "../storage";
import { type PlatformIntegration, type InsertPlatformIntegration } from "@shared/schema";
import { ragService } from "./rag";

export interface PlatformStatus {
  name: string;
  status: "online" | "offline" | "syncing" | "error";
  lastSync: Date | null;
  docsLastUpdated: Date | null;
  apiHealth: boolean;
  documentCount: number;
}

export interface PlatformSyncResult {
  platform: string;
  documentsAdded: number;
  documentsUpdated: number;
  errors: string[];
  syncTime: number;
}

export class PlatformService {
  private syncInProgress: Set<string> = new Set();

  constructor() {
    this.initializePlatforms();
  }

  async getAllPlatforms(): Promise<PlatformIntegration[]> {
    return await storage.getAllPlatformIntegrations();
  }

  async getPlatformStatus(platformName: string): Promise<PlatformStatus | null> {
    const platform = await storage.getPlatformIntegration(platformName);
    if (!platform) return null;

    // Check API health
    const apiHealth = await this.checkPlatformAPI(platformName);

    return {
      name: platform.name,
      status: platform.status as any,
      lastSync: platform.lastSync,
      docsLastUpdated: platform.docsLastUpdated,
      apiHealth,
      documentCount: platform.documentCount
    };
  }

  async syncPlatform(platformName: string): Promise<PlatformSyncResult> {
    if (this.syncInProgress.has(platformName)) {
      throw new Error(`Sync already in progress for ${platformName}`);
    }

    this.syncInProgress.add(platformName);
    const startTime = Date.now();

    try {
      await storage.updatePlatformIntegration(platformName, {
        status: "syncing",
        lastSync: new Date()
      });

      const result = await this.performPlatformSync(platformName);
      
      await storage.updatePlatformIntegration(platformName, {
        status: result.errors.length > 0 ? "error" : "online",
        docsLastUpdated: new Date(),
        documentCount: result.documentsAdded + result.documentsUpdated
      });

      result.syncTime = Date.now() - startTime;
      return result;

    } catch (error) {
      await storage.updatePlatformIntegration(platformName, {
        status: "error"
      });
      
      throw new Error(`Sync failed for ${platformName}: ${error.message}`);
    } finally {
      this.syncInProgress.delete(platformName);
    }
  }

  async syncAllPlatforms(): Promise<PlatformSyncResult[]> {
    const platforms = await this.getAllPlatforms();
    const results: PlatformSyncResult[] = [];

    for (const platform of platforms) {
      try {
        const result = await this.syncPlatform(platform.name);
        results.push(result);
      } catch (error) {
        results.push({
          platform: platform.name,
          documentsAdded: 0,
          documentsUpdated: 0,
          errors: [error.message],
          syncTime: 0
        });
      }
    }

    return results;
  }

  async checkAllPlatformHealth(): Promise<{
    totalPlatforms: number;
    onlinePlatforms: number;
    offlinePlatforms: number;
    errorPlatforms: number;
  }> {
    const platforms = await this.getAllPlatforms();
    let onlineCount = 0;
    let offlineCount = 0;
    let errorCount = 0;

    await Promise.allSettled(
      platforms.map(async (platform) => {
        try {
          const isHealthy = await this.checkPlatformAPI(platform.name);
          if (isHealthy) {
            onlineCount++;
            await storage.updatePlatformIntegration(platform.name, { status: "online" });
          } else {
            offlineCount++;
            await storage.updatePlatformIntegration(platform.name, { status: "offline" });
          }
        } catch (error) {
          errorCount++;
          await storage.updatePlatformIntegration(platform.name, { status: "error" });
        }
      })
    );

    return {
      totalPlatforms: platforms.length,
      onlinePlatforms: onlineCount,
      offlinePlatforms: offlineCount,
      errorPlatforms: errorCount
    };
  }

  private async checkPlatformAPI(platformName: string): Promise<boolean> {
    try {
      // Simulate API health check
      // In a real implementation, this would make actual API calls
      const isHealthy = Math.random() > 0.05; // 95% uptime simulation
      return isHealthy;
    } catch (error) {
      console.error(`API health check failed for ${platformName}:`, error);
      return false;
    }
  }

  private async performPlatformSync(platformName: string): Promise<PlatformSyncResult> {
    const result: PlatformSyncResult = {
      platform: platformName,
      documentsAdded: 0,
      documentsUpdated: 0,
      errors: [],
      syncTime: 0
    };

    try {
      // Get latest documentation from platform
      const newDocs = await this.fetchPlatformDocumentation(platformName);
      
      // Check existing documents
      const existingDocs = await ragService.getDocumentsByPlatform(platformName);
      const existingTitles = new Set(existingDocs.map(doc => doc.title));

      for (const doc of newDocs) {
        try {
          if (existingTitles.has(doc.title)) {
            // Update existing document
            const existing = existingDocs.find(d => d.title === doc.title);
            if (existing && existing.content !== doc.content) {
              await ragService.updateDocument(existing.id, {
                content: doc.content,
                metadata: doc.metadata
              });
              result.documentsUpdated++;
            }
          } else {
            // Add new document
            await ragService.addDocument({
              title: doc.title,
              content: doc.content,
              platform: platformName,
              documentType: doc.documentType,
              metadata: doc.metadata
            });
            result.documentsAdded++;
          }
        } catch (error) {
          result.errors.push(`Failed to sync document "${doc.title}": ${error.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`Failed to fetch documentation: ${error.message}`);
    }

    return result;
  }

  private async fetchPlatformDocumentation(platformName: string): Promise<any[]> {
    // Simulate fetching updated documentation from platform APIs
    // In a real implementation, this would make API calls to each platform
    
    const mockDocs = {
      lovable: [
        {
          title: "Advanced Payment Integration",
          content: "Updated payment integration guide with new Stripe Connect features and enhanced security measures. Includes webhook validation and retry logic.",
          documentType: "guide",
          metadata: {
            version: "2.1",
            lastUpdated: new Date().toISOString(),
            source: "official_docs",
            category: "payments"
          }
        },
        {
          title: "New Video Component Features",
          content: "Enhanced video component with support for Vimeo, custom controls, and accessibility features. Includes autoplay policies and performance optimizations.",
          documentType: "feature",
          metadata: {
            version: "1.3",
            lastUpdated: new Date().toISOString(),
            source: "feature_release",
            category: "components"
          }
        }
      ],
      bolt: [
        {
          title: "Database Migration Tools",
          content: "New migration system for seamless database schema updates. Supports rollbacks, data preservation, and multi-environment deployments.",
          documentType: "guide",
          metadata: {
            version: "3.0",
            lastUpdated: new Date().toISOString(),
            source: "official_docs",
            category: "database"
          }
        }
      ],
      replit: [
        {
          title: "Enhanced GitHub Actions Integration",
          content: "Improved GitHub Actions integration with better secret management, custom workflows, and deployment automation. Includes CI/CD templates.",
          documentType: "guide",
          metadata: {
            version: "4.2",
            lastUpdated: new Date().toISOString(),
            source: "official_docs",
            category: "deployment"
          }
        }
      ],
      cursor: [
        {
          title: "API Rate Limiting Best Practices",
          content: "Guidelines for implementing rate limiting in API connections. Includes retry strategies, caching mechanisms, and error handling patterns.",
          documentType: "guide",
          metadata: {
            version: "2.0",
            lastUpdated: new Date().toISOString(),
            source: "best_practices",
            category: "api"
          }
        }
      ],
      windsurf: [
        {
          title: "Advanced Scaling Strategies",
          content: "New auto-scaling features with predictive scaling, custom metrics, and cost optimization. Includes monitoring and alerting setup.",
          documentType: "feature",
          metadata: {
            version: "5.1",
            lastUpdated: new Date().toISOString(),
            source: "feature_release",
            category: "scaling"
          }
        }
      ]
    };

    return mockDocs[platformName] || [];
  }

  private async initializePlatforms(): Promise<void> {
    const platforms = [
      {
        name: "lovable",
        displayName: "Lovable",
        apiEndpoint: "https://api.lovable.dev",
        metadata: {
          icon: "heart",
          color: "purple",
          features: ["drag-drop-editor", "custom-templates", "seo-tools", "payment-integration"],
          version: "2.1"
        }
      },
      {
        name: "bolt",
        displayName: "Bolt",
        apiEndpoint: "https://api.bolt.new",
        metadata: {
          icon: "bolt",
          color: "yellow",
          features: ["rapid-development", "performance-optimization", "serverless-functions", "database-integration"],
          version: "3.0"
        }
      },
      {
        name: "replit",
        displayName: "Replit",
        apiEndpoint: "https://api.replit.com",
        metadata: {
          icon: "terminal",
          color: "orange",
          features: ["cloud-ide", "github-integration", "containerized-hosting", "collaboration"],
          version: "4.2"
        }
      },
      {
        name: "cursor",
        displayName: "Cursor",
        apiEndpoint: "https://api.cursor.so",
        metadata: {
          icon: "mouse-pointer",
          color: "blue",
          features: ["ui-design-tools", "animation-library", "api-binding", "export-options"],
          version: "2.0"
        }
      },
      {
        name: "windsurf",
        displayName: "Windsurf",
        apiEndpoint: "https://api.windsurf.dev",
        metadata: {
          icon: "wind",
          color: "teal",
          features: ["workflow-automation", "dynamic-apps", "cicd-pipeline", "scaling"],
          version: "5.1"
        }
      }
    ];

    for (const platformData of platforms) {
      try {
        const existing = await storage.getPlatformIntegration(platformData.name);
        if (!existing) {
          await storage.createPlatformIntegration({
            ...platformData,
            status: "offline",
            documentCount: 0
          });
        }
      } catch (error) {
        console.error(`Failed to initialize platform ${platformData.name}:`, error);
      }
    }
  }
}

export const platformService = new PlatformService();
