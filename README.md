# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive`.

## Instalação

Use na tela de plugins do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Recursos

- WebDAV: `https://dominio.mesh/drive/`
- Em `Meus Arquivos`, dois botões:
  - **Mesh Drive**: copia o endereço `\\dominio.mesh@SSL\drive`.
  - **Mapear**: copia um comando PowerShell para mapear automaticamente a primeira letra livre entre `M:` e `Z:`.

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://dominio.mesh/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```
