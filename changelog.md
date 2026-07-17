# Changelog

## 1.0.1
- Botões `Mesh Drive` e `Mapear` agora são dinâmicos por sistema operacional.
- Windows: copia caminho UNC e comando PowerShell para mapear letra de `M:` a `Z:`.
- Linux: copia URL `davs://` e comando com `gio mount`/`xdg-open`.
- macOS: copia URL `davs://` e comando `open davs://...`.
- Popups seguem exibindo explicação e conteúdo copiado.

## 1.0.0
- Versão final estável.
- README atualizado com URL real de instalação do plugin no GitHub.
- README atualizado com instrução para ativar plugins no `config.json` do MeshCentral antes da instalação.
- Mantido hostname dinâmico no plugin para WebDAV e comando de mapeamento.

## 0.7.4
- Removido domínio fixo `mesh.aplicado.com.br` do código do frontend.
- Botões `Mesh Drive` e `Mapear` agora usam automaticamente `window.location.hostname`, ou seja, o hostname atual do servidor MeshCentral.
- O comando copiado pelo botão `Mapear` agora monta o caminho WebDAV de forma dinâmica: `\\<HOSTNAME>@SSL\drive`.
- README atualizado com exemplos genéricos usando `<HOSTNAME>`.

## 0.7.3
- O popup do botão `Mesh Drive` agora exibe explicação de uso no Explorer e mostra o endereço copiado.
- Ajustado comando do botão `Mapear` para tentar definir o nome da unidade como `Mesh Drive` usando chave `DriveIcons` e também Shell.Application quando disponível.
- Mantida a busca automática pela primeira letra livre de `M:` a `Z:`.

## 0.7.2
- O popup do botão `Mapear` volta a exibir o comando copiado junto com o texto explicativo.
- O comando de mapeamento tenta definir o rótulo da unidade no Explorer como `Mesh Drive`, para exibição como `Mesh Drive (M:)`, `Mesh Drive (N:)`, etc.
- Mantida a busca automática pela primeira letra livre de `M:` a `Z:`.

## 0.7.1
- Corrigido erro no frontend: `windowsDrivePath is not defined`.
- Corrigido erro no frontend: `copyText is not defined`.
- As funções exportadas `copyDetectedAddress()` e `copyMapCommand()` agora são autocontidas, sem depender de helpers locais que não existem no escopo do navegador.

## 0.7.0
- Versão final simplificada.
- Removidos completamente os botões da tela do dispositivo.
- Removido o módulo `modules_meshcore`, pois não há mais execução via agente.
- Em `Meus Arquivos`, mantidos apenas dois botões:
  - `Mesh Drive`: copia o endereço WebDAV.
  - `Mapear`: copia um comando PowerShell para mapear a primeira letra livre entre `M:` e `Z:`.
- O popup do botão `Mapear` informa apenas que o comando foi copiado e pode ser executado no terminal.
- Mantido endpoint WebDAV `/drive`.

## 0.6.7
- Testes de execução via agente mostraram limitações de sessão e credenciais.
- Decidido remover a execução automática via agente e manter fluxo manual/copiar comando.
