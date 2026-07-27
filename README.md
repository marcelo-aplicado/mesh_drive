# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e uma rota experimental `/shared` para compartilhamentos.

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

## Configuração por tenant

A versão `2.2.3-test` isola as configurações de compartilhamento por tenant.

Exemplos:

```text
meshcentral-data/plugins/meshdrive/shares-domain.json
meshcentral-data/plugins/meshdrive/shares-crsbrands.json
meshcentral-data/plugins/meshdrive/shares-mhs.json
meshcentral-data/plugins/meshdrive/shares-fastcopy.json
```

O tenant é resolvido pelo hostname e pela seção `domains` do MeshCentral.

## Modelo de permissões

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

- `readUsers`: usuários com leitura.
- `writeUsers`: usuários com gravação. Gravação também implica leitura.
- `readGroups`: grupos com leitura.
- `writeGroups`: grupos com gravação. Gravação também implica leitura.
- Use `*` em `readUsers` para liberar leitura para todos os usuários autenticados.

## Multi-Tenancy

Cada tenant usa configuração e diretório de arquivos próprios.

```text
mesh.aplicado.com.br    -> shares-domain.json      -> meshcentral-files/domain
mesh.crsbrands.com.br  -> shares-crsbrands.json   -> meshcentral-files/domain-crsbrands
```
