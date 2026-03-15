# Nextify Reference App

Projeto de referência para validar fluxo ponta-a-ponta com os recursos centrais:

- SSR streaming na rota `/`
- API routes (`/api/health`, `/api/catalog`, `/api/revalidate`)
- Middleware com security headers globais
- Data runtime com cache tags + invalidação por tag
- Observabilidade mínima para runtime
  - logs estruturados JSON com correlação por `x-request-id`
  - métricas por rota (`latência`, `erro`, `throughput`) em `/api/metrics`

## Executar localmente

```bash
npm run example:reference
```

A aplicação sobe em `http://127.0.0.1:4010` por padrão.

## Endpoints de observabilidade

- `GET /api/metrics`: snapshot de métricas agregadas por rota.
- `GET /api/fail?reason=<motivo>`: simula erro de runtime para validação operacional.

## Fluxo de troubleshooting (falhas comuns)

1. **Reproduza o erro**

```bash
curl -i "http://127.0.0.1:4010/api/fail?reason=database-timeout"
```

Resultado esperado: `HTTP/1.1 500` com `requestId` no corpo e header `x-request-id`.

2. **Correlacione no log estruturado**

Busque no terminal do servidor por eventos `request.failed` com o mesmo `requestId` retornado pela API.

Campos úteis para análise rápida:
- `route`
- `errorName`
- `errorMessage`
- `durationMs`

3. **Valide impacto em métricas**

```bash
curl -s http://127.0.0.1:4010/api/metrics
```

Confirme se a rota (`/api/fail`) aumentou:
- `errors`
- `errorRate`
- bucket de latência compatível com o tempo da falha

4. **Falha comum: request-id ausente**

- Causa típica: proxy removendo `x-request-id`.
- Mitigação: o runtime gera UUID automaticamente quando o header não existe.

5. **Falha comum: explosão de erro 5xx**

- Verifique `statusCounts` e `errorRate` em `/api/metrics` para rotas com regressão.
- Priorize a rota com maior erro relativo e use os `requestId`s recentes para investigar logs.
