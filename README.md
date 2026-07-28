# Mesh Drive

Mesh Drive é um plugin para o MeshCentral que adiciona acesso WebDAV, CardDAV e edição web de contatos `.vcf` sincronizados.

## Recursos

- Rota `/drive` para acesso WebDAV aos arquivos.
- Rota `/carddav` para sincronização de contatos via CardDAV, compatível com DAVx5.
- Rota `/meshdrive` para visualizar e editar compartilhamentos.
- Rota `/meshcontacts` para listar, criar, editar e excluir contatos `.vcf` sincronizados pelo CardDAV.
- Arquivos pessoais exibidos diretamente na raiz do `/drive`.
- Compartilhamentos exibidos como pastas virtuais na raiz do `/drive`.
- Configuração centralizada em um único arquivo `shares.json`.
- Configuração separada por domínio/tenant dentro do mesmo `shares.json`.
- Permissões por usuários e grupos.
- Acesso anônimo por compartilhamento: `none`, `read` ou `write`.
- Logs desligados por padrão.
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
6. Reinicie o MeshCentral.
7. Acesse `/meshdrive` para validar a configuração.
8. Acesse `/meshcontacts` para editar os contatos VCF.

## Estrutura esperada no GitHub

Os arquivos devem ficar na raiz do repositório:

```text
config.json
meshdrive.js
shares.json
README.md
LICENSE
changelog.md
```

O `downloadUrl` do `config.json` aponta para o ZIP do branch `main`:

```text
https://github.com/marcelo-aplicado/mesh_drive/archive/refs/heads/main.zip
```

## Configuração principal: `shares.json`

A versão `1.2.6` usa apenas um arquivo de configuração para todos os domínios:

```text
shares.json
```

Exemplo:

```json
{
  "domains": {
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

A tela permite editar os arquivos `.vcf` gravados no diretório físico do compartilhamento configurado no `shares.json`.

Campos disponíveis:

- nome completo;
- nome;
- sobrenome;
- e-mail;
- telefone;
- celular;
- empresa;
- cargo;
- observações.

## Testes rápidos

Após instalar e reiniciar o MeshCentral, teste:

```text
https://SEU_HOST/meshcontacts/api/books
```

O retorno esperado é JSON, por exemplo:

```json
{
  "tenant": "crsbrands",
  "books": [
    {
      "name": "Contatos",
      "path": "contatos",
      "count": 100
    }
  ]
}
```

Depois teste:

```text
https://SEU_HOST/meshcontacts/api/list?book=Contatos
```

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

## Segurança

- `/meshcontacts` exige usuário administrador do MeshCentral.
- Evite `anonymousAccess: "write"` em ambientes expostos à internet.
- Use `anonymousAccess: "read"` somente para dados que possam ser lidos por qualquer pessoa com acesso à URL.
