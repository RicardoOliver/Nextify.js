export function composeMiddleware(middlewares) {
    return async function run(req, terminal) {
        let index = -1;
        async function dispatch(i) {
            if (i <= index)
                throw new Error('next() chamado múltiplas vezes');
            index = i;
            const middleware = middlewares[i];
            if (!middleware)
                return terminal();
            return middleware(req, () => dispatch(i + 1));
        }
        return dispatch(0);
    };
}
