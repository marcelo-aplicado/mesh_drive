# Changelog

## 2.2.2-test
- Alterado modelo de permissões: removido `access` como configuração principal.
- Adicionados campos `readUsers`, `writeUsers`, `readGroups` e `writeGroups`.
- A interface `/meshdrive` agora possui campos separados para usuários/grupos com leitura e usuários/grupos com gravação.
- Regra aplicada: usuários/grupos em gravação também recebem leitura; usuários/grupos em leitura ficam somente leitura.
- Mantida compatibilidade parcial com shares antigos que usam `access`, `users` e `groups`.
- Mantidas rotas `/drive`, `/shared` e `/meshdrive`.

## 2.2.1-test
- Corrigido salvamento de usuários na interface.
