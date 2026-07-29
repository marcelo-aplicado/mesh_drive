# Mesh Drive

Versão `2.4.2-test` focada em estabilização.

## Rotas

```text
\\<HOSTNAME>@SSL\drive
https://<HOSTNAME>/carddav
https://<HOSTNAME>/meshdrive
```

## Estabilização

Esta versão adiciona:

- logs desativados por padrão;
- trava global para evitar registro duplicado de handlers;
- limite de itens em respostas CardDAV REPORT;
- manutenção do modelo `anonymousAccess`.

## Configuração de debug

Por padrão, o plugin não grava logs contínuos. Para ativar logs pontuais, use no `config.json` do MeshCentral:

```json
{
  "settings": {
    "meshDrive": {
      "debug": true
    }
  }
}
```

## Acesso anônimo

```json
"anonymousAccess": "none"
```

Valores:

- `none`: exige usuário MeshCentral.
- `read`: acesso anônimo somente leitura.
- `write`: acesso anônimo com gravação.
