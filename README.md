# Mesh Drive

O **Mesh Drive** é um plugin para o MeshCentral que adiciona acesso a arquivos por **WebDAV** e sincronização de contatos por **CardDAV**, utilizando a estrutura de arquivos do próprio MeshCentral como armazenamento.

## Recursos

- Acesso WebDAV pela rota `/drive`.
- Sincronização CardDAV pela rota `/carddav`.
- Arquivos pessoais do usuário exibidos na raiz do WebDAV.
- Compartilhamentos adicionais configuráveis por domínio do MeshCentral.
- Permissões de leitura e gravação por usuário e grupo.
- Acesso anônimo opcional por compartilhamento.
- Compartilhamentos marcados como CardDAV separados dos compartilhamentos de arquivos.
- Tela administrativa para configurar compartilhamentos.
- Tela administrativa para listar, pesquisar, criar, editar e excluir contatos VCF.
- Pesquisa de contatos por nome, setor, cargo, empresa, e-mail, telefone, celular e observações.
- Filtro exato por setor, incluindo siglas curtas como `TI`, `RH`, `DP`, `BI` e `QA`.
- Editor de contatos em janela modal.
- Nome corporativo gravado no VCF com o setor no nome completo e no sobrenome estruturado, melhorando a exibição em aplicativos de contatos.

## Rotas

| Rota | Função |
|---|---|
| `/drive` | Acesso WebDAV aos arquivos pessoais e compartilhamentos |
| `/carddav` | Sincronização CardDAV |
| `/meshdrive` | Administração dos compartilhamentos |
| `/meshdrive/contacts` | Administração dos contatos VCF |

As telas `/meshdrive` e `/meshdrive/contacts` exigem um usuário administrador do MeshCentral.

## Requisitos

- MeshCentral com suporte a plugins.
- Plugins habilitados no `config.json` do MeshCentral.
- Permissão de leitura e gravação no diretório de dados e no diretório de arquivos do MeshCentral.
- Serviço ou container do MeshCentral reiniciado após a instalação ou atualização do plugin.
- Para acesso WebDAV pelo Explorador de Arquivos do Windows, o serviço **WebClient** deve estar instalado, configurado e em execução.
- Para sincronização CardDAV, utilize um cliente compatível, como DAVx5 no Android.

## 1. Ativar plugins no MeshCentral

Antes de instalar o Mesh Drive, confirme que o suporte a plugins está ativado no arquivo `config.json` do MeshCentral.

Exemplo:

```json
{
  "settings": {
    "plugins": true
  }
}
```

Após alterar o `config.json`, reinicie o serviço ou container do MeshCentral.

## 2. Instalar pela interface gráfica do MeshCentral

1. Entre no MeshCentral com uma conta administrativa.
2. Abra a área de **Plugins**.
3. Escolha a opção para adicionar ou instalar um plugin por URL.
4. Informe a URL do arquivo `config.json` publicado no repositório do Mesh Drive:

   ```text
   https://raw.githubusercontent.com/marcelo-aplicado/mesh_drive/main/config.json
   ```

5. Confirme a instalação pela interface.
6. Reinicie o serviço ou container do MeshCentral para carregar as rotas do plugin.
7. Entre novamente no MeshCentral e abra **Meus Arquivos**.
8. Verifique se aparecem os botões **Mesh Drive**, **Mapear**, **Compartilhamentos** e **Contatos**.

## 3. Configurar compartilhamentos

Acesse:

```text
https://SEU_HOST/meshdrive
```

Na tela de compartilhamentos é possível configurar:

- nome do compartilhamento;
- diretório físico relativo ao domínio do MeshCentral;
- acesso anônimo;
- usuários com leitura;
- usuários com gravação;
- grupos com leitura;
- grupos com gravação;
- indicação de que o compartilhamento é CardDAV.

A configuração é armazenada no arquivo `shares.json` e pode ser separada por domínio do MeshCentral.

### Exemplo de compartilhamento CardDAV

```json
{
  "name": "Contatos",
  "path": "contatos",
  "readUsers": ["*"],
  "writeUsers": ["marcelo"],
  "readGroups": [],
  "writeGroups": ["TI"],
  "anonymousAccess": "read",
  "carddav": true
}
```

