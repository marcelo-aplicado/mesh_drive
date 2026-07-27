# Mesh Drive

Versão `2.4.4-test`.

## Rotas

```text
\\<HOSTNAME>@SSL\drive
https://<HOSTNAME>/carddav
https://<HOSTNAME>/meshdrive
```

## Comportamento do `/drive`

A rota `/drive` mostra os arquivos pessoais diretamente na raiz e adiciona os compartilhamentos permitidos como pastas virtuais.

Exemplo:

```text
/drive
├── Arquivo pessoal.pdf
├── Pasta pessoal
└── Contatos
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

## Observação

Se existir um arquivo `shares-<tenant>.json` no servidor, ele não será sobrescrito automaticamente pelo arquivo padrão do pacote.

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
