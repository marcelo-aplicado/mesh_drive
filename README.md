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

## Requisito para Windows

O acesso WebDAV no Windows depende do serviço **Cliente Web (WebClient)**. Em muitas instalações, o serviço fica como **Manual** e pode estar parado.

```cmd
sc query WebClient
net start WebClient
sc config WebClient start= auto
```

## Multi-Tenancy

O plugin resolve o tenant usando o hostname da requisição WebDAV e a configuração `domains` do MeshCentral.

Exemplo no `config.json` do MeshCentral:

```json
"CRSBrands": {
  "dns": "mesh.crsbrands.com.br",
  "certUrl": "https://mesh.crsbrands.com.br"
}
```

Com esse exemplo, o acesso por `mesh.crsbrands.com.br` deve autenticar usuários como `user/crsbrands/<usuario>` e usar arquivos em `meshcentral-files/domain-crsbrands`.

Também é possível forçar mapeamento manual:

```json
{
  "settings": {
    "meshDrive": {
      "hostDomainMap": {
        "mesh.crsbrands.com.br": "crsbrands",
        "mesh.aplicado.com.br": "domain"
      }
    }
  }
}
```

## Botões

- **Mesh Drive**: copia o endereço adequado ao sistema operacional.
- **Mapear**: copia um comando para abrir/mapear o Mesh Drive conforme o sistema operacional.


## Diagnóstico de autenticação WebDAV

A versão 1.2.4 inclui logs detalhados para diagnosticar autenticação Basic/WebDAV em ambientes Multi-Tenancy.

Para acompanhar os logs:

```bash
journalctl -u meshcentral -f | grep -i "Mesh Drive"
```

Os logs não exibem a senha nem o hash completo do usuário.

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```
