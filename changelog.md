# Changelog

## 0.4.0
- Ajustado para instalação via GitHub pelo Plugin Manager do MeshCentral.
- URLs atualizadas para `https://github.com/marcelo-aplicado/mesh_drive`.
- `configUrl`, `downloadUrl`, `changelogUrl`, `repository.url` e `versionHistoryUrl` agora apontam para o repositório definitivo.
- `shortName` alterado para `meshdrive`, sem underscore, para seguir o padrão alfanumérico usado por plugins do MeshCentral.
- Arquivo principal alterado para `meshdrive.js`.
- Endpoint padrão mantido como `/drive`.
- Nome público mantido como **Mesh Drive**.

## 0.3.0
- Exportação ajustada para o padrão `module.exports.<shortName> = function(parent) { ... }`.
- Endpoint padrão `/drive`.
