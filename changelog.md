# Changelog

## 2.4.7-test
- Removida a opção de ícone da interface `/meshdrive` e do JSON padrão.
- Removida a criação de arquivos `.ico` e `desktop.ini`.
- Removido o compartilhamento padrão `Public`.
- Configuração padrão alterada para conter apenas o compartilhamento `Contatos`.
- Incluídos arquivos padrão para múltiplos tenants: `shares-domain.json`, `shares-crsbrands.json`, `shares-mhs.json` e `shares-fastcopy.json`.
- Mantido `/drive` com arquivos pessoais diretamente na raiz e compartilhamentos como pastas virtuais.
- Mantido `/carddav` separado e funcional.
- Mantidas proteções de estabilidade: logs desligados por padrão, trava de handlers e limite de CardDAV REPORT.

## 2.4.6-test
- Tentativa de ícones via `desktop.ini` e `.ico`.
