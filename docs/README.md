# Arquivos de origem e mapeamento dos formulários

## 1) Formulários web atualmente mantidos

Os roteiros `.docx` foram removidos do diretório raiz de [formularios-visita-tecnica](../). Os formulários ativos hoje ficam nas pastas abaixo:

- [hospital/index.html](../hospital/index.html)
- [maternidade/index.html](../maternidade/index.html)
- [ubs/index.html](../ubs/index.html)
- [upa/index.html](../upa/index.html)
- [sadt/index.html](../sadt/index.html)
- [caps/index.html](../caps/index.html)
- [centro-reabilitacao/index.html](../centro-reabilitacao/index.html)
- [vigilancia-epidemiologica/index.html](../vigilancia-epidemiologica/index.html)

## 2) Estrutura atual do projeto

- [index.html](../index.html) — menu geral dos formulários
- [hospital/index.html](../hospital/index.html) — formulário web do hospital
- [maternidade/index.html](../maternidade/index.html) — formulário web de maternidade
- [ubs/index.html](../ubs/index.html) — formulário web de UBS
- [upa/index.html](../upa/index.html) — formulário web de UPA
- [sadt/index.html](../sadt/index.html) — formulário web de SADT
- [caps/index.html](../caps/index.html) — formulário web de CAPS
- [centro-reabilitacao/index.html](../centro-reabilitacao/index.html) — formulário web de centro de reabilitação
- [vigilancia-epidemiologica/index.html](../vigilancia-epidemiologica/index.html) — formulário web de vigilância epidemiológica
- [assets](../assets) — ícones e recursos visuais
- [config](../config) — manifest PWA
- [scripts](../scripts) — service worker
- [docs](.) — documentação do projeto

## 3) Validação atual

- Hospital: sem erros de validação no editor após ajuste de compatibilidade CSS.
- Maternidade: sem erros de validação no editor após ajuste de compatibilidade CSS.
- O fluxo offline, envio automático, exportação CSV e registro em fila continuam no padrão já utilizado pelos formulários.

## 4) Observação

- O diretório raiz foi limpo para manter apenas os arquivos web e de configuração que ainda são necessários para uso e manutenção do projeto.

## 5) Próximo passo recomendado

1. Validar a consistência dos formulários já ativos e revisar o conteúdo específico de cada um.
2. Manter o [index.html](../index.html) alinhado com os formulários que continuam em uso.
3. Repetir a limpeza sempre que um roteiro antigo deixar de ser referência ou deixar de existir no projeto.