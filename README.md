# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona botões na tela do dispositivo para abrir ou mapear o Mesh Drive usando o agente do MeshCentral.

## Instalação

Use na tela de plugins do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Recursos

- WebDAV: `https://mesh.aplicado.com.br/drive/`
- Em `Meus Arquivos`: botão para copiar o endereço do Mesh Drive.
- Na tela do dispositivo: botões `Abrir Drive` e `Mapear Drive` alinhados à direita do título.
- Windows: `Mapear Drive` procura a primeira letra livre entre `M:` e `Z:`.

## Correção 0.6.7

O `Mapear Drive` não usa mais PowerShell com `-EncodedCommand`, removendo o erro `unsupported encoding`. O botão `Abrir Drive` em Windows passou a usar `explorer.exe` diretamente.

## Debug

Após clicar em `Abrir Drive` ou `Mapear Drive`, valide:

```bash
journalctl -u meshcentral -n 80 | grep -i "Mesh Drive"
```
