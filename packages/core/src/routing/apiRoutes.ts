export type ApiHandler = (req: Request) => Promise<Response> | Response;

const apiRegistry = new Map<string, ApiHandler>();

export function registerApiRoute(pathname: string, handler: ApiHandler) {
  apiRegistry.set(pathname, handler);
}

export async function resolveApiRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const handler = apiRegistry.get(url.pathname);
  if (!handler) return null;
  return handler(request);
}
