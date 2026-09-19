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
├── data/               # Configuração da camada de persistência com TypeORM e MySQL
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

## 5. Containerização com Docker (Banco de Dados)

Para garantir que todos os desenvolvedores trabalhem exatamente com o mesmo ambiente de banco de dados, sem precisar instalar e configurar o MySQL localmente no sistema operacional, o projeto utiliza o **Docker** por meio do **Docker Compose**.

> **Pré-requisito:** ter o Docker instalado, com o plugin Docker Compose v2. Confirme com `docker --version` e `docker compose version`.

### 5.1 Como o Docker funciona no projeto?

O Docker isola o serviço do **MySQL 8.0** dentro de um container leve e autossuficiente. Apenas o banco roda em container: a aplicação Node.js/Express continua rodando na máquina local (via `tsx`, com `npm run dev`) e se conecta ao container através da porta exposta `3306`.

```text
┌─────────────────────────────────────────────────────────┐
│ Máquina Local (Host)                                    │
│                                                         │
│  ┌────────────────────────┐     ┌────────────────────┐  │
│  │ App Node.js / Express  │     │ Container Docker   │  │
│  │ (porta 3000)           │ ──► │ MySQL 8.0          │  │
│  │ TypeORM                │     │ (porta 3306)       │  │
│  └────────────────────────┘     └────────────────────┘  │
│                                           │             │
│                                           ▼             │
│                                 [ Volume mysql_data ]   │
└─────────────────────────────────────────────────────────┘
```

Os dados ficam em um **volume nomeado** gerenciado pelo Docker, separado do ciclo de vida do container. Por isso, o container pode ser parado, recriado ou removido sem perder as tabelas e registros.

### 5.2 Estrutura do `docker-compose.yml`

Crie ou atualize o arquivo `docker-compose.yml` na raiz do projeto com o seguinte conteúdo:

```yaml
services:
  db:
    image: mysql:8.0
    container_name: tia_mysql_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: pi4_db
      MYSQL_USER: user_pi4
      MYSQL_PASSWORD: user_pi4_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
    driver: local
```

> **Nota:** o campo `version` foi omitido de propósito. Ele é obsoleto no Compose v2 e gera um aviso no terminal. Se você usa uma versão antiga (`docker-compose` v1), pode incluir `version: '3.8'` no topo.

**Explicação das diretivas:**

| Diretiva | O que faz |
|---|---|
| `image: mysql:8.0` | Baixa e utiliza a imagem oficial do MySQL na versão 8.0. |
| `container_name` | Nomeia o container como `tia_mysql_db`, facilitando a identificação no Docker. |
| `restart: always` | Reinicia o container automaticamente se ele cair ou quando o Docker for reiniciado. |
| `MYSQL_ROOT_PASSWORD` | Senha do usuário `root`. |
| `MYSQL_DATABASE` | Nome do banco criado automaticamente na primeira inicialização (`pi4_db`). |
| `MYSQL_USER` / `MYSQL_PASSWORD` | Credenciais do usuário padrão da aplicação, com permissão total sobre `MYSQL_DATABASE`. |
| `ports: "3306:3306"` | Mapeia a porta `3306` do container para a porta `3306` da máquina host (`host:container`), permitindo que o TypeORM (`data-source.ts`) e clientes gráficos (DBeaver, MySQL Workbench) se conectem em `localhost:3306`. |
| `volumes: mysql_data:/var/lib/mysql` | Cria um volume persistente. Mesmo que o container seja parado ou deletado, os dados de tabelas, professores, turmas e registros não são perdidos. |

> **Importante:** as variáveis `MYSQL_*` só são aplicadas na **primeira inicialização**, quando o volume ainda está vazio. Alterá-las depois não modifica um banco já criado. Para recriar o banco com novos valores, use `docker compose down -v` (veja a seção 5.4).

> **Atenção:** essas credenciais são apenas para **desenvolvimento local**. Nunca reutilize esses valores em ambientes de produção.

### 5.3 Sincronização com o `.env`

As credenciais do `docker-compose.yml` devem bater com as variáveis declaradas no seu arquivo `.env` local:

```dotenv
PORT=3000

# Conexão com o Container MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=pi4_db

# Segurança
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRATION=1d
```

Pontos de atenção:

- **Usuário `root` ou usuário da aplicação:** o exemplo acima usa `root`, que corresponde a `MYSQL_ROOT_PASSWORD`. Se preferir usar o usuário da aplicação (com menos privilégios), troque para `DB_USER=user_pi4` e `DB_PASS=user_pi4_pass`.
- **`DB_HOST=localhost`:** funciona porque a aplicação roda na máquina host e acessa a porta exposta pelo container. Se a aplicação também rodasse em um container, o host passaria a ser o nome do serviço (`db`).
- **Segurança:** não versione o `.env` (mantenha-o no `.gitignore`) e troque `JWT_SECRET` por uma chave longa e aleatória.

### 5.4 Comandos Práticos do Docker (Guia Rápido)

| Comando | O que faz |
|---|---|
| `docker compose up -d` | Inicia o banco de dados em segundo plano (*detached mode*). |
| `docker compose ps` | Verifica se o container está em execução (status `running`/`Up`). |
| `docker compose logs -f db` | Exibe os logs do MySQL em tempo real. Útil para depurar erros de conexão. |
| `docker compose stop` | Para o banco de dados sem perder os dados armazenados. |
| `docker compose down` | Remove o container (e a rede do projeto), mantendo os dados salvos no volume. |
| `docker compose down -v` | **Reset total:** remove o container **e apaga o volume**, destruindo todos os dados. |

> **Cuidado com o `down -v`:** use esse comando apenas se quiser limpar completamente o banco e recomeçar do zero. A operação não pode ser desfeita.

### 5.5 Problemas Comuns

- **`ECONNREFUSED` logo após subir o container:** na primeira execução, o MySQL leva alguns segundos para inicializar. Acompanhe com `docker compose logs -f db` e aguarde a mensagem `ready for connections`.
- **Porta `3306` já em uso:** provavelmente há um MySQL instalado localmente. Pare esse serviço ou altere o mapeamento para `"3307:3306"` e ajuste `DB_PORT=3307` no `.env`.
- **`Access denied for user`:** as credenciais do `.env` não coincidem com as do `docker-compose.yml`, ou as variáveis `MYSQL_*` foram alteradas depois da primeira inicialização. Nesse caso, recrie o banco com `docker compose down -v` e suba novamente.

---

## 6. Como Executar o Projeto

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` na raiz do projeto (veja a [seção 5.3](#53-sincronização-com-o-env)).

3. Suba o banco de dados MySQL via Docker (detalhes na [seção 5](#5-containerização-com-docker-banco-de-dados)):

   ```bash
   docker compose up -d
   ```

4. Execute em modo de desenvolvimento (live reload via `tsx`):

   ```bash
   npm run dev
   ```