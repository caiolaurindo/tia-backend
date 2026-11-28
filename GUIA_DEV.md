# Arquitetura do Backend e Guia do Desenvolvedor — TIA (Projeto PI4)

Este documento atua como o manual técnico oficial para o backend da plataforma de acompanhamento de alunos de inglês. Ele detalha os padrões arquiteturais, a estrutura de pastas, o funcionamento das abstrações genéricas, utilitários e o fluxo padronizado para a criação de novos módulos de domínio.

---

## 1. Visão Geral da Arquitetura

O backend adota o padrão **MVC Adaptado para Express com Módulos de Domínio**. A aplicação é dividida em três pilares principais:

```plaintext
src/
├── common/             # Núcleo genérico, middlewares, utilitários e tipagens transversais
│   ├── base/           # Abstrações reaproveitáveis (Entity, Service, Controller Factory)
│   ├── middlewares/    # Middlewares do Express (Erros, Validação Zod, Autenticação JWT)
│   ├── types/          # Extensões de tipo do TypeScript (Express Request)
│   └── utils/          # Classes utilitárias (AppError, catchAsync, JwtUtil)
├── data/               # Configuração do TypeORM (PostgreSQL/NeonDB) e migrations
├── modules/            # Módulos de domínio funcional (Professor, Turma, Aluno, etc.)
├── app.ts              # Configuração da aplicação Express, middlewares e rotas
└── server.ts           # Ponto de entrada da aplicação e inicialização do servidor/banco
```

### Princípios Norteadores

