# Integração com Google Apps Script

## O que foi configurado

- O endpoint agora é centralizado em [scripts/appscript-config.js](../scripts/appscript-config.js)
- Os formulários novos passam a ler essa configuração antes de inicializar o envio
- Hospital e Maternidade também usam a mesma origem de URL

## Como mudar a URL

### 1. Alteração fixa no código

Edite o valor em [scripts/appscript-config.js](../scripts/appscript-config.js).

### 2. Override temporário para teste

Use a query string na URL do formulário:

- `?appscript=https://script.google.com/macros/s/SEU_ID/exec`

Exemplo:

- `http://localhost:8000/formularios-visita-tecnica/hospital/?appscript=https://script.google.com/macros/s/SEU_ID/exec`

### 3. Override persistente no navegador

No console do navegador, rode:

```js
window.APP_SCRIPT_CONFIG.setUrl('https://script.google.com/macros/s/SEU_ID/exec');
```

Isso salva a URL em `localStorage` e mantém o uso no próximo carregamento.

## Como validar após o commit

1. Abra o formulário no tablet.
2. Preencha um envio mínimo.
3. Confirme se o botão de envio fica em estado de sucesso.
4. Se não houver internet, confirme que o envio entra na fila offline.
5. Reabra o app e teste novamente com a conexão retornando.

## Observações

- Os formulários novos usam o engine compartilhado.
- Hospital e Maternidade continuam com o fluxo próprio, mas agora também usam o mesmo ponto de configuração.
- A URL padrão continua apontando para o endpoint atual até você trocar por outro.
