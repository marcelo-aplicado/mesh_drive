# Changelog

## 2.2.3-test
- Corrigido isolamento Multi-Tenancy da configuração de compartilhamentos.
- O plugin deixa de usar um `shares.json` global e passa a usar arquivos por tenant.
- Tenant padrão usa `shares-domain.json`.
- Tenant CRS Brands usa `shares-crsbrands.json`.
- A interface `/meshdrive` lê e salva o arquivo do tenant acessado pelo hostname.
- A rota `/shared` também usa o arquivo do tenant da requisição.
- Mantido modelo ACL com `readUsers`, `writeUsers`, `readGroups` e `writeGroups`.

## 2.2.2-test
- Modelo ACL com usuários/grupos separados para leitura e gravação.
