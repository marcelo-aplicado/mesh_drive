# Mesh Drive

Versão `2.4.3-test`.

## Rotas

```text
\\<HOSTNAME>@SSL\drive
https://<HOSTNAME>/carddav
https://<HOSTNAME>/meshdrive
```

## Mudança principal

A rota `/drive` agora mostra os arquivos pessoais diretamente na raiz e adiciona os compartilhamentos como pastas virtuais.

Exemplo:

```text
/drive
├── Documento pessoal.docx
├── Projetos pessoais
└── Contatos
```

## CardDAV

CardDAV continua separado em:

```text
https://<HOSTNAME>/carddav
```

## Configuração padrão

```json
{
  "shares": [
    {
      "name": "Contatos",
      "path": "contatos",
      "readUsers": ["*"],
      "writeUsers": ["marcelo"],
      "readGroups": [],
      "writeGroups": ["TI"],
      "anonymousAccess": "read"
    }
  ]
}
```

## Debug

Logs ficam desativados por padrão. Para ativar:

```json
{
  "settings": {
    "meshDrive": {
      "debug": true
    }
  }
}
```
