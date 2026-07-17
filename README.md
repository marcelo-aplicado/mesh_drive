# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive`.

## Instalação

Use na tela de plugins do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Recursos

- WebDAV: `https://mesh.aplicado.com.br/drive/`
- Em `Meus Arquivos`, dois botões:
  - **Mesh Drive**: copia o endereço `\\mesh.aplicado.com.br@SSL\drive`.
  - **Mapear**: copia um comando PowerShell para mapear automaticamente a primeira letra livre entre `M:` e `Z:`.

## Teste WebDAV

```bash
curl -k -i -u marcelo -X PROPFIND -H "Depth: 1" https://mesh.aplicado.com.br/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```


## 0.7.1

Correção de escopo no frontend: os botões `Mesh Drive` e `Mapear` agora executam funções autocontidas, sem depender de helpers locais não exportados.
