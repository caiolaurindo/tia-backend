import { z } from 'zod';

const SENHA_MAX_BYTES_BCRYPT = 72;

const validarLimiteBytesBcrypt = (senha: string) =>
  Buffer.byteLength(senha, 'utf8') <= SENHA_MAX_BYTES_BCRYPT;

const emailPadraoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail em formato inválido'));

export const criarProfessorSchema = z
  .object({
    nome: z.string().trim().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    email: emailPadraoSchema,
    senha: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .max(SENHA_MAX_BYTES_BCRYPT, 'A senha deve ter no máximo 72 caracteres')
      .refine(
        validarLimiteBytesBcrypt,
        'A senha não pode ultrapassar 72 bytes em UTF-8'
      ),
  })
  .strict();

export const loginProfessorSchema = z
  .object({
    email: emailPadraoSchema,
    senha: z
      .string()
      .min(1, 'A senha é obrigatória')
      .max(SENHA_MAX_BYTES_BCRYPT, 'A senha deve ter no máximo 72 caracteres')
      .refine(
        validarLimiteBytesBcrypt,
        'A senha não pode ultrapassar 72 bytes em UTF-8'
      ),
  })
  .strict();

export type CriarProfessorDTO = z.infer<typeof criarProfessorSchema>;
export type LoginProfessorDTO = z.infer<typeof loginProfessorSchema>;
