# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona uma rota experimental separada `/shared` para compartilhamentos.

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

A rota `/drive` não foi alterada nesta versão.

## Interface administrativa

A interface fica em:

```text
https://<HOSTNAME>/meshdrive
```

A interface edita o arquivo:

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

## Permissões

- `read`: permite listar e baixar arquivos, bloqueando escrita.
- `write`: permite leitura e gravação.
- `users`: lista de usuários autorizados. Use `*` para todos.
- `groups`: experimental, depende de como os grupos aparecem no usuário do MeshCentral.

## Multi-Tenancy

Cada tenant usa seu próprio diretório físico:

```text
mesh.aplicado.com.br    -> meshcentral-files/domain
mesh.crsbrands.com.br  -> meshcentral-files/domain-crsbrands
```

Um share com `path: "public"` aponta para `public` dentro do diretório do tenant atual.
