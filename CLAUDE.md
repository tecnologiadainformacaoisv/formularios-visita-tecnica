# Formulários de Visita Técnica — ISV

> Arquivo de contexto para Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.

---

## Visão geral do projeto

PWA de fichas de visita técnica do **Instituto São Vicente (ISV)** para uso em campo pelos técnicos de saúde. Os formulários funcionam offline-first: os dados são salvos automaticamente no `localStorage` e enviados para o Google Apps Script quando há conexão.

**Objetivo:** digitalizar e centralizar as visitas técnicas às unidades de saúde (Hospital, Maternidade, UBS, UPA, SADT, CAPS, CER, Vigilância Epidemiológica) do estado, substituindo fichas em papel.

**Stack:** HTML/CSS/JS vanilla · Service Worker (PWA) · Google Apps Script (backend/planilhas) · GitHub Pages (hospedagem).

**Versão atual: v1.0.3**

---

## Ecossistema (ISV / Desenvolvimento)

Este projeto faz parte da pasta `Desenvolvimento/`, que reúne os sistemas do Instituto São Vicente (ISV).

- **Comandos e agentes:** `~/.claude/` — `/atualizar`, `/encerrar`, agente `revisor`
  (funcionam em qualquer projeto, independente da pasta aberta).
- **Assets/estilos/componentes comuns:** `../shared/`
- **Referência de comandos e versionamento:** `../COMANDOS-CLAUDE.md`

> **NÃO ler nem indexar as pastas dos outros projetos** (`projeto-*`, `pessoal-*`) a menos que explicitamente solicitado.

---

## Estrutura do projeto

```
projeto-formularios-visita-tecnica/
├── index.html                        ← Menu geral (tela inicial)
├── hospital/index.html               ← Formulário Hospital
├── maternidade/index.html            ← Formulário Maternidade
├── ubs/index.html                    ← Formulário UBS
├── upa/index.html                    ← Formulário UPA 24h
├── sadt/index.html                   ← Formulário SADT Domiciliar
├── caps/index.html                   ← Formulário CAPS
├── centro-reabilitacao/index.html    ← Formulário CER
├── vigilancia-epidemiologica/index.html ← Formulário Vigilância Epidemiológica
├── scripts/
│   ├── form-core.js                  ← Engine compartilhada (coleta, salva, envia, fila)
│   ├── appscript-config.js           ← Configuração centralizada da URL do Apps Script
│   └── sw.js                         ← Service Worker PWA
├── config/manifest.json              ← Manifest PWA global
├── assets/icons/                     ← Ícones PWA (72/192/512px)
├── shared/assets/                    ← Logo ISV e assets visuais compartilhados
├── appscript/                        ← Código do backend Google Apps Script
│   ├── apps_script_receptor.js       ← Receptor de envios
│   └── deploy.ps1                    ← Script de deploy via clasp
└── docs/                             ← Documentação do projeto
```

Cada formulário individual tem também `config/manifest.json` próprio.

---

## Arquitetura e fluxo de dados

### Engine compartilhada (`scripts/form-core.js`)

Todos os formulários (exceto Hospital e Maternidade, que têm fluxo próprio) usam a engine via `window.FORM_CONFIG`:

```js
window.FORM_CONFIG = {
  id: 'ubs',           // chave usada no localStorage
  tipo: 'ubs',
  title: 'UBS',
  version: '1.0.2'
};
```

A engine gerencia:
- **Auto-save** no `localStorage` a cada 1,2s de inatividade
- **Coleta de dados** do `#main-form` (radio, checkbox, text, select)
- **Fila offline** — itens ficam em `{id}_form_queue` até a conexão retornar
- **Envio** para Apps Script via `fetch` com `mode: 'no-cors'`
- **Labels** auto-extraídas do DOM para o campo `_labels` enviado junto

### Configuração da URL do Apps Script (`scripts/appscript-config.js`)

Expõe `window.APP_SCRIPT_CONFIG`. Prioridade de override:
1. Query string `?appscript=URL`
2. `localStorage` (`formularios-visita-tecnica-appscript-url`)
3. Default hardcoded no arquivo

Para trocar a URL em produção, editar `DEFAULT_URL` em `scripts/appscript-config.js`.
Para teste pontual: `window.APP_SCRIPT_CONFIG.setUrl('URL')` no console.

### Sincronização da tela inicial (`index.html`)

O menu lê as filas de todos os formulários e exibe badges de pendentes. Ao clicar em `#pending-summary`, `syncAllQueues()` dispara o envio de todos em sequência (intervalo de 800ms entre itens).

### PWA / Offline

- Service Worker registrado em `/formularios-visita-tecnica/scripts/sw.js`
- Scope: `/formularios-visita-tecnica/`
- Os formulários precisam ser abertos ao menos uma vez com internet para ficarem disponíveis offline

---

## Formulários ativos

| Formulário | Pasta | Observação |
|---|---|---|
| Hospital | `hospital/` | Fluxo próprio (não usa form-core) |
| Maternidade | `maternidade/` | Fluxo próprio (não usa form-core) |
| UBS | `ubs/` | Usa engine compartilhada |
| UPA 24h | `upa/` | Usa engine compartilhada |
| SADT Domiciliar | `sadt/` | Usa engine compartilhada |
| CAPS | `caps/` | Usa engine compartilhada |
| Centro de Reabilitação | `centro-reabilitacao/` | Usa engine compartilhada |
| Vigilância Epidemiológica | `vigilancia-epidemiologica/` | Usa engine compartilhada |

---

## Integração Google Apps Script

- Receptor em `appscript/apps_script_receptor.js`
- Deploy via `appscript/deploy.ps1` (usa `clasp`)
- Configuração detalhada em `docs/APPSCRIPT-INTEGRACAO.md`
- Dados chegam como `payload` JSON; o campo `_labels` contém mapeamento campo→rótulo legível

---

## Padrões de desenvolvimento

- **Zero dependências externas** — HTML/CSS/JS vanilla puro, sem frameworks, sem npm.
- **Touch-first** — todos os elementos interativos com `min-height: 48px`; sem `user-select: none` em campos de entrada.
- **CSS variables** para temas: `--navy`, `--accent`, `--green`, `--red`, `--orange`, etc.
- **Não alterar** a estrutura de `window.FORM_CONFIG` sem atualizar todos os formulários que usam a engine.
- **Não remover** o campo `_labels` do payload — o Apps Script depende dele para montar as planilhas com cabeçalhos legíveis.
- Versionamento: **Semantic Versioning** (`MAJOR.MINOR.PATCH`); `MAJOR` = 0 em pré-produção, 1+ em produção.
- Commits no padrão **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- A versão aparece em três lugares e deve ser mantida sincronizada: `index.html` (`meta name="app-version"` e rodapé), `config/manifest.json` e em cada `window.FORM_CONFIG.version`.

---

## Hospedagem

- GitHub Pages: `https://institutosaovicente.github.io/formularios-visita-tecnica/`
- Branch: `main` (deploy automático via GitHub Actions ou push direto)
- Não há build step — os arquivos HTML/JS/CSS são servidos diretamente.

---

## Contexto organizacional

- **Organização:** Instituto São Vicente (ISV)
- **Responsável de TI:** Henrique (TI — ISV)
- **Uso:** técnicos de saúde em visitas de campo (tablets/celulares, frequentemente sem internet)
- **Backend:** Google Sheets + Apps Script (sem banco de dados dedicado)
