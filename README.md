# Mesh Drive

Mesh Drive expõe o **My Files** do MeshCentral via WebDAV em `/drive` e adiciona botões rápidos em **Meus Arquivos** para facilitar o acesso aos arquivos dos usuários.

## Pré-requisito: ativar plugins no MeshCentral

Antes de instalar o plugin, confirme que os plugins estão habilitados no arquivo `config.json` do MeshCentral:

```json
{
  "plugins": {
    "enabled": true
  }
}
```

Após alterar o arquivo, reinicie o serviço do MeshCentral.

---

## Requisito para Windows

O acesso WebDAV do Mesh Drive depende do serviço **Cliente Web (WebClient)** do Windows.

Em muitas instalações do Windows o serviço está configurado como **Manual** e pode estar parado.

Para verificar:

```cmd
sc query WebClient
```

Ou abra:

```text
services.msc
```

e verifique o serviço:

```text
Cliente Web (WebClient)
```

Se necessário, inicie o serviço:

```cmd
net start WebClient
```

Opcionalmente, configure para iniciar automaticamente:

```cmd
sc config WebClient start= auto
```

Sem esse serviço, o Windows pode apresentar erros como:

```text
Erro de sistema 67
O nome da rede não foi encontrado
```

---

## Instalação

Na tela de plugins do MeshCentral utilize:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

---

## Recursos

- Endpoint WebDAV em:

```text
https://<HOSTNAME>/drive/
```

- O hostname é detectado automaticamente a partir do servidor MeshCentral acessado pelo navegador.

- Adiciona dois botões na tela **Meus Arquivos**:

### Mesh Drive

Copia automaticamente o endereço correto para o sistema operacional detectado.

#### Windows

```text
\\<HOSTNAME>@SSL\drive
```

#### Linux

```text
davs://<HOSTNAME>/drive/
```

#### macOS

```text
davs://<HOSTNAME>/drive/
```

---

### Mapear

Copia automaticamente um comando adequado ao sistema operacional detectado.

#### Windows

Gera um comando PowerShell que:

- tenta usar a unidade `M:`
- caso esteja ocupada tenta `N:` até `Z:`
- executa o mapeamento WebDAV
- define o nome da unidade como:

```text
Mesh Drive
```

- abre o Explorer automaticamente

Exemplo de resultado:

```text
Mesh Drive (M:)
Mesh Drive (N:)
```

#### Linux

Gera um comando utilizando:

```bash
gio mount
```

e

```bash
xdg-open
```

para abrir ou montar o compartilhamento WebDAV.

#### macOS

Gera um comando:

```bash
open "davs://<HOSTNAME>/drive/"
```

para abrir o compartilhamento diretamente no Finder.

---

## Utilização Manual

### Windows Explorer

Cole no Explorer:

```text
\\<HOSTNAME>@SSL\drive
```

### Linux

Abra:

```text
davs://<HOSTNAME>/drive/
```

### macOS

Abra:

```text
davs://<HOSTNAME>/drive/
```

---

## Teste WebDAV

```bash
curl -k -i -u <usuario> -X PROPFIND -H "Depth: 1" https://<HOSTNAME>/drive/
```

Resposta esperada:

```text
HTTP/1.1 207 Multi-Status
```

---

## Compatibilidade

- MeshCentral 1.2.1 ou superior
- Windows 10/11
- Linux com suporte WebDAV
- macOS com suporte WebDAV
- Navegadores modernos compatíveis com Clipboard API

## Licença

MIT License
