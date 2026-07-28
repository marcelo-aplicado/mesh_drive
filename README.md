# Mesh Drive

Mesh Drive é um plugin para o MeshCentral que adiciona acesso WebDAV, CardDAV e edição web de contatos `.vcf` sincronizados.

## Recursos

- `/drive` para acesso WebDAV aos arquivos.
- `/carddav` para sincronização de contatos via CardDAV, compatível com DAVx5.
- `/meshdrive` para administrar compartilhamentos.
- `/meshcontacts` para listar, criar, editar e excluir contatos `.vcf` sincronizados pelo CardDAV.
- Arquivos pessoais do usuário exibidos diretamente na raiz do `/drive`.
- Compartilhamentos exibidos como pastas virtuais na raiz do `/drive`.
- Configuração centralizada em um único arquivo `shares.json`.
- Configuração por domínio/tenant dentro do mesmo `shares.json`.
- Permissões por usuários e grupos de leitura/gravação.
- Acesso anônimo opcional por compartilhamento: `none`, `read` ou `write`.
- Logs desativados por padrão.
- Proteção contra registro duplicado de rotas.

## Rotas

```text
/drive
/carddav
/meshdrive
/meshcontacts
```

## Requisitos

- MeshCentral com suporte a plugins habilitado.
- Acesso administrativo ao MeshCentral.
- Diretório de dados do MeshCentral com permissão de leitura e gravação.
- Diretório de arquivos do MeshCentral acessível pelo serviço/container, normalmente `meshcentral-files`.
- Para WebDAV no Windows, o serviço **WebClient** do Windows deve estar ativo.
- Para CardDAV no Android, use um cliente compatível, como DAVx5.

## Ativar plugins no MeshCentral

No `config.json` do MeshCentral, confirme que plugins estão habilitados.

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
4. Cole a URL do `config.json` do repositório.
5. Confirme a instalação pela interface.
6. Aguarde o MeshCentral baixar e instalar o plugin.
7. Reinicie o MeshCentral para garantir que as rotas sejam carregadas.
8. Acesse `https://SEU_HOST/meshdrive` para configurar os compartilhamentos.
9. Acesse `https://SEU_HOST/meshcontacts` para editar os contatos VCF.

## Estrutura esperada do plugin

```text
config.json
meshdrive.js
shares.json
README.md
LICENSE
changelog.md
```

## Configuração principal: `shares.json`

A versão `1.2.5` usa apenas um arquivo de configuração para todos os domínios:

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

## Tela de contatos `/meshcontacts`

A tela `/meshcontacts` permite editar os arquivos `.vcf` que ficam dentro dos diretórios configurados como compartilhamentos.

Campos disponíveis na tela:

- nome completo;
- nome;
- sobrenome;
- e-mail;
- telefone;
- celular;
- empresa;
- cargo;
- observações.

A tela grava os contatos novamente em formato vCard `.vcf`, mantendo compatibilidade com a sincronização CardDAV.

## Campos do compartilhamento

### `name`

Nome exibido no `/drive` e usado como address book no `/carddav`.

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

```text
\\SEU_HOST@SSL\drive
```

## Uso no DAVx5 via CardDAV

```text
https://SEU_HOST/carddav
```

Para acesso anônimo, deixe usuário e senha em branco no DAVx5.

## Administração

Compartilhamentos:

```text
https://SEU_HOST/meshdrive
```

Contatos VCF:

```text
https://SEU_HOST/meshcontacts
```

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
- A rota `/meshcontacts` exige usuário administrador do MeshCentral.
