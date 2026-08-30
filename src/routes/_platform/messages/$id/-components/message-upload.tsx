import { ImagePlus, Paperclip, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState, DragEvent } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import useBackend from "#/lib/backend/client";
import { Attachment } from "#/lib/backend/connectors/messages";

interface MessageUploadProps {
  onUpload: (attachment: Attachment) => void;
  variant?: "image" | "file";
  enableDragDrop?: boolean;
}

export function MessageUpload({ onUpload, variant = "file", enableDragDrop = false }: MessageUploadProps) {
  const backend = useBackend();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    // File size validation (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 50MB.");
      return;
    }

    // Determine file type category with enhanced detection
    const getFileTypeCategory = (mimeType: string, fileName: string): string => {
      const ext = fileName.toLowerCase().split(".").pop() || "";

      // Images
      if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
        return "image";
      }

      // Videos
      if (mimeType.startsWith("video/") || ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv", "mkv"].includes(ext)) {
        return "video";
      }

      // Audio
      if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"].includes(ext)) {
        return "audio";
      }

      // PDFs
      if (mimeType.includes("pdf") || ext === "pdf") {
        return "pdf";
      }

      // Documents
      if (mimeType.includes("document") || mimeType.includes("word") || ["doc", "docx", "odt", "rtf"].includes(ext)) {
        return "document";
      }

      // Spreadsheets
      if (
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel") ||
        ["xls", "xlsx", "ods", "csv"].includes(ext)
      ) {
        return "spreadsheet";
      }

      // Presentations
      if (
        mimeType.includes("presentation") ||
        mimeType.includes("powerpoint") ||
        ["ppt", "pptx", "odp"].includes(ext)
      ) {
        return "presentation";
      }

      // Archives
      if (
        mimeType.includes("zip") ||
        mimeType.includes("rar") ||
        mimeType.includes("archive") ||
        ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)
      ) {
        return "archive";
      }

      // Text files
      if (mimeType.includes("text") || ["txt", "md", "json", "xml", "yml", "yaml", "ini", "cfg"].includes(ext)) {
        return "text";
      }

      return "file";
    };

    // Show loading toast
    const loadingToast = toast.loading("Uploading file…");

    backend.assets
      .uploadFile(file)
      .then((asset) => {
        const attachment: Attachment = {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          fileType: getFileTypeCategory(asset.type, asset.name),
          size: asset.size,
        };
        onUpload(attachment);
        toast.dismiss(loadingToast);
        toast.success("File uploaded successfully!");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.dismiss(loadingToast);
        toast.error(error.message);
      })
      .finally(() => {
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (enableDragDrop) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (enableDragDrop) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!enableDragDrop) return;

    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const acceptTypes = variant === "image" ? "image/*" : "*";
  const Icon = variant === "image" ? ImagePlus : Paperclip;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (enableDragDrop) {
    return (
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} className="hidden" type="file" accept={acceptTypes} onChange={handleFileUpload} />
        <div className="mx-auto flex max-w-[240px] flex-col items-center justify-center text-center">
          <Upload className={`mx-auto h-10 w-10 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
          <h3 className="text-foreground mt-2 text-sm font-medium">{isDragOver ? "Drop file here" : "Upload file"}</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {isDragOver
              ? "Release to upload"
              : variant === "image"
                ? "Drag and drop an image, or click to browse"
                : "Drag and drop a file, or click to browse"}
          </p>
          <Button type="button" variant="ghost" className="mt-2" onClick={handleClick}>
            Choose file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <input ref={fileInputRef} className="hidden" type="file" accept={acceptTypes} onChange={handleFileUpload} />
      <Button aria-label="Attach File" type="button" variant="ghost" size="icon" onClick={handleClick}>
        <Icon className="h-4 w-4" />
      </Button>
    </>
  );
}
