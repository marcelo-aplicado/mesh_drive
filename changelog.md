# Changelog

## 2.4.1-test
- Adicionada opção de acesso anônimo por compartilhamento na interface `/meshdrive`.
- Novo campo `anonymousAccess` com opções `none`, `read` e `write`.
- Acesso anônimo em `read` permite listar/baixar arquivos e ler contatos CardDAV sem usuário MeshCentral.
- Acesso anônimo em `write` permite também gravar/remover arquivos `.vcf` no CardDAV e escrever no WebDAV do compartilhamento.
- Mantidas rotas `/drive`, `/carddav` e `/meshdrive`.

## 2.4.0-test
- Adicionada rota experimental CardDAV em `/carddav`.
