"use client";

import { Filter, FileImage, FileVideo, FileAudio, FileText, File, X } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";

export type AttachmentFilterType = "all" | "image" | "video" | "audio" | "pdf" | "document" | "other";

interface AttachmentFilterProps {
  activeFilter: AttachmentFilterType;
  onFilterChange: (filter: AttachmentFilterType) => void;
}

const filterOptions = [
  { value: "all" as const, label: "All Files", icon: File },
  { value: "image" as const, label: "Images", icon: FileImage },
  { value: "video" as const, label: "Videos", icon: FileVideo },
  { value: "audio" as const, label: "Audio", icon: FileAudio },
  { value: "pdf" as const, label: "PDFs", icon: FileText },
  { value: "document" as const, label: "Documents", icon: FileText },
  { value: "other" as const, label: "Other", icon: File },
];

export function AttachmentFilter({ activeFilter, onFilterChange }: AttachmentFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = filterOptions.find((option) => option.value === activeFilter);
  const ActiveIcon = activeOption?.icon || File;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={activeFilter === "all" ? "ghost" : "secondary"} size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          {activeOption?.label}
          {activeFilter !== "all" && (
            <X
              className="hover:bg-muted h-3 w-3 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onFilterChange("all");
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-1">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={activeFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onFilterChange(option.value);
                  setIsOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
