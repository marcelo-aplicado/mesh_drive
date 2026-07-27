# Changelog

## 2.4.0-test
- Adicionada rota experimental CardDAV em `/carddav`.
- Cada compartilhamento permitido passa a aparecer como um address book CardDAV.
- Contatos são armazenados como arquivos `.vcf` dentro do diretório físico do compartilhamento.
- Implementados métodos básicos CardDAV/WebDAV: `OPTIONS`, `PROPFIND`, `REPORT`, `GET`, `PUT` e `DELETE`.
- Mantida rota unificada `/drive`, interface `/meshdrive`, ACL por tenant e arquivos `shares-<tenant>.json`.

## 2.3.0-test
- Rota única `/drive` para arquivos pessoais e compartilhamentos.
