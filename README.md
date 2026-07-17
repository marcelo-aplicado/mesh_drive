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

## Debug 0.6.5

Ao clicar em `Abrir Drive` ou `Mapear Drive`, o console do navegador deve mostrar o payload enviado para o MeshCentral. No servidor, o `journalctl` deve mostrar:

```text
PLUGIN: Mesh Drive serveraction: {...}
```

Se esse log não aparecer, o evento ainda não está chegando ao método `obj.serveraction()`.
