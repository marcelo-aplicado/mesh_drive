# Changelog

## 0.6.3
- Corrigido `modules_meshcore/meshdrive.js` para usar `function consoleaction(args, rights, sessionid, parent)` no mesmo padrão do ScriptTask.
- Removido `global.consoleaction`, que causava erro `undefined not callable`.
- Melhorada a injeção dos botões na barra de título do dispositivo, procurando o texto `Em geral -` / `General -` em qualquer posição e evitando renderizar card no final da página.
- Se uma versão antiga do bloco estiver no final da página, a rotina tenta remover e reinserir no título.

## 0.6.2
- Corrigido erro `getNodeId is not defined` removendo função auxiliar local do caminho exportado.
- `openDriveOnAgent()` e `mapDriveOnAgent()` agora detectam o dispositivo diretamente dentro da própria função exportada.
- Melhorada a inserção dos botões na barra de título do dispositivo usando busca mais ampla por `Em geral -` / `General -`.
- Botões do dispositivo agora usam alinhamento à direita com `float:right` e fallback flex.
- Mantidos logs no console para depuração do `nodeid`.

## 0.6.1
- Corrigido erro `pluginHandler.meshdrive.nodeid is not a function`.
- Botões da tela do dispositivo movidos para a barra de título.

## 0.6.0
- Adicionados botões na tela do dispositivo: Abrir Drive e Mapear Drive.
- Adicionado módulo do agente em `modules_meshcore/meshdrive.js`.
- Mapeamento Windows procura letras livres de M: a Z:.
- `Meus Arquivos` simplificado para apenas copiar endereço.
