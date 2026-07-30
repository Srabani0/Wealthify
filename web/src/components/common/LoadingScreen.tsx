import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <BrandMark variant="logo" className="h-7 w-auto" />
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
