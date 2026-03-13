export type NextifyMiddleware = (req: Request, next: () => Promise<Response>) => Promise<Response>;
export declare function composeMiddleware(middlewares: NextifyMiddleware[]): (req: Request, terminal: () => Promise<Response>) => Promise<Response>;
