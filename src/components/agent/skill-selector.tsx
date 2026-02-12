"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "lib/utils";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "lib/utils";
import { Button } from "ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "ui/popover";
import { Badge } from "ui/badge";

type Skill = {
  id: string;
  name: string;
};

interface SkillSelectorProps {
  selectedSkillIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function SkillSelector({
  selectedSkillIds = [],
  onChange,
  disabled,
}: SkillSelectorProps) {
  const { data: skills, isLoading } = useSWR<Skill[]>("/api/skill", fetcher);
  const [open, setOpen] = useState(false);

  const selectedSkills = useMemo(() => {
    if (!skills) return [];
    return skills.filter((s) => selectedSkillIds.includes(s.id));
  }, [skills, selectedSkillIds]);

  const toggleSkill = (id: string) => {
    if (selectedSkillIds.includes(id)) {
      onChange(selectedSkillIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedSkillIds, id]);
    }
  };

  const removeSkill = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedSkillIds.filter((sid) => sid !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
          disabled={disabled || isLoading}
        >
          <div className="flex flex-wrap gap-1">
            {selectedSkills.length > 0 ? (
              selectedSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {skill.name}
                  <div
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => removeSkill(e, skill.id)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Select skills...</span>
            )}
          </div>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search skills..." />
          <CommandList>
            <CommandEmpty>No skill found.</CommandEmpty>
            <CommandGroup>
              {skills?.map((skill) => (
                <CommandItem
                  key={skill.id}
                  value={skill.name}
                  onSelect={() => toggleSkill(skill.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedSkillIds.includes(skill.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {skill.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
