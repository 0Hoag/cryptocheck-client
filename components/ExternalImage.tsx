"use client";

import { type ImgHTMLAttributes, useState } from "react";
import { safeExternalImageURL } from "@/lib/external-image";

type ExternalImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallback?: React.ReactNode;
};

export default function ExternalImage({ src, fallback = null, onError, alt = "", ...props }: ExternalImageProps) {
  const safeSource = safeExternalImageURL(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === safeSource;

  if (!safeSource || failed) return <>{fallback}</>;

  // Dynamic provider/user image hosts cannot safely use Next's optimizer until
  // a server-side allowlist/proxy is introduced. Keep this browser-only, HTTPS
  // checked and referrer-free rather than turning untrusted input into SSRF.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} src={safeSource} alt={alt} referrerPolicy="no-referrer" onError={(event) => { setFailedSource(safeSource); onError?.(event); }} />;
}