- **Separação de Responsabilidades (SRP):** o `server.ts` cuida da infraestrutura (conexão e portas), enquanto o `app.ts` orquestra as rotas e middlewares.
- **DRY (Don't Repeat Yourself):** operações básicas de CRUD e auditoria são herdadas das abstrações da pasta `common/base`.
- **Tratamento Centralizado de Erros:** exceções conhecidas (`AppError`) e assíncronas são capturadas e formatadas por um middleware global.

---

## 2. Núcleo Genérico (`src/common/base`)

O núcleo genérico reduz a duplicidade de código para entidades que utilizam operações padrão de banco de dados.

### 2.1 `EntidadeGenerica` (`base.entity.ts`)

Classe abstrata da qual todas as entidades do TypeORM devem herdar. Centraliza a chave primária auto-incremental e as colunas de auditoria automática.

```typescript
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class EntidadeGenerica {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;
}
```

**Como usar:** estenda essa classe na sua entidade de domínio.

```typescript
@Entity('turma')
export class Turma extends EntidadeGenerica { ... }
```

### 2.2 `ServiceGenerico<T>` (`base.service.ts`)

Classe genérica parametrizada pelo tipo da entidade que encapsula os métodos básicos de persistência do TypeORM: `listarTodos()`, `buscarPorId(id)`, `criar(dados)`, `atualizar(id, dados)` e `remover(id)`.

```typescript
import { Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { AppError } from '../utils/app-error';

export abstract class ServiceGenerico<T extends { id: number }> {
  protected constructor(protected readonly repositorio: Repository<T>) {}

  async listarTodos(): Promise<T[]> {
    return this.repositorio.find();
  }

  async buscarPorId(id: number): Promise<T> {
    const entidade = await this.repositorio.findOneBy({ id } as FindOptionsWhere<T>);
    if (!entidade) {
      throw new AppError(`Registro com id ${id} não encontrado.`, 404);
    }
    return entidade;
  }

  async criar(dados: DeepPartial<T>): Promise<T> {
    const entidade = this.repositorio.create(dados);
    return this.repositorio.save(entidade);
  }

  async atualizar(id: number, dados: DeepPartial<T>): Promise<T> {
    await this.buscarPorId(id);
    await this.repositorio.update(id, dados as any);
    return this.buscarPorId(id);
  }

  async remover(id: number): Promise<void> {
    await this.buscarPorId(id);
    await this.repositorio.delete(id);
  }
}
```

**Como usar:** crie o serviço da sua entidade herdando do `ServiceGenerico` e repasse o repositório no construtor.

```typescript
export class TurmaService extends ServiceGenerico<Turma> {
  constructor(repositorio: Repository<Turma>) {
    super(repositorio);
  }
}
```

### 2.3 `criarRouterGenerico` (`base.controller.ts`)

Gerador de rotas (Factory) para cadastros simples que utilizam operações de CRUD diretas sem regras complexas adicionais.

```typescript
import { Router, Request, Response } from 'express';
import { ServiceGenerico } from './base.service';
import { catchAsync } from '../utils/catch-async';

export function criarRouterGenerico<T extends { id: number }>(servico: ServiceGenerico<T>): Router {
  const router = Router();

  router.get('/', catchAsync(async (req: Request, res: Response) => {
    res.json(await servico.listarTodos());
  }));

  router.get('/:id', catchAsync(async (req: Request, res: Response) => {
    res.json(await servico.buscarPorId(Number(req.params.id)));
  }));

  router.post('/', catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await servico.criar(req.body));
  }));

  router.put('/:id', catchAsync(async (req: Request, res: Response) => {
    res.json(await servico.atualizar(Number(req.params.id), req.body));
  }));

  router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
    await servico.remover(Number(req.params.id));
    res.status(204).send();
  }));

  return router;
}
```

---

## 3. Utilitários, Validação e Segurança

### 3.1 Tratamento Operacional de Erros

- **`AppError`** (`src/common/utils/app-error.ts`): exceção customizada para interrupções controladas, informando a mensagem e o código HTTP (ex.: 400, 401, 404).
- **`catchAsync`** (`src/common/utils/catch-async.ts`): envolve chamadas assíncronas no Express para encaminhar qualquer exceção ao middleware global, sem a necessidade de blocos `try/catch` manuais nos controllers.
- **`manipuladorDeErros`** (`src/common/middlewares/error.middleware.ts`): middleware registrado ao fim do `app.ts`. Formata erros do tipo `AppError` ou converte erros inesperados para HTTP 500 em formato JSON legível.

### 3.2 Validação de Dados (Zod)

- **`validarRequisicao`** (`src/common/middlewares/validation.middleware.ts`): middleware que intercepta `req.body`, valida contra um schema Zod e lança `AppError` contendo as inconsistências caso a validação falhe.

### 3.3 Segurança e Isolamento por Usuário

- **`JwtUtil`** (`src/common/utils/jwt.util.ts`): responsável por gerar e verificar tokens JWT com chave secreta e tempo de expiração definidos no `.env`.
- **`autenticar`** (`src/common/middlewares/auth.middleware.ts`): middleware *guard* aplicado às rotas privadas. Extrai o cabeçalho `Authorization: Bearer <token>`, valida a assinatura e injeta os dados do professor autenticado dentro de `req.usuario` (`{ sub: id, email }`).

---

## 4. Guia Prático: Como Criar um Novo Módulo de Domínio

Para adicionar uma nova funcionalidade (ex.: Módulo de Turmas), siga a checklist abaixo.

### Passo 1: Criar a pasta do módulo

Crie o diretório em `src/modules/<nome-do-modulo>`.

### Passo 2: Definir a Entidade (`.entity.ts`)

Crie a classe de entidade estendendo `EntidadeGenerica`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Professor } from '../professor/professor.entity';

@Entity('turma')
export class Turma extends EntidadeGenerica {
  @Column()
  nome!: string;

  @Column()
  serie!: string;

  @Column({ name: 'ano_letivo' })
  anoLetivo!: number;

  @ManyToOne(() => Professor)
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;
}
```

### Passo 3: Definir os Schemas de Validação (`.schema.ts`)

Crie os schemas Zod para entrada de dados:

```typescript
import { z } from 'zod';

export const criarTurmaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  serie: z.string().min(1, 'Série é obrigatória'),
  anoLetivo: z.number().int().positive('Ano letivo inválido'),
});

