# Mesh Drive

Plugin experimental para expor o **My Files** do MeshCentral via endpoint WebDAV em `/drive`.

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
URL: https://mesh.aplicado.com.br/drive
Rota: /drive
Raiz dos arquivos: /opt/meshcentral/meshcentral-files/domain/user-<usuario>/
```

## Teste

```bash
curl -k -I https://mesh.aplicado.com.br/drive
```

Resposta esperada sem credenciais:

```text
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Mesh Drive"
```
