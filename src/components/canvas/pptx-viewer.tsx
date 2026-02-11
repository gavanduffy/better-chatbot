"use client";

// @ts-ignore
import pptxgen from "pptxgenjs";
import { Button } from "ui/button";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";

interface Slide {
  title: string;
  content: string;
  type?: "title" | "content" | "two-column";
}

interface PPTXViewerProps {
  title: string;
  slides: Slide[];
}

export function PPTXViewer({ title, slides }: PPTXViewerProps) {
  const handleDownload = () => {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";

    slides.forEach((slide) => {
      const s = pres.addSlide();
      if (slide.type === 'title') {
          s.addText(slide.title, { x: 0.5, y: 1.5, w: "90%", fontSize: 36, bold: true, align: 'center' });
          s.addText(slide.content, { x: 0.5, y: 3.5, w: "90%", fontSize: 18, align: 'center' });
      } else {
          s.addText(slide.title, { x: 0.5, y: 0.5, w: "90%", fontSize: 24, bold: true });
          s.addText(slide.content, { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 14 });
      }
    });

    pres.writeFile({ fileName: `${title}.pptx` });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
            <div className="bg-orange-500/10 p-2 rounded-md">
                <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-xs text-muted-foreground">{slides.length} slides</p>
            </div>
        </div>
        <Button onClick={handleDownload} size="sm">
            <Download className="mr-2 h-3.5 w-3.5" />
            Download
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
          {slides.map((slide, i) => (
              <Card key={i} className="bg-card shadow-sm border-0 ring-1 ring-border">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{slide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{slide.content}</p>
                  </CardContent>
              </Card>
          ))}
      </div>
    </div>
  );
}
