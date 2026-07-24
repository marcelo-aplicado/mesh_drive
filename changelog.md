# Changelog

## 1.2.2
- Adicionado suporte a Multi-Tenancy por hostname da requisição WebDAV.
- O plugin deixa de usar sempre `meshcentral-files/domain` e passa a resolver automaticamente o diretório de arquivos do tenant, por exemplo `domain-crsbrands`.
- A autenticação Basic agora procura o usuário no domínio interno correto antes de validar a senha, evitando conflito quando o mesmo usuário existe em tenants diferentes.
- Adicionado suporte opcional a `settings.meshDrive.hostDomainMap` para mapear hostnames para domínios internos manualmente.
- Mantidos botões `Mesh Drive` e `Mapear` com hostname dinâmico e comportamento por sistema operacional.

## 1.2.1
- Versão alinhada ao MeshCentral 1.2.1.
- README simplificado.

## 1.0.2
- Correção de escopo no frontend.
- Botões autocontidos para Windows, Linux e macOS.
