import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import PromptGenerator from "@/components/prompt/prompt-generator";

export default function PromptGeneratorPage() {
  const { setCurrentPage } = useAppStore();

  useEffect(() => {
    setCurrentPage("prompt-generator");
  }, [setCurrentPage]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Prompt Generator</h1>
        <p className="text-gray-400 mt-2">
          Generate optimized prompts for no-code platforms using AI-powered analysis and RAG documentation
        </p>
      </div>

      {/* Main Content */}
      <PromptGenerator />
    </div>
  );
}
