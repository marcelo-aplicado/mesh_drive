# Changelog

## 0.6.5
- Adicionado log explícito no início de `obj.serveraction()` para confirmar se o evento do navegador chega ao servidor.
- Adicionado retorno visual no console do navegador antes de `meshserver.send()` com o payload completo.
- Mantida correção do módulo do agente com `module.exports = { consoleaction : consoleaction };`.
- Mantida a assinatura compatível com ScriptTask: `function consoleaction(args, rights, sessionid, parent)`.
- Mantidos os botões do dispositivo no cabeçalho, alinhados à direita.

## 0.6.4
- Corrigido o módulo do agente com `module.exports = { consoleaction : consoleaction };`.

## 0.6.3
- Corrigido `modules_meshcore/meshdrive.js` para usar `function consoleaction(...)`.
- Melhorada a injeção dos botões na barra de título do dispositivo.
