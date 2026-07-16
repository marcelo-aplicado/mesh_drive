# Mesh Drive

Plugin experimental para expor o **My Files** do MeshCentral via endpoint WebDAV em `/drive`.

## Instalação pelo MeshCentral

No MeshCentral:

```text
Meu Servidor > Plugins > Baixe o plugin
```

Use este endereço:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

## Configuração do servidor

No `meshcentral-data/config.json`, o necessário é manter plugins habilitados dentro de `settings`:

```json
"settings": {
  "cert": "mesh.aplicado.com.br",
  "port": 443,
  "redirPort": 80,
  "plugins": {
    "enabled": true
  }
}
```

O plugin já possui valores padrão para seu ambiente:

```text
URL: https://mesh.aplicado.com.br/drive
Rota: /drive
Raiz dos arquivos: /opt/meshcentral/meshcentral-files/domain/user-<usuario>/
```

## Testar se carregou

Após instalar e reiniciar o MeshCentral, teste:

```bash
curl -k -I https://mesh.aplicado.com.br/drive
```

Resultado esperado se a rota foi registrada:

```text
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Mesh Drive"
```

## Mapear no Windows

```cmd
net use M: https://mesh.aplicado.com.br/drive /user:marcelo * /persistent:yes
```

## Observações

- O repositório GitHub se chama `mesh_drive`, mas o `shortName` do plugin é `meshdrive` para evitar problemas com underscore no carregador de plugins.
- O arquivo principal precisa se chamar `meshdrive.js` porque o `shortName` é `meshdrive`.
- O nome exibido continua sendo **Mesh Drive**.
