export type ApiHandler = (req: Request) => Promise<Response> | Response;
export declare function registerApiRoute(pathname: string, handler: ApiHandler): void;
export declare function resolveApiRoute(request: Request): Promise<Response | null>;
