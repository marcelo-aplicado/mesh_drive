# Mesh Drive

Mesh Drive expõe arquivos em `/drive` e contatos CardDAV em `/carddav`.

## Rotas

```text
\\<HOSTNAME>@SSL\drive
https://<HOSTNAME>/carddav
https://<HOSTNAME>/meshdrive
```

## Acesso anônimo

A versão `2.4.1-test` adiciona o campo:

```json
"anonymousAccess": "none"
```

Valores:

- `none`: exige usuário MeshCentral.
- `read`: permite acesso anônimo somente leitura.
- `write`: permite acesso anônimo com gravação.

Exemplo:

```json
{
  "name": "Contatos",
  "path": "contacts",
  "readUsers": ["*"],
  "writeUsers": ["marcelo"],
  "readGroups": [],
  "writeGroups": [],
  "anonymousAccess": "read"
}
```

No DAVx5, para teste sem usuário MeshCentral, use:

```text
https://<HOSTNAME>/carddav
```

> Atenção: `anonymousAccess: "write"` permite gravação sem autenticação. Use apenas em ambientes controlados.
