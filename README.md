# Mesh Drive

Versão `2.4.5-test`.

## Rotas

```text
\\<HOSTNAME>@SSL\drive
https://<HOSTNAME>/carddav
https://<HOSTNAME>/meshdrive
```

## Ícones de compartilhamento

Cada compartilhamento pode ter o campo:

```json
"icon": "folder"
```

Valores disponíveis:

- `folder`: pasta padrão;
- `contact`: ícone de contatos;
- `public`: ícone público/compartilhado.

A interface `/meshdrive` possui um seletor para escolher o ícone.

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
      "anonymousAccess": "read",
      "icon": "contact"
    }
  ]
}
```

## Observação sobre Windows

O plugin tenta criar `desktop.ini` e `.ico` dentro da pasta física do compartilhamento. O Windows Explorer pode depender de cache e comportamento do WebDAV para aplicar o ícone.
