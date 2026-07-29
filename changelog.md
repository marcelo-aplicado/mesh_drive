#### 1.2.10
- Adicionada flag `carddav` por compartilhamento.
- Compartilhamentos com `carddav: true` aparecem somente na rota `/carddav`.
- Compartilhamentos sem `carddav` ou com `carddav: false` aparecem somente na rota `/drive`.
- Adicionada opção CardDAV na tela administrativa de compartilhamentos.
- Mantida a versão estável sem emissão de logs no console.

### Final sem logs
- Removida a emissão de logs do plugin para evitar poluição no console do MeshCentral.
- Mantida a versão funcional enviada pelo usuário, sem alterar o fluxo WebDAV/CardDAV.
- `debug` definido como `false` por padrão e `function log(){}` aplicada no `meshdrive.js`.

## Changelog

### 1.2.8-minlogs
- Substituída a versão de debug detalhado por logs mínimos para reduzir risco de travamento.
- Debug ativado no próprio plugin, sem exigir alteração no config.json do MeshCentral.
- Mantidos logs apenas para tenant, autenticação, pasta pessoal e `PROPFIND` da raiz.
- Mantidas tags completas no `config.json` para instalação pela interface do MeshCentral.

# Changelog

## 1.2.4
- Configuração centralizada em `shares.json` com todos os domínios no mesmo arquivo.
