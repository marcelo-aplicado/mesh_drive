# Mesh Drive

Mesh Drive é um plugin para o MeshCentral que adiciona acesso WebDAV e CardDAV usando os arquivos do próprio MeshCentral como backend.

## Recursos

- Rota `/drive` para acesso WebDAV a arquivos.
- Rota `/carddav` para sincronização de contatos em clientes compatíveis com CardDAV, como DAVx5.
- Rota administrativa `/meshdrive` para cadastrar e editar compartilhamentos.
- Arquivos pessoais do usuário exibidos diretamente na raiz do `/drive`.
- Compartilhamentos exibidos como pastas virtuais adicionais na raiz do `/drive`.
- Configuração centralizada em um único arquivo `shares.json`.
- Configuração separada por domínio/tenant dentro do mesmo `shares.json`.
- Permissões por usuários e grupos de leitura/gravação.
- Acesso anônimo opcional por compartilhamento: `none`, `read` ou `write`.
- Logs desativados por padrão para reduzir risco de carga excessiva.
- Proteção contra registro duplicado de rotas.

## Rotas

```text
/drive
/carddav
/meshdrive
```

Exemplos de uso:

```text
\\mesh.exemplo.com.br@SSL\drive
```

```text
https://mesh.exemplo.com.br/carddav
```

```text
https://mesh.exemplo.com.br/meshdrive
```

## Requisitos

- MeshCentral com suporte a plugins habilitado.
- Node.js/MeshCentral rodando com acesso de leitura e gravação ao diretório `meshcentral-data/plugins`.
- Diretório de arquivos do MeshCentral acessível pelo container/serviço, normalmente `meshcentral-files`.
- Para WebDAV no Windows, o serviço **WebClient** do Windows deve estar ativo.
- Para CardDAV no Android, use um cliente compatível, como DAVx5.

## Ativar plugins no MeshCentral

No `config.json` do MeshCentral, confirme que plugins estão habilitados. Exemplo:

```json
{
  "settings": {
    "plugins": true
  }
}
```

Se o seu ambiente usa uma estrutura diferente de configuração, mantenha o padrão já utilizado na sua instalação para habilitar plugins.

## Instalação

1. Pare o MeshCentral.

```bash
docker compose down
```

2. Copie a pasta do plugin para:

```text
meshcentral-data/plugins/meshdrive
```

A pasta deve conter, no mínimo:

```text
config.json
meshdrive.js
shares.json
README.md
LICENSE
```

3. Ajuste permissões se necessário.

```bash
sudo chown -R ubuntu:ubuntu meshcentral-data/plugins/meshdrive
```

4. Suba o MeshCentral novamente.

```bash
docker compose up -d
```

5. Acesse a interface administrativa do plugin.

```text
https://SEU_HOST/meshdrive
```

## Configuração principal: `shares.json`

A versão 1.2.4 usa apenas um arquivo de configuração para todos os domínios:

```text
shares.json
```

Exemplo:

```json
{
  "domains": {
    "domain": {
      "shares": [
        {
          "name": "Contatos",
          "path": "contatos",
          "readUsers": ["*"],
          "writeUsers": ["marcelo"],
          "readGroups": [],
          "writeGroups": ["TI"],
          "anonymousAccess": "read"
        }
      ]
    },
    "crsbrands": {
      "shares": [
        {
          "name": "Contatos",
          "path": "contatos",
          "readUsers": ["*"],
          "writeUsers": ["marcelo"],
          "readGroups": [],
          "writeGroups": ["TI"],
          "anonymousAccess": "read"
        }
      ]
    }
  }
}
```

## Campos do compartilhamento

### `name`

Nome exibido no `/drive` e também usado como address book no `/carddav`.

```json
"name": "Contatos"
```

### `path`

Diretório físico relativo ao domínio/tenant do MeshCentral.

```json
"path": "contatos"
```

### `readUsers`

Usuários com permissão de leitura. Use `*` para permitir leitura a todos os usuários autenticados.

```json
"readUsers": ["*"]
```

### `writeUsers`

Usuários com permissão de gravação.

```json
"writeUsers": ["marcelo"]
```

### `readGroups`

Grupos com permissão de leitura.

```json
"readGroups": []
```

### `writeGroups`

Grupos com permissão de gravação.

```json
"writeGroups": ["TI"]
```

### `anonymousAccess`

Controla acesso sem usuário MeshCentral.

```json
"anonymousAccess": "read"
```

Valores:

- `none`: não permite acesso anônimo.
- `read`: permite acesso anônimo somente leitura.
- `write`: permite acesso anônimo com leitura e gravação.

## Exemplo padrão incluído

O pacote já vem com `shares.json` configurado com `Contatos` nos tenants:

```text
domain
crsbrands
mhs
fastcopy
```

Todos usam:

```json
{
  "name": "Contatos",
  "path": "contatos",
  "readUsers": ["*"],
  "writeUsers": ["marcelo"],
  "readGroups": [],
  "writeGroups": ["TI"],
  "anonymousAccess": "read"
}
```

## WebDAV no Windows

Use:

```text
\\SEU_HOST@SSL\drive
```

Se o Windows não conectar, verifique se o serviço **WebClient** está iniciado.

## CardDAV no DAVx5

Use a URL base:

```text
https://SEU_HOST/carddav
```

Para acesso anônimo, deixe usuário e senha em branco no DAVx5. O plugin usará o usuário interno `anonymous`.

## Debug

Logs ficam desligados por padrão. Para ativar:

```json
{
  "settings": {
    "meshDrive": {
      "debug": true
    }
  }
}
```

## Observações de segurança

- Evite `anonymousAccess: "write"` em ambientes expostos à internet.
- Use `anonymousAccess: "read"` apenas para dados que possam ser lidos por qualquer pessoa com acesso à URL.
- Para ambientes corporativos, prefira gravação por usuário ou grupo.
