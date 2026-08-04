###### 1.2.13
- Adicionado campo Setor no editor de contatos CardDAV.
- Nome completo agora pode ser gerado a partir de Primeiro Nome + Sobrenome + (Setor).
- A listagem de contatos passa a exibir Nome, Setor, Cargo, E-mail, Telefone e Celular.
- O setor é salvo no VCF como X-DEPARTMENT e também é preservado na visualização do Mesh Drive.
- Mantida a correção do warning DEP0169 usando WHATWG URL API.

###### 1.2.12
- Corrigido warning DEP0169 removendo uso de require('url').parse() na rota de contatos.

###### 1.2.11
- Adicionado botão Contatos na barra do Mesh Drive.
- Adicionada tela /meshdrive/contacts para listar, criar, editar e excluir contatos CardDAV em arquivos .vcf.

##### 1.2.10
- Adicionada flag carddav por compartilhamento.
