# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona botões rápidos em **Meus Arquivos** para copiar o endereço WebDAV e copiar um comando de mapeamento conforme o sistema operacional.

## Pré-requisito: ativar plugins no MeshCentral

Antes de instalar o plugin, confirme que os plugins estão habilitados no `config.json` do MeshCentral:

```json
{
  "plugins": {
    "enabled": true
  }
}
```

Depois de alterar o `config.json`, reinicie o serviço do MeshCentral.

## Instalação

Na tela de plugins do MeshCentral, use exatamente este endereço para instalar o plugin:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Recursos

- WebDAV: `https://<HOSTNAME>/drive/`
- O hostname é detectado automaticamente a partir do servidor MeshCentral acessado no navegador.
- Em **Meus Arquivos**, dois botões são exibidos:
  - **Mesh Drive**: copia o endereço adequado ao sistema operacional.
  - **Mapear**: copia um comando para abrir/mapear o Mesh Drive conforme o sistema operacional.

## Comportamento por sistema operacional

- **Windows**
  - `Mesh Drive`: copia `\\<HOSTNAME>@SSL\drive`.
  - `Mapear`: copia um comando PowerShell que tenta mapear a primeira letra livre entre `M:` e `Z:` e nomear a unidade como **Mesh Drive**.

- **Linux**
  - `Mesh Drive`: copia `davs://<HOSTNAME>/drive/`.
  - `Mapear`: copia um comando que tenta usar `gio mount` e `xdg-open` para montar/abrir o WebDAV no ambiente gráfico.

- **macOS**
  - `Mesh Drive`: copia `davs://<HOSTNAME>/drive/`.
  - `Mapear`: copia o comando `open "davs://<HOSTNAME>/drive/"`.

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```

## Histórico recente

### 1.0.2

Correção de escopo no frontend: os botões agora são autocontidos e não dependem de helpers locais.

### 1.0.1

Botões `Mesh Drive` e `Mapear` geram endereço e comando conforme o sistema operacional detectado.

### 1.0.0

Versão estável com URL real de instalação, instrução de ativação de plugins no MeshCentral e hostname dinâmico para WebDAV.
