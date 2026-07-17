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
- Linux/macOS: tenta abrir ou montar usando `davs://` / WebDAV.

## Teste WebDAV

```bash
curl -k -i -u marcelo -X PROPFIND -H "Depth: 1" https://mesh.aplicado.com.br/drive/
```

Esperado:

```text
HTTP/1.1 207 Multi-Status
```

## Debug da tela do dispositivo

Ao clicar nos botões, o console do navegador deve mostrar:

```text
MeshDrive OPEN nodeid: <nodeid>
MeshDrive MAP nodeid: <nodeid>
```


## 0.6.3

Corrige o módulo de agente para usar a assinatura `function consoleaction(args, rights, sessionid, parent)`, como esperado pelo MeshCentral. Também melhora o posicionamento dos botões na barra de título do dispositivo.
