# Regras do projeto

## Toda alteração deve subir para a nuvem

Toda alteração feita em código deve ser publicada na nuvem (commit + push). Sempre que concluir uma alteração:

1. **Frontend**: rodar `npm run build` (na pasta `financas-pessoais/frontend`) e validar o build.
2. **Commit** apenas os arquivos relevantes (nunca incluir `.db`/bancos de dados no commit).
3. **Push** para `origin/main` — o Render (autoDeploy) reimplanta sozinho.
4. **Verificar** a nova versão no ar em `https://financas-pessoais-3udv.onrender.com` antes de encerrar.

## Testes

Rodar os testes antes de concluir uma alteração que mexa no backend ou em utils do frontend:

- **Backend** (na pasta `financas-pessoais/backend`): `python -m pytest tests -v` (usa SQLite isolado em TMP; credenciais de dev no `.venv`). Dependências de teste ficam em `backend/requirements-dev.txt` (`pip install -r requirements-dev.txt`), fora do `requirements.txt` de produção.
- **Frontend** (na pasta `financas-pessoais/frontend`): `npm run test` (vitest, testes unitários de utils/masks/permissões).
- A suíte guarda regressões como a quebra da página de Transações (uso de estado antes da declaração) e regras do backend (transação paga não pode ser editada até cancelar o pagamento).

## Deploy / infra

- **App**: Finanças Pessoais — `financas-pessoais/` (repo `Fborgess/financas-pessoais`).
- **Produção**: Render web service `financas-pessoais` → `https://financas-pessoais-3udv.onrender.com`.
- **Banco de dados de produção**: PostgreSQL **Neon** (projeto `org-bitter-term-46439512`), definido via `DATABASE_URL` no Render (connection string Direct, termina com `?sslmode=require`).
- O SQLite local (`financas-pessoais/backend/financas.db`) é **só desenvolvimento** — os dados reais ficam na nuvem (Neon).
- Acesso para consultar a produção via API: login `admin@financas.com` / `admin123` (JWT) em `/api/auth/login`, depois usar `Authorization: Bearer <token>`.
- O build injeta um marcador de versão (data + hash do commit), então o hash do bundle difere entre builds locais e do Render — para confirmar que o deploy subiu, verificar o **conteúdo** (nova lógica presente no bundle servido), não só o nome do arquivo.
- Repositório raiz (Sistema de Gestão): repo `Fborgess/gestao` — também deve ter alterações commitadas/enviadas.
