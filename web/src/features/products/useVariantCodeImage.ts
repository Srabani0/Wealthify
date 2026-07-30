import { useEffect, useState } from "react";
import * as productsApi from "./api";

// The barcode/QR endpoints require auth, so a plain <img src="..."> can't
// load them (no way to attach the Bearer header) — fetch as a blob through
// the authenticated axios client instead and hand the component an object
// URL, revoking it on cleanup to avoid leaking memory.
export function useVariantCodeImage(variantId: string | undefined, type: "barcode" | "qrcode") {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!variantId) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    const fetchBlob = type === "barcode" ? productsApi.getVariantBarcodeBlob : productsApi.getVariantQrCodeBlob;

    setIsLoading(true);
    fetchBlob(variantId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [variantId, type]);

  return { url, isLoading };
}
