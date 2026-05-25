# Arquivos de origem e mapeamento dos formulários

## 1) Arquivos usados como base para os formulários

Os documentos abaixo estão no diretório raiz de [formularios-visita-tecnica](../):

- ROTEIRO DE VISITA TÉCNICA HOSPITAL - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA MATERNIDADE - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA UBS - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA UPA - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA SADT - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA CAPS - Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA CENTRO DE REABILITAÇÃO -Atualizado.docx
- ROTEIRO DE VISITA TÉCNICA VIG. EPIDEMIOLÓGICA - Atualizado.docx

> Observação: não há um export do Google Forms salvo no workspace. Os arquivos `.docx` acima são os documentos de origem que usei como referência para montar os formulários.

## 2) Formulários web já convertidos

| Documento de origem | Formulário web | Status |
| --- | --- | --- |
| ROTEIRO DE VISITA TÉCNICA HOSPITAL - Atualizado.docx | [hospital/index.html](../hospital/index.html) | Pronto para uso e validado |
| ROTEIRO DE VISITA TÉCNICA MATERNIDADE - Atualizado.docx | [maternidade/index.html](../maternidade/index.html) | Pronto para uso e validado |

## 3) Estrutura atual do projeto

- [index.html](../index.html) — menu geral dos formulários
- [hospital/index.html](../hospital/index.html) — formulário web do hospital
- [maternidade/index.html](../maternidade/index.html) — formulário web de maternidade
- [assets](../assets) — ícones e recursos visuais
- [config](../config) — manifest PWA
- [scripts](../scripts) — service worker
- [docs](.) — documentação do projeto

## 4) Validação atual

- Hospital: sem erros de validação no editor após ajuste de compatibilidade CSS.
- Maternidade: sem erros de validação no editor após ajuste de compatibilidade CSS.
- O fluxo offline, envio automático, exportação CSV e registro em fila continuam no padrão já utilizado pelos dois formulários.

## 5) Próximo passo recomendado

1. Confirmar se o formulário de maternidade deve ser tratado como "municipal" ou se você quer um segundo formulário com nome diferente.
2. Converter os demais roteiros (`UBS`, `UPA`, `SADT`, `CAPS`, `Centro de Reabilitação` e `Vigilância Epidemiológica`) usando o mesmo padrão dos formulários já validados.
3. Atualizar o [index.html](../index.html) com os novos cards assim que os novos formulários ficarem prontos.