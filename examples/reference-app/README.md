# Nextify Reference App

Projeto de referência para validar fluxo ponta-a-ponta com os recursos centrais:

- SSR streaming na rota `/`
- API routes (`/api/health`, `/api/catalog`, `/api/revalidate`)
- Middleware com security headers globais
- Data runtime com cache tags + invalidação por tag

## Executar localmente

```bash
npm run example:reference
```

A aplicação sobe em `http://127.0.0.1:4010` por padrão.
