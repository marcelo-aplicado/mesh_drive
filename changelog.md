# Changelog

## 1.2.7

- Baseada na versão funcional enviada em `<File>mesh_drive-12f33da969af3d656f3ae55b756e037345259cde.zip</File>`.
- Mantida a injeção dos botões no My Files.
- Adicionado botão `Contatos` junto aos botões `Mesh Drive`, `Mapear` e `Compartilhamentos`.
- Adicionada rota `/meshcontacts` para edição dos contatos `.vcf`.
- Corrigida API do editor para aceitar tanto `/meshcontacts/api/*` quanto `/api/*` quando o Express remove o prefixo da rota.
- Mantida configuração única em `shares.json`.
