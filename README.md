# Mesh Drive

Mesh Drive exposes MeshCentral **My Files** through WebDAV at `/drive` and adds device-page actions to open or map Mesh Drive through the selected MeshCentral agent.

## Install

Use this URL in MeshCentral Plugins:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Features

- WebDAV endpoint: `https://mesh.aplicado.com.br/drive/`
- My Files quick button: copy Mesh Drive address
- Device page buttons:
  - Abrir Drive
  - Mapear Drive
- Windows mapping searches the first available drive letter from `M:` to `Z:`.

## Server test

```bash
curl -k -i -u marcelo -X PROPFIND -H "Depth: 1" https://mesh.aplicado.com.br/drive/
```

Expected:

```text
HTTP/1.1 207 Multi-Status
```
