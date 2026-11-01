import Script from "next/script";
import { analyticsTags } from "@/renderer";
import { siteEnv } from "@/lib/site";

/**
 * The renderer's analytics tags (`analyticsTags`) as `next/script`, loaded
 * after hydration. Nothing at all when the build configured no counter.
 */
export function Analytics() {
  const tags = analyticsTags(siteEnv);
  if (tags.length === 0) return null;
  return (
    <>
      {tags.map((tag) =>
        tag.tag === "script" ? (
          <Script
            key={tag.attrs.src}
            {...tag.attrs}
            defer
            strategy="afterInteractive"
          />
        ) : null,
      )}
    </>
  );
}
