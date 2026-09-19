import { z } from 'zod';

export const criarProfessorSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail em formato inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const loginProfessorSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

export type CriarProfessorDTO = z.infer<typeof criarProfessorSchema>;
export type LoginProfessorDTO = z.infer<typeof loginProfessorSchema>;