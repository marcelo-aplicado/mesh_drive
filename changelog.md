# Changelog

## 0.6.6
- Substituída a execução do agente de `child_process.exec()` para `child_process.execFile()`, seguindo o padrão funcional do plugin ScriptTask.
- Corrigido erro `undefined not callable (property 'exec' of [object Object])` no agente.
- Windows agora executa `cmd.exe` e envia comandos via `stdin`, semelhante ao padrão do ScriptTask.
- Linux/macOS agora executam `/bin/sh` via `execFile()` e enviam comandos via `stdin`.
- Mantidos logs de debug em `serveraction()` e envio de status do agente.

## 0.6.5
- Adicionado log explícito no início de `obj.serveraction()` para confirmar se o evento do navegador chega ao servidor.
- Adicionado retorno visual no console do navegador antes de `meshserver.send()` com o payload completo.
- Mantida correção do módulo do agente com `module.exports = { consoleaction : consoleaction };`.

## 0.6.4
- Corrigido o módulo do agente com `module.exports = { consoleaction : consoleaction };`.
