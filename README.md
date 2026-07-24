# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive`.

Esta versão `2.1.3-test` mantém a rota WebDAV estável e adiciona uma interface separada para administrar o arquivo `shares.json`.

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

## WebDAV

A rota WebDAV continua sendo:

```text
https://<HOSTNAME>/drive/
```

No Windows:

```text
\\<HOSTNAME>@SSL\drive
```

## Interface de compartilhamentos

A interface fica em:

```text
https://<HOSTNAME>/meshdrive
```

A interface edita o arquivo:

```text
meshcentral-data/plugins/meshdrive/shares.json
```

Nesta versão de teste, os compartilhamentos ainda **não são aplicados ao WebDAV**. A finalidade é validar o gerenciamento visual e o salvamento do `shares.json` sem alterar a rota `/drive`.

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
    }
  ]
}
```

## Botão Compartilhamentos

Na tela **Meus Arquivos**, além dos botões **Mesh Drive** e **Mapear**, a versão de teste adiciona o botão **Compartilhamentos**, que abre a interface administrativa em `/meshdrive`.
