# Changelog

## 2.1.3-test
- Rota da interface administrativa alterada de `/meshdrive/shares` para `/meshdrive`.
- Adicionado botão `Compartilhamentos` na tela **Meus Arquivos** para abrir a interface `/meshdrive`.
- Mantida a rota WebDAV `/drive` sem integração com compartilhamentos, preservando compatibilidade com Windows WebDAV.

## 2.1.2-test
- Versão de teste segura: a rota WebDAV `/drive` permanece igual à base estável, sem integração com compartilhamentos.
- Adicionada somente a interface administrativa `/meshdrive/shares`.
- Adicionado arquivo `plugins/meshdrive/shares.json` para CRUD de compartilhamentos futuro.
- Essa versão serve para validar a interface e o salvamento do `shares.json` sem afetar o WebDAV do Windows.

## 1.2.4
- Versão estável com Multi-Tenancy e autenticação nativa do MeshCentral.
