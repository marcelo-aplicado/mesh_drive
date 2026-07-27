# Changelog

## 2.4.4-test
- Ajustada a lógica do `/drive` para manter os arquivos pessoais diretamente na raiz, como no comportamento original.
- Compartilhamentos permitidos continuam aparecendo na raiz como pastas virtuais adicionais.
- Corrigido tratamento de `PROPFIND Depth: 0` na raiz do `/drive`.
- Mantida compatibilidade com Windows WebDAV, evitando a pasta virtual `Pessoal`.
- Mantido CardDAV em `/carddav` sem alteração de arquitetura.
- Mantidas proteções da 2.4.2: logs desativados por padrão, trava contra duplicação de handlers e limite de itens no CardDAV.
- Arquivo padrão `shares-domain.json` atualizado com `Contatos`, diretório `contatos`, leitura `*`, gravação `marcelo`, grupo de gravação `TI` e acesso anônimo somente leitura.

## 2.4.3-test
- Tentativa de colocar arquivos pessoais na raiz do `/drive`.
