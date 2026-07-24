# Changelog

## 2.2.0-test
- Adicionada rota WebDAV experimental `/shared` para os compartilhamentos configurados em `plugins/meshdrive/shares.json`.
- A rota WebDAV estável `/drive` permanece sem alterações, preservando compatibilidade com Windows WebDAV.
- A interface administrativa permanece em `/meshdrive`.
- `read` permite leitura e bloqueia escrita; `write` permite leitura e gravação.
- Mantido suporte Multi-Tenancy e autenticação nativa do MeshCentral.

## 2.1.3-test
- Interface administrativa movida para `/meshdrive`.
- Botão `Compartilhamentos` adicionado em **Meus Arquivos**.

## 1.2.4
- Base estável com WebDAV, Multi-Tenancy e autenticação nativa do MeshCentral.
