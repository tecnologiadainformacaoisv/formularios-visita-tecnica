# Formulários de Visita Técnica — ISV

PWA de **fichas de visita técnica** do **Instituto São Vicente (ISV)** para uso em campo pelos técnicos de saúde. Os formulários são **offline-first**: salvam automaticamente no `localStorage` e enviam para o Google Apps Script quando há conexão.

Cobre 8 tipos de unidade: Hospital, Maternidade, UBS, UPA 24h, SADT Domiciliar, CAPS, Centro de Reabilitação e Vigilância Epidemiológica.

**Stack:** HTML/CSS/JS vanilla · Service Worker (PWA) · Google Apps Script (backend) · GitHub Pages.

## Estrutura

```
projeto-formularios-visita-tecnica/
├── README.md / CLAUDE.md
├── index.html                  ← menu geral (tela inicial)
├── <unidade>/index.html        ← um formulário por tipo de unidade
│   └── config/manifest.json    ← manifest PWA por formulário
├── scripts/
│   ├── form-core.js            ← engine compartilhada (coleta, salva, fila, envio)
│   ├── appscript-config.js     ← configuração da URL do Apps Script
│   └── sw.js                   ← Service Worker (escopo /formularios-visita-tecnica/)
├── config/manifest.json        ← manifest PWA global
├── assets/icons/               ← ícones PWA (72/192/512px)
├── shared/                     ← logo ISV + estilos base (instituto.css)
├── appscript/                  ← backend Google Apps Script (deploy via deploy.ps1)
└── docs/                       ← documentação (integração Apps Script, mapeamento)
```

> Os entrypoints, `scripts/sw.js` e os manifests dependem do path `/formularios-visita-tecnica/`
> (escopo do Service Worker e GitHub Pages) — não devem ser renomeados sem ajustar os registros.

## Desenvolvimento

Sem build step — arquivos servidos diretamente. Hospedagem: GitHub Pages em
`https://institutosaovicente.github.io/formularios-visita-tecnica/`.

- **Engine de formulário:** `scripts/form-core.js` via `window.FORM_CONFIG` (todos exceto Hospital e Maternidade, que têm fluxo próprio).
- **Backend:** editar `appscript/apps_script_receptor.js` e publicar com `appscript/deploy.ps1` (clasp). Detalhes em [docs/APPSCRIPT-INTEGRACAO.md](docs/APPSCRIPT-INTEGRACAO.md).

## Versionamento

[Semantic Versioning](https://semver.org/lang/pt-BR/) — `MAJOR=1` em produção. A versão deve ser mantida sincronizada em: `<meta name="app-version">` e rodapé do `index.html`, `config/manifest.json` e `APP_VERSION` do `scripts/sw.js`. Bumpar o SW força a atualização do cache nos dispositivos.
