# Changelog

## 2.3.0-test
- Criada rota única WebDAV `/drive` para arquivos pessoais e compartilhamentos.
- A raiz de `/drive` passa a exibir uma pasta virtual `Pessoal` e os compartilhamentos permitidos do tenant.
- Removida a necessidade de acessar `/shared` para compartilhamentos.
- A configuração de compartilhamentos continua isolada por tenant: `shares-domain.json`, `shares-crsbrands.json`, etc.
- Mantido modelo ACL com `readUsers`, `writeUsers`, `readGroups` e `writeGroups`.
- Mantida interface administrativa `/meshdrive`.

## 2.2.3-test
- Isolamento de compartilhamentos por tenant.
