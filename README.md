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
\\SEU_HOST@SSL\drive
```

```text
https://SEU_HOST/carddav
```

```text
https://SEU_HOST/meshdrive
```

## Requisitos

- MeshCentral com suporte a plugins habilitado.
- Acesso administrativo ao MeshCentral.
- Diretório de dados do MeshCentral com permissão de leitura e gravação para o serviço/container.
- Diretório de arquivos do MeshCentral acessível pelo serviço/container, normalmente `meshcentral-files`.
- Para WebDAV no Windows, o serviço **WebClient** do Windows deve estar ativo.
- Para CardDAV no Android, use um cliente compatível, como DAVx5.

## Ativar plugins no MeshCentral

No `config.json` do MeshCentral, confirme que plugins estão habilitados.

Exemplo:

```json
{
  "settings": {
    "plugins": true
  }
}
```

Depois de alterar o `config.json`, reinicie o MeshCentral.

## Instalação pela interface do MeshCentral

Use a URL do arquivo `config.json` do repositório do plugin:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

Passos:

1. Acesse o MeshCentral com um usuário administrador.

2. Abra a área de plugins do MeshCentral.

3. Use a opção de instalação de plugin por URL.

4. Cole a URL do `config.json` do repositório:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

5. Confirme a instalação pela interface.

6. Aguarde o MeshCentral baixar e instalar o plugin.

7. Reinicie o MeshCentral para garantir que as rotas do plugin sejam carregadas.

8. Após reiniciar, acesse:

```text
https://SEU_HOST/meshdrive
```

9. Confirme se o arquivo `shares.json` foi carregado e ajuste os compartilhamentos conforme necessário.

## Estrutura esperada do plugin

Após a instalação, a pasta do plugin deve conter pelo menos:

```text
config.json
meshdrive.js
shares.json
README.md
LICENSE
```

## Configuração principal: `shares.json`

A versão `1.2.4` usa apenas um arquivo de configuração para todos os domínios:

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

## Domínios padrão incluídos

O pacote já vem com configuração inicial para:

```text
domain
crsbrands
mhs
fastcopy
```

Todos usam o compartilhamento padrão:

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

Valores disponíveis:

- `none`: não permite acesso anônimo.
- `read`: permite acesso anônimo somente leitura.
- `write`: permite acesso anônimo com leitura e gravação.

## Uso no Windows via WebDAV

Use:

```text
\\SEU_HOST@SSL\drive
```

Se o Windows não conectar, verifique se o serviço **WebClient** está iniciado.

## Uso no DAVx5 via CardDAV

Use a URL base:

```text
https://SEU_HOST/carddav
```

Para acesso anônimo, deixe usuário e senha em branco no DAVx5. O plugin usará o usuário interno `anonymous`.

## Administração dos compartilhamentos

Acesse:

```text
https://SEU_HOST/meshdrive
```

Na interface administrativa é possível editar:

- nome do compartilhamento;
- diretório;
- acesso anônimo;
- usuários com leitura;
- usuários com gravação;
- grupos com leitura;
- grupos com gravação.

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


### Debug detalhado 1.2.7

Esta versão de diagnóstico grava logs detalhados com o prefixo:

```text
PLUGIN: Mesh Drive:
```

Os logs incluem autenticação, tenant detectado, pasta do usuário, resolução de `/drive`, compartilhamentos permitidos e requisições CardDAV/WebDAV.

Para acompanhar:

```bash
docker logs -f meshcentral | grep "PLUGIN: Mesh Drive"
```
