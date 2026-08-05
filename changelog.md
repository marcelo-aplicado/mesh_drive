####### 1.2.25
- Telefones e celulares são normalizados automaticamente no formato internacional brasileiro +55.
- Aceita números com máscara, código do país, zero inicial e código de operadora, incluindo Vivo 15.
- Validação de DDD + 8 dígitos para telefone fixo e DDD + 9 dígitos para celular.
- Campos vazios continuam permitidos.
- Mantida integralmente a base estável 1.2.24.

####### 1.2.24
- readUsers e readGroups agora podem abrir e consultar os catálogos CardDAV em modo somente leitura.
- No modo leitura, Novo contato, Salvar e Excluir ficam ocultos e o modal usa campos somente leitura.
- Gravação e exclusão continuam protegidas no backend e exigem writeUsers, writeGroups ou Administrador Completo.
- Nenhuma alteração foi feita nos botões do MeshCentral, WebDAV, CardDAV ou autenticação.

####### 1.2.23
- Corrigida a validação de administrador do MeshCentral.
- /meshdrive agora exige siteadmin exatamente 0xFFFFFFFF (Administrador Completo).
- Permissões parciais como Arquivos do Servidor não concedem mais administração do plugin.
- Mantidas as permissões de contatos por writeUsers/writeGroups e resolução automática de grupos da 1.2.22.

####### 1.2.20
- Corrigido o filtro para pesquisar somente nos valores dos contatos, sem considerar nomes internos de propriedades como title.
- Quando a pesquisa corresponde exatamente a um setor, como TI ou RH, a lista mostra somente contatos daquele setor.
- Mantido o filtro geral por nome, cargo, empresa, e-mail, telefone, celular e observações.

####### 1.2.19
- O filtro da lista de contatos agora é aplicado a partir de 2 caracteres.
- Setores curtos como TI, RH, DP, BI e QA podem ser pesquisados.
- O texto de ajuda do campo de pesquisa foi atualizado.

####### 1.2.18
- A lista de contatos agora exibe somente Primeiro Nome + Sobrenome na coluna Nome.
- O setor permanece em coluna separada.
- Ocultados do modal os campos apenas informativos Nome completo gerado e Sobrenome gravado no VCF.
- Mantida a gravação do setor no FN e no sobrenome estruturado N.

####### 1.2.17
- Corrigido o botão Editar com filtro ativo usando o arquivo VCF como identificador estável.
- Editor de contatos transformado em modal centralizado.
- Modal fecha pelo botão X, Cancelar, clique fora ou tecla Esc.

####### 1.2.16
- Corrigido script da tela de contatos para a lista voltar a carregar.
- Mantida a gravação do setor no FN e no sobrenome estruturado N.
- Base preserva o fluxo de listagem /meshdrive/contacts/list.

####### 1.2.15
- Ajustado salvamento do setor para melhorar a exibição no Samsung Contacts.
- O VCF agora grava o setor no nome completo FN e também no sobrenome estruturado N.
- Exemplo gerado: FN:Marcelo Silva (TI) e N:Silva (TI);Marcelo;;;
- Mantido X-DEPARTMENT e ORG:Empresa;Setor.

####### 1.2.14
- Adicionado campo Setor e nome completo gerado como Primeiro Nome + Sobrenome + (Setor).
