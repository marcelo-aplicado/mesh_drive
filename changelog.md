# Changelog

## 0.4.2
- Removida a dependência direta de `pass.js` para validação de senha.
- A validação agora usa `crypto.pbkdf2` diretamente com SHA384 e 12000 iterações.
- O tamanho do hash é calculado a partir do hash armazenado do usuário, evitando incompatibilidade de assinatura do `pass.hash`.
- Corrige o crash `TypeError: fn is not a function` nas linhas 31 ou 43 do `pass.js`.

## 0.4.1
- Tentativa de ajuste da chamada para `pass.js`.

## 0.4.0
- Ajustado para instalação via GitHub pelo Plugin Manager do MeshCentral.
- `shortName` alterado para `meshdrive`, sem underscore.
- Arquivo principal alterado para `meshdrive.js`.
- Endpoint padrão mantido como `/drive`.
