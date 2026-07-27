# Mesh Drive

Mesh Drive expõe arquivos pessoais e compartilhamentos em `/drive` e adiciona suporte experimental CardDAV em `/carddav`.

## Rotas principais

WebDAV unificado:

```text
\\<HOSTNAME>@SSL\drive
```

CardDAV experimental:

```text
https://<HOSTNAME>/carddav
```

Interface administrativa:

```text
https://<HOSTNAME>/meshdrive
```

## CardDAV experimental

Cada compartilhamento permitido no `shares-<tenant>.json` aparece como um address book CardDAV.

Exemplo:

```json
{
  "name": "Contatos",
  "path": "contacts",
  "readUsers": ["*"],
  "writeUsers": ["marcelo"],
  "readGroups": [],
  "writeGroups": []
}
```

Arquivos físicos:

```text
meshcentral-files/domain/contacts/*.vcf
```

No DAVx5, teste a URL base:

```text
https://<HOSTNAME>/carddav
```

## Observação

Esta é uma implementação de teste para validar descoberta, leitura e gravação básica de `.vcf`. Recursos avançados de CardDAV podem exigir ajustes depois dos testes reais com DAVx5.
