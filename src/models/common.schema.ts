import { z } from 'zod';

/**
 * Schemas e utilitários Zod compartilhados para padronização de datas e parâmetros de rota/query.
 *
 * @author caiolaurindo
 */

/**
 * Retorna a data local atual no formato ISO 8601 `AAAA-MM-DD`.
 * Calculada dinamicamente a cada validação para evitar problemas após virada de dia.
 */
export function obterDataAtualISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Valida datas no formato único ISO `AAAA-MM-DD`, verificando também se a data
 * existe no calendário gregoriano (incluindo anos bissextos).
 */
export const dataISOSchema = (
  mensagem = 'A data deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2026-10-26)'
) => z.iso.date({ error: mensagem });

/**
 * Valida datas no formato único ISO `AAAA-MM-DD` garantindo que não estejam no futuro.
 */
export const dataNaoFuturaSchema = (
  mensagemFormato = 'A data deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2018-05-10)',
  mensagemFutura = 'A data não pode ser futura'
) =>
  dataISOSchema(mensagemFormato).refine((data) => data <= obterDataAtualISO(), {
    message: mensagemFutura,
  });

/**
 * Coerce strings numéricas inteiras positivas (de `req.params` ou `req.query`) para `number`.
 * Rejeita strings vazias, notação científica (`1e2`), decimais, zero e negativos.
 */
export const criarIdPositivoCoercao = (
  mensagem = 'O ID deve ser um número inteiro positivo'
) =>
  z.preprocess(
    (valor) => {
      if (typeof valor === 'string') {
        const limpo = valor.trim();
        if (!/^\d+$/.test(limpo)) {
          return valor;
        }
        return Number(limpo);
      }
      return valor;
    },
    z
      .number({ error: mensagem })
      .int(mensagem)
      .positive(mensagem)
      .max(Number.MAX_SAFE_INTEGER, mensagem)
  );

export const idParamSchema = z.object({
  id: criarIdPositivoCoercao('O ID deve ser um número inteiro positivo'),
});

export const turmaIdParamSchema = z.object({
  turmaId: criarIdPositivoCoercao('O ID da turma deve ser um número inteiro positivo'),
});

export const turmaConquistaParamsSchema = z.object({
  turmaId: criarIdPositivoCoercao('O ID da turma deve ser um número inteiro positivo'),
  conquistaId: criarIdPositivoCoercao('O ID da conquista deve ser um número inteiro positivo'),
});

export const alunoIdParamSchema = z.object({
  aluno_id: criarIdPositivoCoercao('O ID do aluno deve ser um número inteiro positivo'),
});

export const aulaIdParamSchema = z.object({
  aula_id: criarIdPositivoCoercao('O ID da aula deve ser um número inteiro positivo'),
});

export type IdParamDTO = z.infer<typeof idParamSchema>;
export type TurmaIdParamDTO = z.infer<typeof turmaIdParamSchema>;
export type TurmaConquistaParamsDTO = z.infer<typeof turmaConquistaParamsSchema>;
export type AlunoIdParamDTO = z.infer<typeof alunoIdParamSchema>;
export type AulaIdParamDTO = z.infer<typeof aulaIdParamSchema>;
