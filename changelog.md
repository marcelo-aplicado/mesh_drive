# Changelog

## 0.5.0
- Adicionada página de lançamento em `/meshdrive/launcher`.
- Adicionados botões e instruções para abrir ou mapear o Mesh Drive no Windows, Linux e macOS.
- Adicionada detecção de sistema operacional pelo navegador.
- Adicionado botão/atalho visual `Mesh Drive` na interface web do MeshCentral, com tentativa de integração na área de My Files e fallback em Account Actions.
- Adicionados downloads dinâmicos de scripts para Windows, Linux e macOS.

## 0.4.2
- Removida a dependência direta de `pass.js` para validação de senha.
- A validação agora usa `crypto.pbkdf2` diretamente com SHA384 e 12000 iterações.
- Corrige o crash `TypeError: fn is not a function` nas linhas 31 ou 43 do `pass.js`.

## 0.4.0
- Ajustado para instalação via GitHub pelo Plugin Manager do MeshCentral.
- `shortName` alterado para `meshdrive`, sem underscore.
- Arquivo principal alterado para `meshdrive.js`.
- Endpoint padrão mantido como `/drive`.
