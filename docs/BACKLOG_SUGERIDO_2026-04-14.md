# Backlog sugerido (análise técnica) — 2026-04-14

Este documento consolida itens práticos para alimentar o board de backlog do Nextify.js com base no estado atual do código e da documentação.

## P0 — Críticos para confiabilidade e adoção

1. **Scaffold com setup completo e instalação opcional automática**
   - **Problema:** `create-nextify` gera `package.json` com `vite` e `@vitejs/plugin-react`, mas não executa instalação nem gera arquivos de configuração essenciais (`tsconfig`, `vite.config`, `.gitignore`).
   - **Valor:** reduz fricção no onboarding e evita falhas logo após `create`.
   - **Sugestão de entrega:** adicionar flags `--install` e `--no-install` (default inteligente), geração de configs mínimas e validação pós-scaffold.

2. **Corrigir inconsistência de versão pública**
   - **Problema:** README comunica estado em `v0.2.4`, enquanto o `package.json` raiz está em `0.1.26`.
   - **Valor:** evita ruído para usuários e para releases.
   - **Sugestão de entrega:** alinhar versão declarada em docs, tags e pacote raiz com um processo único de versionamento.

3. **Build real com manifesto de rotas completo**
   - **Problema:** o comando de build da CLI grava apenas um manifesto mínimo com nota e timestamp.
   - **Valor:** destrava integração de deploy, observabilidade e validação de regressão.
   - **Sugestão de entrega:** incluir no manifesto metadados por rota (tipo, chunk, estratégia de render, data dependencies).

4. **Servidor de produção funcional (não-placeholder)**
   - **Problema:** `nextify start` responde texto fixo em vez de servir artefatos/renderizar rotas.
   - **Valor:** fundamental para testes de produção e adoção em ambientes reais.
   - **Sugestão de entrega:** implementar servidor HTTP com leitura de build output e pipeline de render por rota.

## P1 — Paridade de plataforma

5. **Roteamento avançado (layouts aninhados, boundaries, route groups)**
   - **Base técnica:** já está listado como gap de alta prioridade na análise de paridade.
   - **Valor:** aproxima o framework do padrão esperado por times que usam App Router moderno.

6. **Semântica unificada de SSR/SSG/ISR entre dev e prod**
   - **Base técnica:** docs de gap indicam paridade parcial.
   - **Valor:** reduz bugs de ambiente e melhora previsibilidade de deploy.

7. **Revalidação distribuída (Redis/KV) para cache por tags**
   - **Base técnica:** roadmap fala em cache distribuído na fase de escala.
   - **Valor:** habilita multi-instância sem inconsistência de cache.

8. **Adapter oficial Fly.io + matriz de deploy padronizada**
   - **Base técnica:** roadmap cita Fly.io, mas pacote oficial ainda não existe no monorepo.
   - **Valor:** aumenta portabilidade e reduz lock-in de runtime.

## P2 — DX, governança e crescimento

9. **Toolkit de migração Next.js → Nextify (codemods + checker + relatório)**
   - **Base técnica:** roadmap e gap analysis tratam como peça-chave, mas ainda inicial.
   - **Valor:** acelera aquisição de usuários já em produção com Next.js.

10. **Quality gates obrigatórios para release (CI + budgets por rota)**
    - **Base técnica:** objetivo estratégico já documentado, mas precisa enforcement automático.
    - **Valor:** evita regressão silenciosa em performance e confiabilidade.

11. **Observabilidade nativa por padrão (logs/traces/erro por rota)**
    - **Base técnica:** pilar aparece no roadmap, ainda parcial no estado atual.
    - **Valor:** encurta MTTR e melhora operação em produção.

12. **Backlog de produto com critérios de aceite mensuráveis**
    - **Problema operacional:** board atual possui poucos itens e sem estimativa relevante.
    - **Valor:** melhora priorização (impacto x esforço) e cadência do time.
    - **Sugestão de entrega:** padrão mínimo por card: problema, hipótese de valor, critérios de aceite, métrica de sucesso, owner, estimativa.

## Sugestão de cards para criação imediata no board

- `[P0] Scaffold: adicionar --install e geração de configs base (tsconfig/vite)`
- `[P0] CLI build: gerar route-manifest completo por rota`
- `[P0] nextify start: servir app produzido pelo build`
- `[P0] Alinhar versão oficial (README, package, release tags)`
- `[P1] Routing v1: nested layouts + error/loading boundaries + route groups`
- `[P1] Cache distribuído v1: provider Redis/KV para invalidação por tags`
- `[P1] Adapter Fly.io oficial`
- `[P2] Migration toolkit v1: checker + codemods + relatório`
- `[P2] CI gate: performance budget por rota com fail em regressão`
- `[P2] Template de issue/backlog com critérios de aceite obrigatórios`

