# Changelog

## 1.2.8

- Baseada na versão funcional enviada em `<File>mesh_drive-12f33da969af3d656f3ae55b756e037345259cde.zip</File>`.
- Mantida a injeção dos botões no My Files.
- Adicionado botão `Contatos` junto aos botões `Mesh Drive`, `Mapear` e `Compartilhamentos`.
- Adicionada rota `/meshcontacts` para edição dos contatos `.vcf`.
- Corrigida API do editor para aceitar tanto `/meshcontacts/api/*` quanto `/api/*` quando o Express remove o prefixo da rota.
- Ajustado `/drive` para exigir autenticação na raiz, evitando que o Windows entre como anônimo e mostre apenas `Contatos`.
- O `/drive` autenticado lista arquivos pessoais na raiz e adiciona `Contatos` como pasta virtual.
- Mantida configuração única em `shares.json`.
