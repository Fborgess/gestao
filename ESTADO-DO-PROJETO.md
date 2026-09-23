# ESTADO-DO-PROJETO.md — Rodada encerrada com OK do usuário

> App **Finanças Pessoais** (clone local `C:\dev\meudinheiro`, app rodando em
> `http://localhost:5175`, backend uvicorn `127.0.0.1:8001`).
> Login local do clone: `admin@meudinheiro.com` / `admin123`.

## 🎯 Fechamento da rodada (data: hoje)

O usuário confirmou: **"agora tudo certo!!! Parabéns"** — todas as 4 telas do
menu **Movimentações e Caixa** abrem normalmente. **FECHADO.**

### O que foi entregue nesta rodada
1. **Máscara de moeda pt-BR** no campo Valor (`utils/format.js`:
   `maskCurrencyInput` + `parseCurrencyBR`) — digitar `100000` → `1.000,00`,
   `100` → `1,00`; prefill de edição correto; salva valor numérico real.
2. **Botão calendário/período** no header (`Layout.jsx`) — abre popover com
   setas ◀▶ e `<input type="month">`, sincronizado por `md_period` no
   localStorage + evento `md-period-change`.
3. **ErrorBoundary global** (`components/ErrorBoundary.jsx` + `main.jsx`) —
   erros de runtime agora aparecem **em texto vermelho NA PRÓPRIA TELA** (sem
   depender de F12/console). Vale para sempre.

### Causa da tela branca (crash que travava as telas de caixa)
- **Bug:** no `IncludeTransactionModal.jsx`, a edição da máscara **removeu o
  import de `today`** do `utils/format`, mas o arquivo **chama `today()`** no
  `useState` inicial (`date: today()`). Resultado: `ReferenceError: today is
  not defined` em **runtime** → build passava, mas **as 4 telas de caixa
  (que montam o modal mesmo fechado) abriam em TELA BRANCA**.
- **Correção:** restaurado o import de `today`/`currentMonth` no modal.
  **Build `npm run build` VERDE** confirmado após o fix.

### Validação
- Build verde ✅ · Backend local 8001 de pé ✅ · Vite 5175 de pé ✅
- Usuário validou visualmente: **todas as telas de caixa abrem. OK.**

---
*Repositório de código: clone local `C:\dev\meudinheiro` (não é repo git).*
*Nenhum `.db`/banco foi versionado neste registro.*
