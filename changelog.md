# Changelog

## 0.6.1
- Corrigido erro de JavaScript `pluginHandler.meshdrive.nodeid is not a function`.
- `openDriveOnAgent()` e `mapDriveOnAgent()` agora pegam o `nodeid` diretamente de `currentNode._id` ou `currentNodeId`.
- Botões da tela do dispositivo agora são inseridos na barra de título `Em geral - ...`, alinhados à direita.
- Adicionados logs no console do navegador para confirmar envio dos comandos `open` e `map`.
- Mantido botão único em `Meus Arquivos`: copiar endereço do Mesh Drive.

## 0.6.0
- Adicionados botões na tela do dispositivo: Abrir Drive e Mapear Drive.
- Adicionado módulo do agente em `modules_meshcore/meshdrive.js`.
- Mapeamento Windows procura letras livres de M: a Z:.
- `Meus Arquivos` simplificado para apenas copiar endereço.
