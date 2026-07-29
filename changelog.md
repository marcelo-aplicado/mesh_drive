### 1.2.10
- Debug desabilitado por padrão (debug: false).
- Logs exibidos apenas quando habilitados no config.json do MeshCentral.

## Changelog

### 1.2.8-minlogs
- Substituída a versão de debug detalhado por logs mínimos para reduzir risco de travamento.
- Debug ativado no próprio plugin, sem exigir alteração no config.json do MeshCentral.
- Mantidos logs apenas para tenant, autenticação, pasta pessoal e `PROPFIND` da raiz.
- Mantidas tags completas no `config.json` para instalação pela interface do MeshCentral.

# Changelog

## 1.2.4
- Configuração centralizada em `shares.json` com todos os domínios no mesmo arquivo.
