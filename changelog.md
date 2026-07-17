# Changelog

## 0.6.7
- Corrigido `Mapear Drive` removendo PowerShell `-EncodedCommand` e `utf16le`.
- Windows agora usa somente `cmd.exe`, `net use` e `explorer.exe`.
- `Mapear Drive` tenta letras de `M:` até `Z:` usando CMD puro.
- `Abrir Drive` agora usa `explorer.exe "\\mesh.aplicado.com.br@SSL\drive"` em vez de `start`.
- Adicionado status `info` do agente com plataforma e comando executado, para depuração.

## 0.6.6
- Substituída a execução do agente de `child_process.exec()` para `child_process.execFile()`.
- Corrigido erro `undefined not callable (property 'exec' of [object Object])`.

## 0.6.5
- Adicionado log explícito no início de `obj.serveraction()`.

## 0.6.4
- Corrigido o módulo do agente com `module.exports = { consoleaction : consoleaction };`.
