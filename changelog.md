# Changelog

## 0.4.1
- Corrigida a chamada para `pass.js` do MeshCentral 1.2.1.
- Corrige o crash `TypeError: fn is not a function` após informar usuário e senha no endpoint `/drive`.
- `pass.hash` agora é chamada como `hash(password, salt, null, callback)`.
- A leitura do retorno considera o formato `(err, salt, hash, tag)`.

## 0.4.0
- Ajustado para instalação via GitHub pelo Plugin Manager do MeshCentral.
- `shortName` alterado para `meshdrive`, sem underscore.
- Arquivo principal alterado para `meshdrive.js`.
- Endpoint padrão mantido como `/drive`.
