## Mesh Drive

Plugin para MeshCentral com WebDAV, CardDAV e editor de contatos VCF.

### Recursos
- `/drive` para WebDAV.
- `/carddav` para CardDAV.
- `/meshdrive` para administrar compartilhamentos.
- `/meshdrive/contacts` para listar, criar, editar e excluir contatos VCF.
- Campo Setor para agenda corporativa.
- Ao salvar, o setor é gravado no `FN`, no sobrenome estruturado `N`, em `X-DEPARTMENT` e no segundo nível de `ORG`.

### Exemplo de VCF gerado

```vcf
FN:Marcelo Silva (TI)
N:Silva (TI);Marcelo;;;
ORG:CRS Brands;TI
X-DEPARTMENT:TI
```
