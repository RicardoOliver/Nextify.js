# Análise de lacunas de desenvolvimento — Nextify.js (2026-04-23)

## Resumo executivo

O projeto já tem uma base sólida (monorepo, testes passando e componentes centrais de runtime), mas ainda há lacunas importantes para adoção real em produção. Os maiores gaps estão na **cadeia CLI build/start**, em **consistência de versão/comunicação**, e em capacidades de **escala enterprise** (cache distribuído, observabilidade plugável e matriz de deploy mais ampla).

## O que já está maduro

- Suite de testes de workspaces executando com sucesso (`build`, `cli`, `core` e adapters), com cobertura funcional relevante no core.
- Roteamento com suporte a `app/`, segmentos dinâmicos e route groups no parser de rotas.
- Pipeline de build em `packages/build` já possui grafo de dependências, cache incremental e relatório de performance budget.

## O que ainda falta desenvolver (priorizado)

### P0 — Bloqueadores de adoção em produção

1. **Unificar CLI com pipeline real de build**
   - Hoje o comando `nextify build` (CLI) gera apenas `dist/route-manifest.json` com payload mínimo (`note` + `generatedAt`).
   - Falta integrar a CLI ao builder real em `packages/build` para produzir artefatos de aplicação com metadados por rota e evidências de budget.

2. **Implementar `nextify start` real (servir artefato produzido)**
   - O `start` atual responde texto estático (`Nextify production server ativo 🚀`) e não executa render/runtime de rotas.
   - Falta servidor de produção que leia output de build e faça roteamento/renderização efetiva.

3. **Corrigir inconsistência de versão pública**
   - README declara estado atual em `v0.2.4`, enquanto o pacote raiz do monorepo está em `0.1.26`.
   - Falta política única de versionamento/release para evitar ruído em comunicação e automações.

4. **Scaffold inicial mais completo (`create-nextify`)**
   - O `create` já gera `package.json`, `pages/index.tsx` e endpoint de health, porém não gera `tsconfig`, `vite.config` e `.gitignore`.
   - Falta fluxo de bootstrap com opção de instalar dependências automaticamente e validação pós-criação.

### P1 — Paridade de plataforma e escala

5. **Cache distribuído para invalidação por tags**
   - O `TaggedCache` atual é em memória (`Map`) e não compartilha estado entre instâncias.
   - Falta provider oficial (Redis/KV) com contrato de invalidação cross-instance.

6. **Semântica consistente dev/prod para rendering/dados**
   - O dev server usa Vite middleware e shell dinâmico; produção ainda não reproduz a mesma execução de rotas.
   - Falta alinhar comportamento SSR/SSG/ISR entre ambientes para previsibilidade operacional.

7. **Expandir matriz de adapters oficiais**
   - Existem adapters para AWS Lambda, Cloudflare Workers e Vercel Edge.
   - Roadmap público também menciona Fly.io/self-hosted como alvo de ecossistema; falta adapter oficial equivalente.

### P2 — DX, governança e enterprise readiness

8. **Observabilidade nativa com exportadores prontos**
   - O `TelemetryHub` atual é in-memory (logs/métricas/spans) e útil como base.
   - Falta pacote de integração padrão com backend observável (OTel collector, vendors) e guias de operação.

9. **Toolkit de migração mais profundo (codemods robustos)**
   - Existe pré-check (`nextify check`) e migração assistida (`nextify migrate`) com estratégia progressiva.
   - Falta cobertura mais ampla para casos reais de App Router, middlewares complexos e relatórios de compatibilidade mais granulares.

10. **Quality gates obrigatórios por release**
   - Há scripts de benchmark/health e testes, mas ainda não está consolidado um gate único obrigatório por rota/release no fluxo padrão da CLI.
   - Falta enforcement rígido (falha de release) para regressões críticas de performance e confiabilidade.

## Recomendação de execução (próximos 30 dias)

1. **Semana 1:** conectar `nextify build` à pipeline de `packages/build` e publicar manifesto de rotas v1.
2. **Semana 2:** entregar `nextify start` funcional lendo build output e servindo rotas reais.
3. **Semana 3:** ajustar versionamento/documentação/release tags em um único fluxo.
4. **Semana 4:** lançar scaffold reforçado (`--install`, configs base) + RFC de cache distribuído.

## Critérios de sucesso sugeridos

- `nextify build && nextify start` subir app real do diretório `dist` sem comportamento placeholder.
- Manifesto de rotas conter, no mínimo, `routePath`, `kind`, `runtime`, `chunk`, `dataDeps`.
- `create-nextify` gerar projeto executável sem intervenção manual extra além de `npm install` (ou já com install automático opcional).
- Versão exibida em README, pacote raiz e pacotes publicados sem divergência.
