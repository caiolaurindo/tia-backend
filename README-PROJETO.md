# TIA — Teaching Intelligent Assistant

Este repositório contém o **backend** do **TIA (Teaching Intelligent Assistant)**, projeto acadêmico desenvolvido inicialmente na disciplina de **Projeto Integrador IV (PI 4)**.

## 📚 Sobre o projeto

O TIA é uma plataforma web voltada para professores de inglês que trabalham com crianças de até 12 anos.

A plataforma busca auxiliar o professor no registro, organização e acompanhamento do desenvolvimento individual dos estudantes ao longo do ano letivo.

Entre as informações que poderão ser acompanhadas estão:

* participação;
* atividades realizadas;
* dificuldades;
* conquistas;
* comportamento;
* acontecimentos relevantes;
* evolução;
* desenvolvimento das habilidades esperadas.

A ideia central do projeto é:

**registrar → organizar → consultar → acompanhar**

O objetivo é centralizar informações importantes sobre os estudantes e reduzir a dependência de registros espalhados ou da memória do professor.

## ⚙️ Backend

Este repositório é responsável pelo backend e pelas regras de negócio do TIA.

Entre suas responsabilidades estão o gerenciamento e persistência de informações relacionadas a:

* usuários;
* professores;
* turmas;
* alunos;
* aulas;
* registros;
* dificuldades;
* conquistas;
* histórico de desenvolvimento.

O backend também fornecerá os serviços necessários para comunicação com o frontend e poderá receber, ao longo da evolução do projeto, funcionalidades relacionadas à Inteligência Artificial.

---

# 🌿 Guia básico de Git

## Clonar o projeto

Para baixar o projeto pela primeira vez:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta:

```bash
cd tia-backend
```

---

## Verificar alterações

```bash
git status
```

Esse comando mostra quais arquivos foram criados, modificados ou removidos.

---

## Atualizar a main

Antes de iniciar uma nova tarefa:

```bash
git switch main
git pull origin main
```

Assim, sua `main` local ficará atualizada com o repositório remoto.

---

## Criar uma branch

Cada funcionalidade ou correção deve ser desenvolvida em uma branch própria.

```bash
git switch -c nome-da-branch
```

Exemplo:

```bash
git switch -c feature/cadastro-aluno
```

Alguns exemplos:

```text
feature/cadastro-aluno
feature/criacao-turma
feature/historico-aluno
fix/validacao-aluno
fix/login
```

---

## Visualizar branches

```bash
git branch
```

---

## Trocar de branch

```bash
git switch nome-da-branch
```

Exemplo:

```bash
git switch main
```

---

## Adicionar alterações

Depois de desenvolver:

```bash
git add .
```

Ou, para adicionar um arquivo específico:

```bash
git add nome-do-arquivo
```

---

## Criar um commit

```bash
git commit -m "mensagem do commit"
```

Exemplo:

```bash
git commit -m "feat: adiciona cadastro de aluno"
```

Alguns prefixos recomendados:

```text
feat: nova funcionalidade
fix: correção de problema
docs: documentação
refactor: refatoração
style: formatação
test: testes
```

Exemplos:

```bash
git commit -m "feat: cria endpoint de cadastro de aluno"

git commit -m "fix: corrige validação de turma"

git commit -m "refactor: reorganiza serviço de alunos"

git commit -m "docs: atualiza README"
```

---

## Enviar uma nova branch

Na primeira vez:

```bash
git push -u origin nome-da-branch
```

Exemplo:

```bash
git push -u origin feature/cadastro-aluno
```

Depois que a branch já estiver configurada:

```bash
git push
```

---

## Baixar alterações

```bash
git pull
```

---

# 🔄 Fluxo básico de trabalho

Antes de iniciar uma tarefa:

```bash
git switch main

git pull origin main

git switch -c feature/nome-da-feature
```

Depois de desenvolver:

```bash
git status

git add .

git commit -m "feat: descrição da alteração"

git push -u origin feature/nome-da-feature
```

Depois disso, deverá ser criado um **Pull Request (PR)** no GitHub para enviar as alterações da sua branch para a `main`.

---

# 📌 Exemplo completo

Imagine que será desenvolvido o cadastro de alunos.

Primeiro:

```bash
git switch main
git pull origin main
```

Crie a branch:

```bash
git switch -c feature/cadastro-aluno
```

Após desenvolver:

```bash
git status
git add .
git commit -m "feat: adiciona cadastro de aluno"
```

Envie a branch:

```bash
git push -u origin feature/cadastro-aluno
```

Depois, abra um Pull Request no GitHub.

## ⚠️ Importante

Evite realizar alterações diretamente na `main`.

Utilize branches para desenvolver funcionalidades e corrigir problemas. Isso facilita a organização do projeto e reduz conflitos entre as alterações realizadas pelos integrantes da equipe.

---

## 🎓 Contexto acadêmico

O TIA é um projeto de finalização de curso iniciado na disciplina de **Projeto Integrador IV (PI 4)**.

Ao longo do desenvolvimento, o backend deverá evoluir conforme as necessidades identificadas com os usuários e as funcionalidades da plataforma forem validadas.
