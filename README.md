# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e usa a rota experimental `/shared` para compartilhamentos configurados em `shares.json`.

## Rotas

Área pessoal:

```text
\\<HOSTNAME>@SSL\drive
```

Compartilhamentos:

```text
\\<HOSTNAME>@SSL\shared
```

Interface administrativa:

```text
https://<HOSTNAME>/meshdrive
```

## Modelo de permissões

A versão `2.2.2-test` usa campos separados para leitura e gravação:

```json
{
  "shares": [
    {
      "name": "Public",
      "path": "public",
      "readUsers": ["*"],
      "writeUsers": ["marcelo"],
      "readGroups": [],
      "writeGroups": []
    }
  ]
}
```

## Campos

- `name`: nome exibido em `/shared`.
- `path`: diretório físico relativo ao tenant atual.
- `readUsers`: usuários com leitura.
- `writeUsers`: usuários com gravação. Gravação também implica leitura.
- `readGroups`: grupos com leitura.
- `writeGroups`: grupos com gravação. Gravação também implica leitura.
- Use `*` em `readUsers` para liberar leitura para todos os usuários autenticados.

## Multi-Tenancy

Cada domínio usa seu próprio diretório físico:

```text
mesh.aplicado.com.br    -> meshcentral-files/domain
mesh.crsbrands.com.br  -> meshcentral-files/domain-crsbrands
```
