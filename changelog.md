# Changelog

## 1.0.2
- Corrigido erro de escopo no frontend: `meshDriveDetectedOs is not defined`.
- As funções `copyDetectedAddress()` e `copyMapCommand()` agora são completamente autocontidas e não dependem de helpers locais não exportados.
- Mantido comportamento dinâmico por sistema operacional: Windows, Linux, macOS e fallback web.

## 1.0.1
- Botões `Mesh Drive` e `Mapear` dinâmicos por sistema operacional.
- Windows: caminho UNC e comando PowerShell para mapear letra de `M:` a `Z:`.
- Linux: URL `davs://` e comando com `gio mount`/`xdg-open`.
- macOS: URL `davs://` e comando `open`.

## 1.0.0
- Versão final estável com URL real de instalação no README.
- Instrução para ativar plugins no `config.json` do MeshCentral.
- Hostname dinâmico para WebDAV.
