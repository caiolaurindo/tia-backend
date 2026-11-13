# 📋 Quadro Scrum — Backlog do Backend TIA

Acompanhamento das tarefas pendentes de **segurança**, **regras de negócio** e **integrações**.  
Para atualizar uma tarefa, marque a caixa `[x]` quando concluir, altere o status e informe o responsável.

### Legenda de Status
- `⚪ A fazer` — Não iniciada
- `🟡 Em andamento` — Em desenvolvimento
- `🟣 Em revisão` — Aguardando PR / Code Review
- `🟢 Concluído` — Finalizada e testada

---

## 🟢 Sprint 1 — Nível Baixo (Segurança Básica, Zod e Infraestrutura)

| Done | ID | Tarefa | Status | Responsável | Branch / PR |
| :---: | :---: | :--- | :--- | :--- | :--- |
| [ ] | **T-01** | Exigir `JWT_SECRET` obrigatório em `jwt.util.ts` (remover fallback) | `⚪ A fazer` | `@responsavel` | `fix/jwt-secret` |
| [ ] | **T-02** | Condicionar `synchronize` e `logging` do TypeORM ao `NODE_ENV` em `data-source.ts` | `⚪ A fazer` | `@responsavel` | `chore/typeorm-env` |
| [ ] | **T-03** | Configurar `helmet`, `cors`, limite de JSON, rota `404` e logs HTTP (`morgan`/`pino-http`) em `app.ts` | `⚪ A fazer` | `@responsavel` | `feat/http-security` |
| [ ] | **T-04** | Adicionar Rate Limiting (`express-rate-limit`) em `/auth/login`, `/auth/cadastro` e API geral | `⚪ A fazer` | `@responsavel` | `feat/rate-limit` |
| [ ] | **T-05** | Expandir `validarRequisicao` (Zod) para validar `params`, `query` e `body.strict()` | `⚪ A fazer` | `@responsavel` | `feat/zod-params-query` |
| [ ] | **T-06** | Padronizar schemas Zod (senha `max(72)`, formato único de datas e `dataNascimento` não futura) | `⚪ A fazer` | `@responsavel` | `fix/zod-schemas` |
| [ ] | **T-07** | Tratar `QueryFailedError` (MySQL) e `MulterError` no `error.middleware.ts` | `⚪ A fazer` | `@responsavel` | `feat/error-handlers` |

---

## 🟡 Sprint 2 — Nível Médio (RBAC, Regras de Negócio e Relatórios)

| Done | ID | Tarefa | Status | Responsável | Branch / PR |
| :---: | :---: | :--- | :--- | :--- | :--- |
| [ ] | **T-08** | Implementar RBAC: adicionar `role` (`PROFESSOR`, `COORDENADOR`, `ADMIN`) e `ativo` na entidade/JWT + middleware `autorizar` | `⚪ A fazer` | `@responsavel` | `feat/rbac` |
| [ ] | **T-09** | Corrigir IDOR em `/conquistas` (vincular a `professorId` ou restringir catálogo global a `ADMIN`/`COORDENADOR`) | `⚪ A fazer` | `@responsavel` | `fix/conquista-idor` |
| [ ] | **T-10** | Adicionar paginação (`page`, `limit`) e filtros com Zod em todas as rotas `GET /` | `⚪ A fazer` | `@responsavel` | `feat/paginacao` |
| [ ] | **T-11** | Inicializar `AlunoConquista` (`NAO_TRABALHADO`) automaticamente ao matricular aluno ou vincular conquista à turma | `⚪ A fazer` | `@responsavel` | `feat/init-metas-aluno` |
| [ ] | **T-12** | Permitir `Registro` avulso (sem `aulaId` obrigatório) e conectar `Registro` à atualização de `AlunoConquista` | `⚪ A fazer` | `@responsavel` | `feat/registro-progresso` |
| [ ] | **T-13** | Criar tabela/log de histórico de evolução das conquistas (sem sobrescrever o passado) | `⚪ A fazer` | `@responsavel` | `feat/historico-conquistas` |
| [ ] | **T-14** | Criar endpoints de relatório/comparativo (metas do ano e da aula vs. progresso do aluno) | `⚪ A fazer` | `@responsavel` | `feat/relatorio-comparativo` |

---

## 🔴 Sprint 3 — Nível Alto (Sessão, Importação de Arquivos e IA)

| Done | ID | Tarefa | Status | Responsável | Branch / PR |
| :---: | :---: | :--- | :--- | :--- | :--- |
| [ ] | **T-15** | Implementar Refresh Token e Logout com rotação/revogação (`/auth/refresh`, `/auth/logout`) | `⚪ A fazer` | `@responsavel` | `feat/refresh-token` |
| [ ] | **T-16** | Importação em lote de alunos por CSV/XLSX/PDF (upload seguro, sanitização, validação Zod e transação) | `⚪ A fazer` | `@responsavel` | `feat/importar-alunos` |
| [ ] | **T-17** | Transcrição de áudio + preenchimento automático por IA (STT + LLM com validação Zod para `Registro` e `AlunoConquista`) | `⚪ A fazer` | `@responsavel` | `feat/audio-ia` |

---

### 💡 Exemplo de preenchimento em andamento
```markdown
| [ ] | **T-01** | Exigir `JWT_SECRET` obrigatório em `jwt.util.ts` | `🟡 Em andamento` | `@caio` | `fix/jwt-secret` |
| [x] | **T-02** | Condicionar `synchronize` e `logging` ao `NODE_ENV` | `🟢 Concluído` | `@yasmin` | `PR #15` |
```
