import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, ChevronDown, FileText, Clock, Database, Brain } from "lucide-react";
import { useState } from "react";

interface PromptPreviewProps {
  prompt: any;
  isLoading: boolean;
}

export default function PromptPreview({ prompt, isLoading }: PromptPreviewProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showRAGDocuments, setShowRAGDocuments] = useState(false);

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Generating Prompt...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full bg-gray-700" />
          <Skeleton className="h-4 w-4/5 bg-gray-700" />
          <Skeleton className="h-32 w-full bg-gray-700" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16 bg-gray-700" />
            <Skeleton className="h-6 w-20 bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prompt) {
    return (
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Prompt Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No prompt generated yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Configure your requirements and click "Generate" to create an optimized prompt
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Prompt */}
      <Card className="bg-dark-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Generated Prompt
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500 text-white">
                Success
              </Badge>
              {prompt.tokensUsed && (
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {prompt.tokensUsed} tokens
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
              <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {prompt.prompt}
              </pre>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Reasoning (if available) */}
      {prompt.reasoning && (
        <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
          <Card className="bg-dark-900 border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-dark-800 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Reasoning Process
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showReasoning ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-48 w-full">
                  <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                    <pre className="text-gray-400 whitespace-pre-wrap text-sm leading-relaxed">
                      {prompt.reasoning}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* RAG Documents Used */}
      {prompt.ragDocuments && prompt.ragDocuments.length > 0 && (
        <Collapsible open={showRAGDocuments} onOpenChange={setShowRAGDocuments}>
          <Card className="bg-dark-900 border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-dark-800 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Referenced Documentation ({prompt.ragDocuments.length})
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showRAGDocuments ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-4">
                    {prompt.ragDocuments.map((doc: any, index: number) => (
                      <div key={index} className="bg-dark-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">{doc.title}</h4>
                          <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                            {doc.documentType}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-3">
                          {doc.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Platform: {doc.platform}</span>
                          {doc.metadata?.category && (
                            <span>Category: {doc.metadata.category}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Generation Metadata */}
      <Card className="bg-dark-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {prompt.sessionId}
              </div>
              <div className="text-gray-400 text-sm">Session ID</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {prompt.ragDocuments?.length || 0}
              </div>
              <div className="text-gray-400 text-sm">Sources Used</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {prompt.tokensUsed || 0}
              </div>
              <div className="text-gray-400 text-sm">Tokens Used</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400 flex items-center justify-center">
                <Clock className="w-4 h-4 mr-1" />
                Now
              </div>
              <div className="text-gray-400 text-sm">Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
