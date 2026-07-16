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


## Correção 0.5.2

O bloco exibido no My Files agora possui três botões rápidos:

- Baixar link detectado pelo sistema operacional.
- Copiar endereço detectado pelo sistema operacional.
- Abrir todas as opções.

Atalhos gerados:

```text
Windows: MeshDrive.url
Linux: mesh-drive.desktop
macOS: MeshDrive.webloc
```


## 0.5.3

This version removes `getDetectedInfo()` from the render path. The card in My Files is rendered statically and OS detection runs only when a button is clicked.


## 0.5.4

The Mesh Drive quick buttons are now inserted beside the My Files / Meus Arquivos title instead of being rendered as a separate large card above the file list.


## 0.5.5

Os botões rápidos do Mesh Drive agora são alinhados à direita na mesma linha do título `Meus Arquivos` / `My Files`.
