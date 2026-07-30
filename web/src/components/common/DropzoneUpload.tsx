import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  isUploading?: boolean;
  previewUrl?: string | null;
  label?: string;
  className?: string;
}

// Presentational only — the same signed-Cloudinary-upload flow
// (features/uploads/api.ts `uploadFile`) still handles the actual request;
// this just replaces a plain file-picker button with a drop target.
export function DropzoneUpload({
  onFileSelected,
  accept = "image/*",
  isUploading = false,
  previewUrl,
  label = "Drag an image here, or click to browse",
  className,
}: DropzoneUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        isDragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/50",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="max-h-24 rounded-md object-contain" />
      ) : isUploading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <ImageUp className="size-6 text-muted-foreground" />
      )}
      <p className="text-xs text-muted-foreground">{isUploading ? "Uploading…" : label}</p>
    </div>
  );
}
