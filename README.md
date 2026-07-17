# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive`.

## Instalação

Use na tela de plugins do MeshCentral o `config.json` publicado no seu repositório GitHub.

Exemplo:

```text
https://raw.githubusercontent.com/<usuario>/<repositorio>/main/config.json
```

## Recursos

- WebDAV: `https://<HOSTNAME>/drive/`
- Em `Meus Arquivos`, dois botões:
  - **Mesh Drive**: copia o endereço `\\<HOSTNAME>@SSL\drive`.
  - **Mapear**: copia um comando PowerShell para mapear automaticamente a primeira letra livre entre `M:` e `Z:`.
- O hostname é detectado automaticamente a partir do servidor MeshCentral acessado no navegador.

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```

## Histórico recente

### 0.7.4

Remove domínio fixo do frontend e gera endereço/comando de mapeamento usando o hostname atual do MeshCentral.

### 0.7.3

Popup do botão `Mesh Drive` mostra o endereço e orientação de uso no Explorer. O botão `Mapear` tenta rotular a unidade como `Mesh Drive`.
