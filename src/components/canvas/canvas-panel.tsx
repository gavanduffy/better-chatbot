"use client";

import { useCanvasStore } from "@/app/store/canvas.store";
import { Button } from "ui/button";
import { X, Code, Eye } from "lucide-react";
import { CodeViewer } from "./code-viewer";
import { PPTXViewer } from "./pptx-viewer";
import { Tabs, TabsList, TabsTrigger } from "ui/tabs";
import { useState } from "react";

export function CanvasPanel() {
  const { isOpen, artifact, closeCanvas } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  if (!isOpen || !artifact) return null;

  const isPresentation = artifact.type === "presentation";

  return (
    <div className="h-full flex flex-col border-l bg-background w-full md:w-[50%] lg:w-[45%] xl:w-[40%] transition-all duration-300 shadow-xl z-20 relative">
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h2 className="font-semibold truncate max-w-[200px] text-sm">{artifact.title}</h2>
        <div className="flex items-center gap-2">
           {!isPresentation && (
             <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-7">
                <TabsList className="h-7 p-0 bg-muted/50">
                <TabsTrigger value="preview" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    Code
                </TabsTrigger>
                </TabsList>
            </Tabs>
           )}
          <Button variant="ghost" size="icon" onClick={closeCanvas} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-muted/10 relative">
        {(activeTab === "code" && !isPresentation) && (
           <div className="h-full overflow-y-auto">
             <CodeViewer
               code={typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content, null, 2)}
               language={artifact.type === "react" ? "tsx" : "html"}
               className="h-full border-none rounded-none bg-transparent"
             />
           </div>
        )}
        {(activeTab === "preview" || isPresentation) && (
          <div className="h-full w-full">
            {artifact.type === "html" && typeof artifact.content === 'string' && (
               <iframe
                 srcDoc={artifact.content}
                 className="w-full h-full border-none bg-white"
                 title="Preview"
                 sandbox="allow-scripts"
               />
            )}
             {artifact.type === "react" && (
               <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center space-y-4">
                 <div className="bg-muted p-4 rounded-full">
                    <Code className="h-8 w-8 opacity-50" />
                 </div>
                 <div className="max-w-xs">
                    <p className="font-medium">React Component Preview</p>
                    <p className="text-sm mt-1">Live preview for React components is not yet supported. Please switch to the Code tab to view the source.</p>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setActiveTab("code")}>
                    View Code
                 </Button>
               </div>
            )}
            {artifact.type === "presentation" && (
              <PPTXViewer title={artifact.title} slides={artifact.content} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
