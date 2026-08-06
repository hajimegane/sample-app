/**
 * Worker entry point. Binds D1 and hands the store to the app.
 */
import { createApp, type Env } from "./index.tsx";
import { D1ApplicationStore } from "./db/applications.ts";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return createApp(new D1ApplicationStore(env.DB)).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
