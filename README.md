## Mesh Drive

Mesh Drive é um plugin para o MeshCentral que adiciona acesso WebDAV e CardDAV usando os arquivos do próprio MeshCentral como backend.

### Recursos
- Rota `/drive` para acesso WebDAV a arquivos.
- Rota `/carddav` para sincronização de contatos em clientes compatíveis com CardDAV, como DAVx5.
- Rota administrativa `/meshdrive` para cadastrar e editar compartilhamentos.
- Rota `/meshdrive/contacts` para listar, criar, editar e excluir contatos CardDAV armazenados em `.vcf`.
- Editor de contatos corporativo com Primeiro Nome, Sobrenome, Setor, Empresa, Cargo, E-mail, Telefone, Celular e Observações.
- O Nome Completo pode ser gerado como `Primeiro Nome + Sobrenome + (Setor)` para aparecer assim no celular.
- Configuração centralizada em `shares.json`, separada por domínio/tenant.
- Permissões por usuários e grupos de leitura/gravação.
- Acesso anônimo opcional por compartilhamento: `none`, `read` ou `write`.
- Logs desativados por padrão.

### Rotas
- `/drive`
- `/carddav`
- `/meshdrive`
- `/meshdrive/contacts`

### Instalação
Ative plugins no `config.json` do MeshCentral:

```json
{
  "settings": {
    "plugins": true
  }
}
```

Depois instale pela interface de plugins usando o `config.json` do repositório e reinicie o MeshCentral.

### Uso dos contatos
Acesse `/meshdrive/contacts` com usuário administrador. Os contatos são carregados dos compartilhamentos com `carddav: true`.

No editor, preencha Primeiro Nome, Sobrenome e Setor. O plugin usa esses dados para salvar o campo `FN` do VCF no formato:

```text
Nome Sobrenome (Setor)
```

Também salva o setor em `X-DEPARTMENT`, mantendo o contato mais útil para catálogo corporativo.
