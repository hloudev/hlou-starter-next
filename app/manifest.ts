import type { MetadataRoute } from "next";
import { webManifest } from "@/renderer";
import { getSnapshot } from "@/lib/snapshot";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return webManifest(getSnapshot());
}
