# Changelog

## 0.6.4
- Corrigido definitivamente o módulo do agente com `module.exports = { consoleaction : consoleaction };`.
- Mantida a assinatura compatível com ScriptTask: `function consoleaction(args, rights, sessionid, parent)`.
- Mantida a barra de botões no cabeçalho do dispositivo, alinhada à direita.
- Mantido botão único em `Meus Arquivos`: copiar endereço Mesh Drive.

## 0.6.3
- Corrigido `modules_meshcore/meshdrive.js` para usar `function consoleaction(...)`.
- Melhorada a injeção dos botões na barra de título do dispositivo.

## 0.6.2
- Corrigido erro `getNodeId is not defined`.
- Melhorada a inserção dos botões na barra de título do dispositivo.

## 0.6.0
- Adicionados botões na tela do dispositivo: Abrir Drive e Mapear Drive.
- Adicionado módulo do agente em `modules_meshcore/meshdrive.js`.
- Mapeamento Windows procura letras livres de M: a Z:.
- `Meus Arquivos` simplificado para apenas copiar endereço.