export type CriarTurmaDTO = z.infer<typeof criarTurmaSchema>;
```

### Passo 4: Criar o Service (`.service.ts`)

Crie o serviço estendendo o `ServiceGenerico` e insira regras de negócio específicas quando aplicável:

```typescript
import { Repository } from 'typeorm';
import { Turma } from './turma.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarTurmaDTO } from './turma.schema';

export class TurmaService extends ServiceGenerico<Turma> {
  constructor(repositorio: Repository<Turma>) {
    super(repositorio);
  }

  async criarParaProfessor(dados: CriarTurmaDTO, professorId: number) {
    return this.criar({
      ...dados,
      professor: { id: professorId } as any,
    });
  }
}
```

### Passo 5: Criar o Controller (`.controller.ts`)

Crie as rotas montando a cadeia de middlewares (`autenticar` → `validarRequisicao` → `catchAsync`):

```typescript
import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Turma } from './turma.entity';
import { TurmaService } from './turma.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarTurmaSchema } from './turma.schema';
import { catchAsync } from '../../common/utils/catch-async';

const turmaRouter = Router();
const repositorio = AppDataSource.getRepository(Turma);
const turmaService = new TurmaService(repositorio);

// Aplica autenticação em todas as rotas de turma
turmaRouter.use(autenticar);

turmaRouter.post(
  '/',
  validarRequisicao(criarTurmaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;
    const turma = await turmaService.criarParaProfessor(req.body, professorId);
    res.status(201).json(turma);
  })
);

export { turmaRouter };
```

### Passo 6: Registrar as Rotas em `src/app.ts`

Importe o novo roteador e registre no método `configurarRotas()`:

```typescript
import { turmaRouter } from './modules/turma/turma.controller';

private configurarRotas(): void {
  this.app.use('/auth', professorRouter);
  this.app.use('/turmas', turmaRouter);
}
```

---

## 5. Banco de Dados (PostgreSQL no NeonDB)

O projeto usa um **PostgreSQL gerenciado no [Neon](https://neon.tech)**. Não é necessário instalar banco localmente nem usar Docker: basta ter a string de conexão do Neon no `.env`.

### 5.1 Como a conexão funciona

```text
┌──────────────────────────┐            ┌───────────────────────────┐
│ Máquina Local            │  WebSocket │ NeonDB (nuvem)            │
│ App Node.js / Express    │ ─────────► │ PostgreSQL                │
│ TypeORM                  │  TLS/443   │ banco: neondb             │
└──────────────────────────┘            └───────────────────────────┘
```

A conexão é configurada em `src/data/data-source.ts` e controlada pela variável `DB_DRIVER`:

| `DB_DRIVER` | Driver | Porta | Quando usar |
|---|---|---|---|
| `neon` (padrão) | `@neondatabase/serverless` (WebSocket) | 443 | Funciona em qualquer rede, inclusive redes que bloqueiam a porta 5432 (faculdade, empresa, alguns provedores). |
| `pg` | `pg` (TCP tradicional) | 5432 | Ambientes de deploy/servidores com a porta 5432 liberada. |

### 5.2 Configuração do `.env`

Copie o `.env.example` para `.env` e preencha a string de conexão (Neon Console → **Connection Details**):

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@HOST-pooler.REGIAO.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DB_DRIVER=neon
DB_MIGRATIONS_RUN=false

JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRATION=1d

PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8081
```

> **Segurança:** o `.env` não é versionado (está no `.gitignore`). Nunca commite a string de conexão real.

### 5.3 Migrations

O `synchronize` do TypeORM fica **desligado**: o schema do banco é criado e alterado somente por migrations, que ficam em `src/data/migrations/`.

| Comando | O que faz |
|---|---|
| `npm run migration:run` | Executa no Neon todas as migrations pendentes (cria as tabelas na primeira vez). |
| `npm run migration:show` | Lista as migrations e quais já foram aplicadas (`[X]`). |
| `npm run migration:generate -- src/data/migrations/NomeDaMudanca` | Compara as entidades com o banco e gera uma migration com as diferenças. |
| `npm run migration:create -- src/data/migrations/NomeDaMudanca` | Cria uma migration vazia para escrever SQL manualmente. |
| `npm run migration:revert` | Desfaz a última migration aplicada. |

