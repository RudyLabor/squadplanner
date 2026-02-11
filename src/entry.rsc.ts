"use server";

import defaultEntry from "@react-router/dev/config/default-rsc-entries/entry.rsc";
import { RouterContextProvider } from "react-router";

// Vercel Edge skew protection — keeps users on the same deployment version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (globalThis as any).process?.env ?? {};
const vercelDeploymentId: string | undefined = env.VERCEL_DEPLOYMENT_ID;
const vercelSkewProtection = env.VERCEL_SKEW_PROTECTION_ENABLED === "1";

export default {
  async fetch(request: Request): Promise<Response> {
    const requestContext = new RouterContextProvider();
    const response = await defaultEntry.fetch(request, requestContext);

    // Vercel Skew Protection — pin users to the same deployment version
    if (vercelSkewProtection && vercelDeploymentId) {
      response.headers.append(
        "Set-Cookie",
        `__vdpl=${vercelDeploymentId}; HttpOnly`
      );
    }

    return response;
  },
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
