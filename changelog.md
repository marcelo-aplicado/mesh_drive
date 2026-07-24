# Changelog

## 1.2.4
- Ativados logs detalhados de autenticação WebDAV para diagnóstico.
- Os logs mostram host, domínio resolvido, usuário encontrado, presença de salt/hash, tamanhos dos hashes e resultado da comparação, sem registrar senha ou hash completo.
- Mantida resolução Multi-Tenancy por `config.domains[*].dns` / `certUrl`.

## 1.2.3
- Corrigida resolução Multi-Tenancy: o plugin agora prioriza o domínio resolvido pelo hostname antes do fallback `domain`.
- Adicionado mapeamento automático usando `config.domains[*].dns` e `config.domains[*].certUrl` do MeshCentral.
- Para `mesh.crsbrands.com.br`, a resolução esperada passa a ser usuário `user/crsbrands/<usuario>` e arquivos em `meshcentral-files/domain-crsbrands`.
- Adicionados logs temporários de diagnóstico para WebDAV: host, domínio interno, diretório de arquivos e fonte da resolução.

## 1.2.2
- Suporte inicial a Multi-Tenancy por hostname.

## 1.2.1
- Versão alinhada ao MeshCentral 1.2.1.
