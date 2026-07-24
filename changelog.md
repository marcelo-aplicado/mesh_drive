# Changelog

## 2.2.1-test
- Corrigido o salvamento de usuários na interface `/meshdrive`.
- O frontend agora coleta diretamente os campos da tela no momento de salvar, em vez de depender de eventos `onchange`.
- Usuários como `marcelo` deixam de ser substituídos indevidamente por `*`.
- Mantida rota WebDAV estável `/drive` e rota experimental `/shared`.

## 2.2.0-test
- Adicionada rota WebDAV experimental `/shared` para compartilhamentos configurados em `shares.json`.
