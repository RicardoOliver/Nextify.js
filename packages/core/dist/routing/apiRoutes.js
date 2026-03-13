const apiRegistry = new Map();
export function registerApiRoute(pathname, handler) {
    apiRegistry.set(pathname, handler);
}
export async function resolveApiRoute(request) {
    const url = new URL(request.url);
    const handler = apiRegistry.get(url.pathname);
    if (!handler)
        return null;
    return handler(request);
}
