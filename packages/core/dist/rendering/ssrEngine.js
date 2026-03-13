import { renderToPipeableStream } from 'react-dom/server';
export function streamSSR(element, res) {
    const stream = renderToPipeableStream(element, {
        onShellReady() {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            stream.pipe(res);
        },
        onError(error) {
            res.statusCode = 500;
            res.end(`<h1>SSR Error</h1><pre>${String(error)}</pre>`);
        }
    });
}
