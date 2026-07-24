# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona uma rota experimental separada `/shared` para compartilhamentos.

## Instalação

Use na tela de plugins do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Rotas WebDAV

Área pessoal estável:

```text
https://<HOSTNAME>/drive/
\\<HOSTNAME>@SSL\drive
```

Compartilhamentos experimentais:

```text
https://<HOSTNAME>/shared/
\\<HOSTNAME>@SSL\shared
```

## Interface administrativa

```text
https://<HOSTNAME>/meshdrive
```

A interface edita:

```text
meshcentral-data/plugins/meshdrive/shares.json
```

## Exemplo de shares.json

```json
{
  "shares": [
    {
      "name": "Public",
      "path": "public",
      "access": "read",
      "users": ["*"],
      "groups": []
    },
    {
      "name": "TI",
      "path": "shares/ti",
      "access": "write",
      "users": ["marcelo", "lucas"],
      "groups": []
    }
  ]
}
```
