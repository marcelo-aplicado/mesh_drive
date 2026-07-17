# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona botões rápidos em **Meus Arquivos** para copiar o endereço WebDAV e copiar um comando de mapeamento para Windows.

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
  - **Mesh Drive**: copia o endereço `\<HOSTNAME>@SSL\drive`.
  - **Mapear**: copia um comando PowerShell que tenta mapear automaticamente a primeira letra livre entre `M:` e `Z:`.

## Botão Mesh Drive

Copia o endereço WebDAV no formato Windows:

```text
\<HOSTNAME>@SSL\drive
```

Esse endereço pode ser colado diretamente na barra do Windows Explorer.

## Botão Mapear

Copia um comando PowerShell que:

- tenta usar `M:` primeiro;
- se `M:` estiver ocupada, tenta `N:`, `O:`, `P:` e assim por diante até `Z:`;
- executa `net use` com o caminho WebDAV;
- tenta nomear a unidade como **Mesh Drive**;
- abre o Explorer na unidade mapeada quando o mapeamento é concluído.

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```

## Observações

O plugin não possui domínio fixo para o WebDAV. Os botões usam o hostname atual do MeshCentral via navegador, permitindo instalar o mesmo plugin em diferentes servidores sem alterar o código.

## Histórico recente

### 1.0.0

Versão final estável com URL real de instalação, instrução de ativação de plugins no MeshCentral e hostname dinâmico para WebDAV.

### 0.7.4

Remove domínio fixo do frontend e gera endereço/comando de mapeamento usando o hostname atual do MeshCentral.

### 0.7.3

Popup do botão `Mesh Drive` mostra o endereço e orientação de uso no Explorer. O botão `Mapear` tenta rotular a unidade como `Mesh Drive`.
