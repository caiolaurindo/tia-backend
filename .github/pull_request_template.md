## Tipo de Alteração (Type)

<!--Remova os tipos não aplicáveis ao seu MR-->

* **feat**: Uma nova funcionalidade para o sistema.
* **fix**: Correção de um bug ou comportamento inesperado.
* **docs**: Alterações exclusivamente na documentação (README, comentários, etc).
* **style**: Mudanças que não afetam o significado do código (formatação, espaços, ponto e vírgula faltando).
* **refactor**: Uma alteração no código que não corrige um bug nem adiciona uma funcionalidade (melhoria de performance ou legibilidade).
* **chore**: Atualizações de tarefas de build, configurações de ferramentas ou pacotes/dependências (ex: atualizar o npm).

---

- [ ]  Alteração de emergência? se sim, explique.

---

## O que foi feito? (Descrição)

---

## Evidências / Screenshots (Se aplicável)

---

## Algo não saiu como esperado? especifique o impacto.

---

## Checklist de Qualidade Mínima
### Desenvolvimento & Código
- [ ]  O código segue os padrões do projeto (lint, prettier, tipagem, nomenclatura e sonarQube).
- [ ]  Removi códigos de teste temporários (`console.log`, prints de depuração, trechos comentados sem acréscimo informativo/desnecessários).
- [ ]  Testei a alteração localmente em ambiente de desenvolvimento buildado, no docker e funciona como esperado.

### Testes
- [ ]  Escrevi testes unitários/integração para esta alteração (se aplicável).
- [ ]  Todos os testes novos e existentes estão passando com sucesso.

### Infraestrutura & Configurações
- [ ]  **Houve alteração de Infraestrutura?** (Ex: Dockerfile, nginx, CI/CD pipelines, variáveis de ambiente `.env`).
- [ ]  Se sim, as novas variáveis ou dependências já foram comunicadas ao time/configuradas no ambiente local?

---