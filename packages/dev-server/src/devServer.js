import http from 'node:http';

const port = process.env.PORT || 3000;

const server = http.createServer((_req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end('Nextify dev server ativo com hot reload via Vite (integração planejada).');
});

server.listen(port, () => {
  console.log(`Nextify dev server em http://localhost:${port}`);
});
