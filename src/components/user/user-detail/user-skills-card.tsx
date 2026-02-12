"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "lib/utils";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, FileText } from "lucide-react";

type Skill = {
  id: string;
  name: string;
  description?: string;
  content: string;
  createdAt: string;
};

export function UserSkillsCard() {
  const { data: skills, isLoading } = useSWR<Skill[]>("/api/skill", fetcher);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/skill/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
            const json = JSON.parse(errorText);
            errorMessage = json.error || json.message || errorText;
        } catch(e) {}
        throw new Error(errorMessage);
      }

      const result = await res.json();
      toast.success(`Uploaded ${result.skills.length} skills`);
      mutate("/api/skill");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload skills");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/skill/${id}`, { method: "DELETE" });
      mutate("/api/skill");
      toast.success("Skill deleted");
    } catch (error) {
      toast.error("Failed to delete skill");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Skills</CardTitle>
        <CardDescription>
          Upload .zip files containing skill definitions. Each folder should contain a SKILL.md file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            id="skill-upload"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => document.getElementById("skill-upload")?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Skills (.zip)
          </Button>
        </div>

        <div className="border rounded-md">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : skills && skills.length > 0 ? (
            <div className="divide-y">
              {skills.map((skill) => (
                <div key={skill.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(skill.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No skills found. Upload a zip file to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
