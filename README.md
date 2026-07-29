# Mesh Drive

Mesh Drive expõe arquivos pessoais e compartilhamentos em uma única rota WebDAV:

```text
\\<HOSTNAME>@SSL\drive
```

## Estrutura no WebDAV

Ao acessar `/drive`, o usuário verá:

```text
Pessoal
Public
TI
Financeiro
```

- `Pessoal`: área privada do usuário autenticado.
- Demais pastas: compartilhamentos permitidos pelo arquivo de configuração do tenant.

## Interface administrativa

```text
https://<HOSTNAME>/meshdrive
```

## Configuração por tenant

Exemplos:

```text
meshcentral-data/plugins/meshdrive/shares-domain.json
meshcentral-data/plugins/meshdrive/shares-crsbrands.json
```

## Modelo de permissões

```json
{
  "shares": [
    {
      "name": "Public",
      "path": "public",
      "readUsers": ["*"],
      "writeUsers": ["marcelo"],
      "readGroups": [],
      "writeGroups": []
    }
  ]
}
```

- `readUsers`: usuários com leitura.
- `writeUsers`: usuários com gravação. Gravação também implica leitura.
- `readGroups`: grupos com leitura.
- `writeGroups`: grupos com gravação. Gravação também implica leitura.
- Use `*` em `readUsers` para liberar leitura para todos os usuários autenticados.
