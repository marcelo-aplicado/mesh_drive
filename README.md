# Mesh Drive

Mesh Drive é um plugin para MeshCentral com WebDAV, CardDAV, compartilhamentos configurados em `shares.json` e editor web de contatos VCF.

## Recursos

- `/drive`: acesso WebDAV aos arquivos.
- `/carddav`: sincronização CardDAV para DAVx5 e clientes compatíveis.
- `/meshdrive`: administração de compartilhamentos.
- `/meshcontacts`: editor web de contatos `.vcf`.
- Arquivos pessoais exibidos diretamente na raiz do `/drive`.
- Compartilhamentos exibidos como pastas virtuais, como `Contatos`.
- Configuração única em `shares.json`, com múltiplos domínios dentro do mesmo arquivo.
- Botões no My Files: `Mesh Drive`, `Mapear`, `Compartilhamentos` e `Contatos`.

## Ajuste importante da versão 1.2.8

A raiz do `/drive` agora exige autenticação. Isso evita que o Windows WebDAV entre como anônimo e mostre apenas compartilhamentos públicos, como `Contatos`. Após autenticar, a raiz mostra os arquivos pessoais e adiciona os compartilhamentos como pastas virtuais.

## Instalação pela interface do MeshCentral

Use a URL do `config.json` do repositório:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
```

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

## Testes rápidos

Após atualizar e reiniciar o MeshCentral, valide:

```text
https://SEU_HOST/meshcontacts/api/books
```

E no Windows WebDAV:

```text
\\SEU_HOST@SSL\drive
```

O esperado é ver os arquivos pessoais na raiz e a pasta virtual `Contatos`.

## Configuração

A configuração de compartilhamentos fica no arquivo:

```text
shares.json
```

Exemplo de compartilhamento:

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

## Segurança

A rota `/meshcontacts` exige usuário administrador do MeshCentral. Evite `anonymousAccess: "write"` em ambientes expostos à internet.
