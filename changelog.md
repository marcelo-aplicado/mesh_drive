# Changelog

## 2.1.1-test
- Versão de teste corrigida: a raiz `/drive/` volta a apontar diretamente para a área pessoal do usuário, como na versão 1.2.4 estável.
- A pasta virtual `Compartilhado` é adicionada apenas como item extra na listagem PROPFIND da raiz, sem substituir a raiz física do usuário.
- Mantido `plugins/meshdrive/shares.json` e interface gráfica em `/meshdrive/shares`.
- Mantida autenticação nativa do MeshCentral e suporte Multi-Tenancy.

## 2.1.0-test
- Teste inicial com `shares.json` e interface gráfica.