### Valores de acesso anônimo

- `none`: não permite acesso anônimo.
- `read`: permite somente leitura sem autenticação.
- `write`: permite leitura e gravação sem autenticação.

Evite usar `write` em ambientes expostos à internet.

## 4. Acessar pelo Windows

Para utilizar o Mesh Drive no Explorador de Arquivos do Windows, o serviço **WebClient** precisa estar em execução.

### Verificar o WebClient pela interface do Windows

1. Pressione `Win + R`.
2. Digite `services.msc`.
3. Localize o serviço **WebClient**.
4. Abra as propriedades do serviço.
5. Configure o tipo de inicialização conforme a política do ambiente.
6. Inicie o serviço caso esteja parado.

Depois, utilize o endereço:

```text
\\SEU_HOST@SSL\drive
```

Exemplo:

```text
\\mesh.exemplo.com.br@SSL\drive
```

Na tela **Meus Arquivos**, o botão **Mesh Drive** copia o endereço WebDAV e o botão **Mapear** copia um comando PowerShell para localizar uma letra de unidade disponível e realizar o mapeamento.

## 5. Configurar CardDAV

Utilize como endereço base:

```text
https://SEU_HOST/carddav
```

Em um cliente CardDAV compatível:

1. Adicione uma nova conta CardDAV.
2. Informe a URL do servidor.
3. Use as credenciais do MeshCentral quando o compartilhamento exigir autenticação.
4. Se o compartilhamento permitir leitura anônima, o cliente pode ser configurado sem credenciais, quando essa opção for suportada.
5. Conclua a descoberta do catálogo e ative a sincronização.

## 6. Administrar contatos

Acesse:

```text
https://SEU_HOST/meshdrive/contacts
```

O acesso à tela de contatos segue as permissões do compartilhamento CardDAV:

- administradores do MeshCentral podem administrar os catálogos CardDAV;
- usuários informados em writeUsers podem administrar os contatos;
- integrantes dos grupos informados em writeGroups podem administrar os contatos;
- permissões somente em readUsers ou readGroups não liberam a administração.

A tela permite:

- selecionar um catálogo CardDAV;
- pesquisar contatos;
- criar contatos;
- editar contatos em janela modal;
- excluir contatos;
- filtrar por nome, setor, cargo, empresa, e-mail, telefone, celular e observações.

Quando o texto pesquisado corresponde exatamente a um setor, como `TI`, são exibidos somente os contatos daquele setor.

### Campos disponíveis

- Primeiro nome
- Sobrenome
- Setor
- Empresa
- Cargo
- E-mail
- Telefone
- Celular
- Observações

Para melhorar a identificação do colaborador em aplicativos de contatos, o setor também é gravado no nome completo e no sobrenome estruturado do VCF.

Exemplo:

```vcf
FN:Marcelo Silva (TI)
N:Silva (TI);Marcelo;;;
ORG:CRS Brands;TI
X-DEPARTMENT:TI
```

Na lista do Mesh Drive, o nome é mostrado sem o setor, pois o setor já possui uma coluna separada.

## Estrutura do plugin

```text
config.json
meshdrive.js
shares.json
README.md
LICENSE
changelog.md
```

## Atualização

Para atualizar o plugin:

1. Publique os arquivos da nova versão no repositório configurado no `config.json` do plugin.
2. Atualize o plugin pela interface gráfica do MeshCentral ou substitua os arquivos do plugin conforme o procedimento administrativo do ambiente.
3. Preserve o `shares.json` em uso, caso ele contenha configurações personalizadas.
4. Reinicie o serviço ou container do MeshCentral.
5. Valide as rotas `/drive`, `/carddav`, `/meshdrive` e `/meshdrive/contacts`.

## Segurança

- Utilize HTTPS.
- Restrinja gravação aos usuários e grupos necessários.
- Evite acesso anônimo com gravação.
- Mantenha cópia de segurança do `shares.json` e dos diretórios de arquivos e contatos.
- A configuração de compartilhamentos permanece restrita a administradores do MeshCentral.
- A administração de contatos deve ser concedida somente a usuários e grupos confiáveis por meio de writeUsers e writeGroups.
