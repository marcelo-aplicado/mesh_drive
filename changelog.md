####### 1.2.24
- Botões Mesh Drive, Mapear, Compartilhamentos e Contatos exibidos dinamicamente conforme permissões.
- Catálogos em readUsers/readGroups agora abrem em modo somente leitura.
- No modo leitura, inclusão, edição, salvamento e exclusão ficam indisponíveis.
- Mantidas a resolução automática de grupos e a validação de Administrador Completo.

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
