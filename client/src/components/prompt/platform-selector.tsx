import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Zap, Terminal, MousePointer, Wind } from "lucide-react";

const platforms = [
  {
    value: "lovable",
    label: "Lovable",
    description: "Drag-and-drop editor, custom templates, SEO tools",
    icon: Heart,
    color: "text-purple-400",
  },
  {
    value: "bolt", 
    label: "Bolt",
    description: "Rapid app building, performance optimization, serverless functions",
    icon: Zap,
    color: "text-yellow-400",
  },
  {
    value: "replit",
    label: "Replit", 
    description: "Cloud IDE, GitHub integration, containerized hosting",
    icon: Terminal,
    color: "text-orange-400",
  },
  {
    value: "cursor",
    label: "Cursor",
    description: "UI/UX design tools, animation library, API binding",
    icon: MousePointer,
    color: "text-blue-400",
  },
  {
    value: "windsurf",
    label: "Windsurf",
    description: "Workflow automation, dynamic web apps, CI/CD pipeline",
    icon: Wind,
    color: "text-teal-400",
  },
];

interface PlatformSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function PlatformSelector({ value, onValueChange }: PlatformSelectorProps) {
  const selectedPlatform = platforms.find(p => p.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-dark-800 border-gray-700 text-white h-auto py-3">
        <SelectValue>
          {selectedPlatform ? (
            <div className="flex items-center space-x-3">
              <selectedPlatform.icon className={`w-5 h-5 ${selectedPlatform.color}`} />
              <div className="text-left">
                <div className="font-medium">{selectedPlatform.label}</div>
                <div className="text-sm text-gray-400">{selectedPlatform.description}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Select a platform...</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-dark-800 border-gray-700">
        {platforms.map((platform) => (
          <SelectItem 
            key={platform.value} 
            value={platform.value}
            className="hover:bg-dark-700 focus:bg-dark-700 data-[highlighted]:bg-dark-700"
          >
            <div className="flex items-center space-x-3 py-2">
              <platform.icon className={`w-5 h-5 ${platform.color}`} />
              <div>
                <div className="font-medium text-white">{platform.label}</div>
                <div className="text-sm text-gray-400">{platform.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
