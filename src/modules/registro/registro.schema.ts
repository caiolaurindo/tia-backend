import { z } from 'zod';

export const createRegistroSchema = z.object({
  alunoId: z.number().int().positive('O ID do aluno deve ser um número inteiro positivo'),
  aulaId: z.number().int().positive('O ID da aula deve ser um número inteiro positivo'),
  data: z.coerce.date(),
  participacao: z.string().nullable().optional(),
  realizouAtividade: z.string().nullable().optional(),
  seguiuComandos: z.string().nullable().optional(),
  dificuldades: z.string().nullable().optional(),
  observacoesLivres: z.string().nullable().optional(),
});

export const updateRegistroSchema = createRegistroSchema.partial();

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type UpdateRegistroInput = z.infer<typeof updateRegistroSchema>;
export const criarRegistroSchema = createRegistroSchema;
export const atualizarRegistroSchema = updateRegistroSchema;
export type CriarRegistroDTO = CreateRegistroInput;
export type AtualizarRegistroDTO = UpdateRegistroInput;