**Fluxo ao alterar uma entidade:**

1. Altere/crie o arquivo `*.entity.ts` (e registre-o em `entities` no `data-source.ts`, se for nova).
2. Gere a migration: `npm run migration:generate -- src/data/migrations/DescricaoDaMudanca`.
3. Revise o SQL gerado.
4. Aplique: `npm run migration:run`.
5. Commite a entidade **junto** com a migration.

> Com `DB_MIGRATIONS_RUN=true`, o servidor aplica as migrations pendentes automaticamente ao iniciar (útil em deploy).

### 5.4 Seed (dados de desenvolvimento)

O arquivo `src/data/seeds/seed.ts` popula todas as tabelas com dados realistas de uma escola de inglês infantil:

- 2 professores (login com senha `Senha@123`): `ana.ferreira@tia.com` (3 turmas) e `ricardo.mendes@tia.com` (1 turma);
- 4 turmas com 10 alunos cada (2 em destaque, 6 no ritmo, 2 em atenção), com responsável e observações;
- conquistas por professor (todas as categorias, níveis A1/A2, uma arquivada) vinculadas às turmas;
- 10 aulas por turma, com datas relativas ao dia em que a seed roda: concluídas, em andamento, próxima e planejada, com horário do turno e atividades;
- metas (conquistas) por aula, progresso de cada aluno em cada conquista e registros de acompanhamento das aulas concluídas, além de registros avulsos sem aula.

| Comando | O que faz |
|---|---|
| `npm run seed` | Popula o banco. Não faz nada se o banco já tiver dados. |
| `npm run seed -- --reset` | **Apaga todos os dados** e popula novamente. |

### 5.5 Problemas Comuns

- **`timeout expired` com `DB_DRIVER=pg`:** a rede está bloqueando a porta 5432. Use `DB_DRIVER=neon`.
- **`relation "..." does not exist`:** as migrations ainda não foram aplicadas. Rode `npm run migration:run`.
- **`password authentication failed`:** a `DATABASE_URL` está incorreta ou a senha foi resetada no Neon Console.

---

## 6. Como Executar o Projeto

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do `.env.example` (veja a [seção 5.2](#52-configuração-do-env)).

3. Crie/atualize as tabelas no Neon:

   ```bash
   npm run migration:run
   ```

4. Execute em modo de desenvolvimento (live reload via `tsx`):

   ```bash
   npm run dev
   ```
## 7. Deploy na Vercel

A API roda na Vercel como **uma única função serverless** (`api/index.js`), que recebe todas as rotas via `rewrites` do `vercel.json`.

- **Build:** a Vercel executa `npm run build` (`tsc -p tsconfig.build.json`), gerando `dist/`. A função carrega `dist/vercel.js`, já compilado com o mesmo tsconfig usado localmente. A pasta `public/` existe só porque a Vercel exige uma pasta de saída não vazia (contém apenas um `robots.txt`).
- **Conexão com o banco:** aberta na primeira requisição de cada instância e reaproveitada nas seguintes (`src/data/conexao.ts`). Se falhar, a API responde `503` em JSON.
- **Migrations:** não rodam no deploy. Antes de publicar, rode `npm run migration:run` localmente com o `DATABASE_URL` de produção no `.env`.

Variáveis de ambiente (Project Settings > Environment Variables):

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | String de conexão do Neon (use o host `-pooler`) |
| `DB_DRIVER` | `neon` |
| `JWT_SECRET` | Segredo forte (diferente do de desenvolvimento) |
| `JWT_EXPIRATION` | ex: `1d` |
| `ALLOWED_ORIGINS` | URLs do frontend web separadas por vírgula (o app mobile nativo não envia `Origin` e é liberado) |
| `NODE_ENV` | `production` (a Vercel já define) |

> `TRUST_PROXY` é definido automaticamente como `1` na Vercel. Na Vercel, o contador do rate limit fica em memória por instância, então o limite é aproximado.
