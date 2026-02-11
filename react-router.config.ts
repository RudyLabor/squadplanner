import type { Config } from "@react-router/dev/config";

// RSC Framework Mode — prerender and presets are not yet supported.
// CDN caching via vercel.json compensates for the lost pre-rendering.
export default {
  appDirectory: "src",
  ssr: true,
} satisfies Config;
