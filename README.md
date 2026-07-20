# MeshCentral Mesh Branding

Plugin para aplicar **logotipo, título, favicon, cores e texto de apoio por subdomínio** em uma única instalação do MeshCentral.

Repositório esperado:

```text
marcelo-aplicado/mesh_branding
```

URL de instalação pela interface gráfica do MeshCentral:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_branding/main/config.json
```

## Cenário atendido

Vários subdomínios apontando para a mesma instância MeshCentral e para a mesma base de dados, sem Multi-Tenant:

- `mesh.aplicado.com.br`
- `mesh.fastcopy.net.br`
- `mesh.crsbrands.com.br`
- `mesh.mhs.tec.br`

A separação de acesso continua sendo feita pelas permissões de usuários e grupos de dispositivos do MeshCentral. Este plugin altera apenas a identidade visual exibida no navegador.

## Estrutura

```text
mesh_branding/
├── assets/
│   ├── favicons/
│   └── logos/
├── brand-config.json
├── CHANGELOG.md
├── config.json
├── mesh_branding.js
├── LICENSE
└── README.md
```

## Configuração das marcas

Edite `brand-config.json`:

```json
{
  "defaultBrand": "mesh.aplicado.com.br",
  "options": {
    "applyFavicon": true,
    "applyDocumentTitle": true,
    "applyHeaderTitle": true,
    "applyLogo": true,
    "createFallbackBadge": true,
    "debug": false
  },
  "domains": {
    "mesh.aplicado.com.br": {
      "title": "Aplicado Mesh",
      "title2": "Aplicado",
      "logo": "/plugins/mesh_branding/assets/logos/aplicado.svg",
      "favicon": "/plugins/mesh_branding/assets/favicons/aplicado.svg",
      "primaryColor": "#2563eb",
      "accentColor": "#0f172a",
      "supportText": "Ambiente principal"
    }
  }
}
```

## Instalação no MeshCentral

### 1. Ative plugins no MeshCentral

No `config.json` do MeshCentral, em `settings`:

```json
{
  "settings": {
    "plugins": {
      "enabled": true
    }
  }
}
```

Reinicie o MeshCentral após alterar essa configuração.

### 2. Publique este projeto no GitHub

O repositório deve ser:

```text
https://github.com/marcelo-aplicado/mesh_branding
```

### 3. Instale pela interface gráfica

No MeshCentral:

```text
My Server -> Plugins -> Download plugin
```

Informe exatamente:

```text
https://raw.githubusercontent.com/marcelo-aplicado/mesh_branding/main/config.json
```

Depois habilite o plugin.

## Atualização

1. Altere `brand-config.json`, logos ou o código.
2. Incremente a versão no `config.json`.
3. Faça commit e push no GitHub.
4. Atualize o plugin pela interface do MeshCentral.

## Teste rápido

Acesse os subdomínios e confira título, favicon e identidade visual.

No console do navegador, você pode reaplicar manualmente:

```javascript
window.meshBrandingApply && window.meshBrandingApply();
```

## Licença

MIT
