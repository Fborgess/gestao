# Guia de Deploy — Aplicação Web + Mobile (PWA) na Nuvem

Descritivo com o que é necessário para manter uma aplicação como esta (backend FastAPI + frontend React/Vite PWA + PostgreSQL) rodando na nuvem, acessível em web e mobile.

## 1. Arquitetura da aplicação

- **Backend** (FastAPI/Uvicorn): serve a API e também o app web (PWA).
- **Banco de dados** (PostgreSQL): separado do host, via variável `DATABASE_URL`.
- **HTTPS**: obrigatório para a PWA instalar no celular e funcionar.
- **GitHub**: repositório do código; é a fonte do deploy automático.
- **CI/CD**: o host reconstrói a cada `push` (autoDeploy).

Ponto-chave: para funcionar em web + mobile, o "servidor" precisa estar **ligado 24 h/dia**. O serviço "sempre no ar" é o único item que o plano free não oferece de forma confiável — em qualquer provedor.

## 2. Ferramentas necessárias (stack recomendada)

| Papel | Ferramenta atual | Alternativas |
|---|---|---|
| Código / versão | GitHub | — |
| Host web (backend + frontend) | Render | Railway, Fly.io, Koyeb, PythonAnywhere, DigitalOcean App Platform |
| Banco Postgres | Neon | Supabase, Railway PG, Neon pago |
| SSL / HTTPS | Automático no Render | Cloudflare |
| Domínio próprio (opcional) | `*.onrender.com` | Namecheap / Cloudflare (~US$ 10/ano) |
| Monitoramento de uptime | — | UptimeRobot, Cronitor (grátis até certo volume) |
| Mobile | PWA (instalável via navegador) | Play/App Store só se quiser publicar em loja |

Vantagem: não precisa de app de loja — a PWA instalável pela tela inicial cobre Android e iPhone.

## 3. "Sempre no ar" é o item pago

- **Free**: dorme por inatividade, tem cota de horas/mês, cold start lento, sem escala/backup/SSH. Ótimo para estudo.
- **Pago (mínimo ~US$ 7/mês)**: serviço 24/7, sem suspensão por cota, sem dormência.

Detalhe importante do free (Render): a cota de **~750 horas de instância/mês é por conta e dividida entre os serviços**. Dois serviços no ar esgotam rápido e a conta suspende até o reset mensal. **Suspensão não é falha de código** — o corpo da resposta vem com "Service Suspended".

## 4. Passo a passo para a aplicação ficar no ar (web e mobile)

1. **Repositório** no GitHub com o código.
2. **Cadastro no host** (ex.: Render) -> criar **Web Service** a partir do repo.
3. **Build**: `pip install` (backend) + `npm run build` (frontend) — ex.: num `render.yaml`.
4. **Variáveis de ambiente**: `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` — setadas no painel (nunca no repo).
5. **Banco Postgres** (ex.: Neon) -> connection string com `sslmode=require` -> variável `DATABASE_URL`.
6. **HTTPS automático**: o host emite HTTPS + domínio gratuito (`*.onrender.com`) — pronto para PWA.
7. **Auto-deploy**: a cada `push` o host reconstrói e publica. Para o app carregar sem depender de banner, usar `registerType: 'autoUpdate'` no PWA (vite-plugin-pwa).
8. **Migrações**: o backend deve criar/ajustar tabelas no startup (o próprio código já faz).
9. **Testar no mobile**: abrir a URL no celular -> "Adicionar à tela inicial".
10. **Monitorar**: uptime check apontando para `/api/health`.
11. **Backup**: o banco guarda os dados; adicionar exportação periódica se quiser reforço.

## 5. Cenários de custo

- **US$ 0/mês (estudo)**: host free + banco free. Funciona, mas dorme e pode suspender no fim do mês.
- **~US$ 7/mês (recomendado para uso real)**: host pago mínimo + banco free -> sempre no ar, sem suspensão, sem cold start.
- **~US$ 12 a 20/mês**: host pago + banco sem dormência + domínio próprio -> nível "produção confiável".

## 6. Conclusão

O código não é o gargalo — o custo é o **"ficar ligado"**. Para estudo, o free basta (aceitando intervalos de suspensão). Quando a aplicação importar no dia a dia, o upgrade de ~US$ 7/mês elimina suspensão, cold start e dormência.

## 7. Histórico de incidentes aprendidos (Finanças Pessoais)

- **Suspensão por cota free**: dois serviços web no ar somaram ~752 h/mês contra as 750 h disponíveis -> conta suspensa. Solução sem custo: manter **apenas um serviço** ativo (removeu-se o serviço do segundo app do blueprint, preservando o banco).
- **PWA não atualizava após deploy**: `registerType: 'prompt'` deixava a versão nova "em espera" até tocar em Atualizar. Corrigido com `autoUpdate`.
- **Campos desalinhados no web**: rótulos com botões de altura variável e quebra de colunas só em telas grandes. Corrigido com altura mínima padrão nos labels e colunas responsivas.