# Mesh Drive

Versão `2.4.7-test`.

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

Esta versão remove o compartilhamento `Public` e mantém apenas `Contatos` como padrão.

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

## Arquivos padrão de tenant incluídos

```text
shares-domain.json
shares-crsbrands.json
shares-mhs.json
shares-fastcopy.json
```

Se um arquivo `shares-<tenant>.json` já existir no servidor, ele não será sobrescrito automaticamente. Nesse caso, ajuste pela interface `/meshdrive` ou substitua o arquivo manualmente.

## Acesso anônimo

```json
"anonymousAccess": "read"
```

Permite leitura anônima no CardDAV/WebDAV do compartilhamento.

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
