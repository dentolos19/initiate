"use client";

import {
  Archive,
  Download,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Presentation,
  AlertCircle,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import Image from "#/components/ui/wrappers/image";
import { Attachment } from "#/lib/backend/connectors/messages";
import Link from "#/lib/router";

interface MessageAttachmentProps {
  attachment: Attachment;
}

export function MessageAttachment({ attachment }: MessageAttachmentProps) {
  const { fileType, name, type, size, id } = attachment;
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/assets/" + id;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Image - just the image, no background
  if (fileType === "image") {
    if (imageError) {
      return (
        <div className="text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load image: {name}</span>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="group relative cursor-pointer" onClick={() => setShowLightbox(true)}>
          <Image
            src={`/assets/${id}`}
            alt={name}
            width={300}
            height={200}
            className="rounded-lg object-cover transition-opacity group-hover:opacity-90"
            unoptimized
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />
        </div>

        {/* Lightbox */}
        {showLightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLightbox(false)}
          >
            <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setShowLightbox(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Image
                src={`/assets/${id}`}
                alt={name}
                width={1200}
                height={800}
                className="max-h-full max-w-full rounded-lg object-contain"
                unoptimized
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Video - just the video player, no background
  if (fileType === "video") {
    return (
      <video
        controls
        className="max-w-md rounded-lg"
        preload="metadata"
        onError={() => console.warn(`Video failed to load: ${name}`)}
      >
        <source src={`/assets/${id}`} type={type} />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Audio - rounded audio player (50% border radius)
  if (fileType === "audio") {
    return (
      <audio
        controls
        className="w-80"
        style={{ borderRadius: "50px" }}
        preload="metadata"
        onError={() => console.warn(`Audio failed to load: ${name}`)}
      >
        <source src={`/assets/${id}`} type={type} />
        Your browser does not support the audio tag.
      </audio>
    );
  }

  // For all other files - minimal display
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return FileText;
      case "document":
        return FileText;
      case "spreadsheet":
        return FileSpreadsheet;
      case "presentation":
        return Presentation;
      case "archive":
        return Archive;
      case "text":
        return FileText;
      default:
        return File;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return "text-red-500";
      case "document":
        return "text-blue-500";
      case "spreadsheet":
        return "text-green-500";
      case "presentation":
        return "text-orange-500";
      case "archive":
        return "text-purple-500";
      case "text":
        return "text-gray-500";
      default:
        return "text-muted-foreground";
    }
  };

  const FileIcon = getFileIcon(fileType || "file");

  return (
    <div className="flex items-center gap-3">
      <FileIcon className={`h-8 w-8 ${getFileTypeColor(fileType || "file")}`} />
      <span className="text-sm font-medium">{name}</span>
      <div className="flex gap-1">
        {fileType === "pdf" && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/assets/${id}`} target="_blank">
              View
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
