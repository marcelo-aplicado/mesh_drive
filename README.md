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

Verifique:

```cmd
sc query WebClient
```

Inicie, se necessário:

```cmd
net start WebClient
```

Opcionalmente, configure como automático:

```cmd
sc config WebClient start= auto
```

Sem esse serviço, o Windows pode apresentar erros como:

```text
Erro de sistema 67
O nome da rede não foi encontrado
```

## Recursos

- WebDAV: `https://<HOSTNAME>/drive/`
- O hostname é detectado automaticamente a partir do servidor MeshCentral acessado no navegador.
- Em **Meus Arquivos**, dois botões são exibidos:
  - **Mesh Drive**: copia o endereço adequado ao sistema operacional.
  - **Mapear**: copia um comando para abrir/mapear o Mesh Drive conforme o sistema operacional.

## Comportamento por sistema operacional

- **Windows**
  - `Mesh Drive`: copia `\<HOSTNAME>@SSL\drive`.
  - `Mapear`: copia um comando PowerShell que tenta mapear a primeira letra livre entre `M:` e `Z:` e nomear a unidade como **Mesh Drive**.

- **Linux**
  - `Mesh Drive`: copia `davs://<HOSTNAME>/drive/`.
  - `Mapear`: copia um comando que tenta usar `gio mount` e `xdg-open` para montar/abrir o WebDAV no ambiente gráfico.

- **macOS**
  - `Mesh Drive`: copia `davs://<HOSTNAME>/drive/`.
  - `Mapear`: copia o comando `open "davs://<HOSTNAME>/drive/"`.

## Multi-Tenancy

O Mesh Drive resolve o tenant usando o hostname da requisição WebDAV e a configuração `domains` do MeshCentral.

Exemplo no `config.json` do MeshCentral:

```json
"CRSBrands": {
  "dns": "mesh.crsbrands.com.br",
  "certUrl": "https://mesh.crsbrands.com.br"
}
```

Com esse exemplo, o acesso por `mesh.crsbrands.com.br` autentica usuários como `user/crsbrands/<usuario>` e usa arquivos em `meshcentral-files/domain-crsbrands`.

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

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```

## Licença

MIT License
