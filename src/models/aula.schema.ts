import { z } from 'zod';
import { criarIdPositivoCoercao, dataISOSchema } from './common.schema';

const horarioSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    'O horário deve estar no formato HH:MM'
  );

const atividadeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
});

const statusSchema = z.enum([
  'proxima',
  'planejada',
  'em_andamento',
  'concluida',
]);

export const criarAulaSchema = z
  .object({
    nome: z.string().trim().min(2, 'O nome da aula deve ter pelo menos 2 caracteres'),
    assunto: z.string().trim().min(2, 'O assunto da aula deve ter pelo menos 2 caracteres'),
    data: dataISOSchema(
      'A data da aula deve estar no formato AAAA-MM-DD e ser uma data válida (ex: 2026-10-26)'
    ),
    turmaId: z.number().int().positive('O ID da turma deve ser um número inteiro válido'),
    horarioInicio: horarioSchema.nullable().optional(),
    horarioFim: horarioSchema.nullable().optional(),
    status: statusSchema.optional(),
    atividades: z.array(atividadeSchema).optional(),
  })
  .strict();

export const atualizarAulaSchema = criarAulaSchema.partial().strict();

export const listarAulaQuerySchema = z.object({
  turmaId: criarIdPositivoCoercao('turmaId inválido.').optional(),
});

export type CriarAulaDTO = z.infer<typeof criarAulaSchema>;
export type AtualizarAulaDTO = z.infer<typeof atualizarAulaSchema>;
export type ListarAulaQueryDTO = z.infer<typeof listarAulaQuerySchema>;