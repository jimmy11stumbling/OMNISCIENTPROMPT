import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { promptAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Copy, Download, Save } from "lucide-react";
import PlatformSelector from "./platform-selector";
import PromptPreview from "./prompt-preview";

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
];

const styleOptions = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "step-by-step", label: "Step-by-step" },
  { value: "example-rich", label: "Example-rich" },
  { value: "checklist", label: "Checklist" },
];

export default function PromptGenerator() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState("");
  const [style, setStyle] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [constraintInput, setConstraintInput] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: promptAPI.generate,
    onSuccess: (data) => {
      setGeneratedPrompt(data);
      toast({
        title: "Prompt Generated Successfully",
        description: "Your optimized prompt is ready for use.",
      });
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedPlatform || !query.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a platform and enter your query.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      platform: selectedPlatform,
      query: query.trim(),
      tone: tone || undefined,
      style: style || undefined,
      constraints: constraints.length > 0 ? constraints : undefined,
    });
  };

  const addConstraint = () => {
    if (constraintInput.trim() && !constraints.includes(constraintInput.trim())) {
      setConstraints([...constraints, constraintInput.trim()]);
      setConstraintInput("");
    }
  };

  const removeConstraint = (constraint: string) => {
    setConstraints(constraints.filter(c => c !== constraint));
  };

  const handleCopyPrompt = () => {
    if (generatedPrompt?.prompt) {
      navigator.clipboard.writeText(generatedPrompt.prompt);
      toast({
        title: "Copied to Clipboard",
        description: "The generated prompt has been copied to your clipboard.",
      });
    }
  };

  const handleDownloadPrompt = () => {
    if (generatedPrompt?.prompt) {
      const blob = new Blob([generatedPrompt.prompt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-${selectedPlatform}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your prompt has been downloaded as a text file.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="space-y-6">
        <Card className="bg-dark-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Wand2 className="w-5 h-5 mr-2" />
              Prompt Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-white">Target Platform *</Label>
              <PlatformSelector 
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              />
            </div>

            {/* Query Input */}
            <div className="space-y-2">
              <Label className="text-white">Describe what you want to achieve *</Label>
              <Textarea
                placeholder="Example: I want to set up GitHub integration on my Replit project with automatic deployments..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px] bg-dark-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label className="text-white">Tone (Optional)</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select tone..." />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label className="text-white">Style (Optional)</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select style..." />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <Label className="text-white">Constraints (Optional)</Label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a constraint..."
                  value={constraintInput}
                  onChange={(e) => setConstraintInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addConstraint()}
                  className="flex-1 px-3 py-2 bg-dark-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button onClick={addConstraint} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {constraints.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {constraints.map((constraint, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeConstraint(constraint)}
                    >
                      {constraint} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !selectedPlatform || !query.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Prompt...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Optimized Prompt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview/Results */}
      <div className="space-y-6">
        <PromptPreview 
          prompt={generatedPrompt}
          isLoading={generateMutation.isPending}
        />

        {/* Action Buttons */}
        {generatedPrompt && (
          <Card className="bg-dark-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex space-x-3">
                <Button
                  onClick={handleCopyPrompt}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={handleDownloadPrompt}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
