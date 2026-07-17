# Changelog

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
