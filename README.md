# Mesh Drive

Plugin experimental para expor o **My Files** do MeshCentral via WebDAV em `/drive` e oferecer uma página auxiliar com opções para abrir ou mapear em Windows, Linux e macOS.

## Instalação pelo MeshCentral

Use na tela de plugins:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Configuração esperada no MeshCentral

```json
"plugins": {
  "enabled": true
}
```

O bloco acima deve ficar dentro de `settings`.

## Valores padrão

```text
URL WebDAV: https://mesh.aplicado.com.br/drive/
Página auxiliar: https://mesh.aplicado.com.br/meshdrive/launcher
Raiz dos arquivos: /opt/meshcentral/meshcentral-files/domain/user-<usuario>/
```

## Recursos

- Endpoint WebDAV `/drive`.
- Página auxiliar `/meshdrive/launcher`.
- Detecção de sistema operacional.
- Opções para abrir e mapear no Windows, Linux e macOS.
- Link visual `Mesh Drive` integrado à interface do MeshCentral.

## Teste WebDAV

```bash
curl -k -i -u marcelo -X PROPFIND -H "Depth: 1" https://mesh.aplicado.com.br/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```


## Correção 0.5.1

Corrige o botão de copiar caminho Windows. O caminho copiado deve ser exatamente:

```text
\\mesh.aplicado.com.br@SSL\drive
```
