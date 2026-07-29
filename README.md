# Mesh Drive

Mesh Drive é um plugin para o MeshCentral que adiciona acesso WebDAV, CardDAV e edição web de contatos `.vcf` sincronizados.

## Recursos

- `/drive` para acesso WebDAV aos arquivos.
- `/carddav` para sincronização de contatos via CardDAV, compatível com DAVx5.
- `/meshdrive` para visualizar/configurar compartilhamentos.
- `/meshcontacts` para listar, criar, editar e excluir contatos `.vcf` sincronizados pelo CardDAV.
- Configuração centralizada em um único arquivo `shares.json`.
- Configuração por domínio/tenant dentro do mesmo `shares.json`.
- Permissões por usuários e grupos.
- Acesso anônimo por compartilhamento: `none`, `read` ou `write`.

## Correção da versão 1.2.6

A versão `1.2.6` corrige a rota da API do editor de contatos.

Em alguns cenários, quando o Express monta a rota `/meshcontacts`, o `req.url` chega ao handler como:

```text
/api/books
```

em vez de:

```text
/meshcontacts/api/books
```

A versão `1.2.6` aceita os dois formatos, fazendo com que:

```text
/meshcontacts/api/books
/meshcontacts/api/list
/meshcontacts/api/get
/meshcontacts/api/save
/meshcontacts/api/delete
```

retornem JSON corretamente.

## Rotas

```text
/drive
/carddav
/meshdrive
/meshcontacts
```

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

## Configuração principal: `shares.json`

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

## Segurança

- `/meshcontacts` exige usuário administrador do MeshCentral.
- Evite `anonymousAccess: "write"` em ambientes expostos à internet.
- Use `anonymousAccess: "read"` somente para dados que possam ser lidos por qualquer pessoa com acesso à URL.
