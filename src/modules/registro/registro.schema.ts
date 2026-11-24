import { z } from 'zod';

const registroBodySchema = z.object({
  alunoId: z.number({ message: 'alunoId é obrigatório e deve ser um número' }),
  aulaId: z.number({ message: 'aulaId é obrigatório e deve ser um número' }),
  data: z.coerce.date(),
  participacao: z.string().optional(),
  realizouAtividade: z.string().optional(),
  seguiuComandos: z.string().optional(),
  dificuldades: z.string().optional(),
  observacoesLivres: z.string().optional(),
});

export const createRegistroSchema = registroBodySchema;
export const updateRegistroSchema = registroBodySchema.partial();

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type UpdateRegistroInput = z.infer<typeof updateRegistroSchema>;