#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n[bootstrap-dev] %s\n' "$1"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

ensure_node() {
  if ! has_cmd node || ! has_cmd npm; then
    echo "Node.js e npm são obrigatórios."
    exit 1
  fi

  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$major" -lt 18 ]; then
    echo "Node >= 18 é obrigatório. Versão atual: $(node -v)"
    exit 1
  fi
}

install_workspace_if_missing() {
  local workspace="$1"
  local pkg="$2"

  if npm --workspace "$workspace" ls "$pkg" --depth=0 >/dev/null 2>&1; then
    log "Dependência já presente em $workspace: $pkg"
  else
    log "Instalando em $workspace: $pkg"
    npm --workspace "$workspace" install "$pkg" --no-audit --no-fund
  fi
}

install_root_dev_if_missing() {
  local pkg="$1"

  if npm ls "$pkg" --depth=0 >/dev/null 2>&1; then
    log "Dependência de dev já presente na raiz: $pkg"
  else
    log "Instalando dependência de dev na raiz: $pkg"
    npm install -D "$pkg" --no-audit --no-fund
  fi
}

main() {
  log "Validando Node e npm"
  ensure_node

  log "Instalando dependências do monorepo"
  npm install --no-audit --no-fund

  install_workspace_if_missing "@nextify/dev-server" "vite"
  install_workspace_if_missing "@nextify/dev-server" "@vitejs/plugin-react"

  install_root_dev_if_missing "vitest"
  install_root_dev_if_missing "@vitest/coverage-v8"

  log "Executando testes rápidos (best effort)"
  npm run --workspaces --if-present test || true

  log "Iniciando ambiente de desenvolvimento"
  npm run dev
}

main "$@"
