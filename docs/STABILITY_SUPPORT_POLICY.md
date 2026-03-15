# Contrato de Estabilidade e Suporte

> Objetivo: permitir que empresas planejem upgrades do Nextify.js com previsibilidade, prazo de suporte explícito e baixo risco de quebra.

## 1) Política de compatibilidade

### 1.1 SemVer e nível de estabilidade

- O Nextify.js segue **SemVer rigoroso**.
- Versões `major` podem conter breaking changes.
- Versões `minor` e `patch` **não** podem quebrar APIs públicas documentadas.
- APIs experimentais devem ser marcadas com `experimental` e não possuem garantia de estabilidade até promoção para estável.

### 1.2 Superfícies cobertas por compatibilidade

A compatibilidade garantida pelo contrato cobre:

- API pública dos pacotes oficiais (`@nextify/core`, `@nextify/cli`, `@nextify/build`, `@nextify/dev-server`).
- Comandos CLI documentados e seus parâmetros estáveis.
- Formato de configuração documentado como estável.
- Integrações oficiais com Node.js e React nas versões suportadas.

Não cobre (sem aviso prévio obrigatório):

- APIs internas não exportadas.
- Recursos explicitamente marcados como `experimental`.
- Extensões de terceiros sem contrato oficial.

### 1.3 Baseline de plataforma

#### Node.js

- Suporte ativo apenas para versões **LTS em manutenção ativa**.
- Política inicial:
  - `Node 20.x LTS`: suportado.
  - `Node 22.x LTS`: suportado.
- Versões EOL do Node não recebem correções.

#### React

- Suporte às últimas duas major estáveis:
  - `React 18.x`: suportado.
  - `React 19.x`: suportado quando estável e validado.
- Mudanças de comportamento entre majors terão guia de migração em release notes.

#### Sistemas operacionais

- Linux x64 (Ubuntu LTS ou equivalente): suporte oficial.
- macOS (2 versões estáveis mais recentes): suporte oficial.
- Windows 10/11 (x64): suporte oficial para desenvolvimento e build.

#### Cloud e runtime

- Suporte oficial em ambientes Linux com Node LTS em:
  - AWS (EC2, ECS/Fargate, Lambda Node LTS)
  - Google Cloud (Cloud Run, GKE)
  - Azure (App Service Linux, Container Apps)
  - Vercel (Node runtime suportado)
- Ambientes fora dessa baseline são best-effort.

## 2) Canal LTS e janela de suporte

## 2.1 Canais de release

- `canary`: validação antecipada, sem SLA de suporte.
- `latest`: estável para adoção geral.
- `lts`: linha recomendada para produção enterprise.

### 2.2 Regra de promoção para LTS

Uma major só recebe tag `lts` quando cumprir:

1. mínimo de 90 dias em `latest` sem regressões críticas abertas;
2. documentação de migração consolidada;
3. estabilidade de ecossistema validada em referência e smoke E2E.

### 2.3 Janela de suporte por linha

- Cada linha LTS terá suporte por **18 meses** a partir da data de início.
- Durante a janela LTS:
  - correções de segurança: obrigatórias;
  - correções críticas de produção: prioritárias;
  - backport de features: somente em casos excepcionais.
- Após o término da janela, a linha entra em `EOL`.

### 2.4 Janela mínima de aviso para mudanças breaking

- Toda mudança breaking anunciada com pelo menos **1 release minor de antecedência** (quando tecnicamente viável).
- Deprecações devem incluir:
  - aviso em changelog;
  - alternativa recomendada;
  - prazo de remoção.

## 3) Matriz de suporte por versão

> Atualizar esta matriz a cada release major e no início/fim de uma linha LTS.

| Linha Nextify.js | Canal atual | Status | Node.js | React | Suporte de correções | Segurança | Data de EOL |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.x | `lts` | Ativa | 20.x, 22.x | 18.x, 19.x* | Sim | Sim | 2027-06-30 |
| 2.x | `latest` | Ativa | 22.x | 19.x | Sim | Sim | A definir |
| canary | `canary` | Experimental | Node LTS atual | React estável atual | Não (best-effort) | Não (best-effort) | N/A |

\* React 19 condicionado à validação de estabilidade na matriz de testes oficial.

## 4) Compromisso operacional para empresas

- Não introduzir quebra silenciosa em `minor`/`patch`.
- Publicar plano de migração para cada major.
- Manter calendário de EOL visível com pelo menos 6 meses de antecedência.
- Publicar changelog com classificação explícita: `breaking`, `deprecation`, `fix`, `security`.

## 5) Governança de atualização da política

- Responsáveis: mantenedores de release + owners técnicos dos pacotes core.
- Revisão obrigatória:
  - em toda release major;
  - semestralmente para revalidar baseline de Node/React/OS/Cloud.
- Mudanças nesta política devem ser registradas em `CHANGELOG.md` na seção de documentação/governança.
