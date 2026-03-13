export type NextifyMiddleware = (
  req: Request,
  next: () => Promise<Response>
) => Promise<Response>;

export function composeMiddleware(middlewares: NextifyMiddleware[]) {
  return async function run(req: Request, terminal: () => Promise<Response>) {
    let index = -1;

    async function dispatch(i: number): Promise<Response> {
      if (i <= index) throw new Error('next() chamado múltiplas vezes');
      index = i;

      const middleware = middlewares[i];
      if (!middleware) return terminal();

      return middleware(req, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}
