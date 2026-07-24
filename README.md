# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona suporte experimental a compartilhamentos gerenciados por interface gráfica.

## Instalação

Use na tela de plugins do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Pré-requisito

No `config.json` do MeshCentral:

```json
{
  "plugins": {
    "enabled": true
  }
}
```

## Requisito para Windows

O WebDAV no Windows depende do serviço **Cliente Web (WebClient)**:

```cmd
sc query WebClient
net start WebClient
sc config WebClient start= auto
```

## Compartilhamentos

A versão `2.1.0-test` usa o arquivo:

```text
meshcentral-data/plugins/meshdrive/shares.json
```

A interface gráfica fica em:

```text
https://<HOSTNAME>/meshdrive/shares
```

A tela solicita autenticação Basic e exige usuário administrador do MeshCentral.

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

## Campos

- `name`: nome exibido em `Compartilhado`.
- `path`: pasta física relativa ao diretório do tenant.
- `access`: `read` ou `write`.
- `users`: usuários permitidos. Use `*` para todos.
- `groups`: grupos permitidos. O suporte depende dos dados de grupo disponíveis no usuário do MeshCentral.

## Multi-Tenancy

Cada tenant usa seu próprio diretório físico. Exemplo:

```text
mesh.aplicado.com.br      -> meshcentral-files/domain
mesh.crsbrands.com.br    -> meshcentral-files/domain-crsbrands
```
