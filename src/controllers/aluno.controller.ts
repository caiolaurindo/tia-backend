import { Request, Response } from 'express';
import { AlunoService } from '../services/aluno.service';
import { AppError } from '../utils/app-error';

export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  listar = async (req: Request, res: Response) => {
    const turmaId = req.query.turmaId ? Number(req.query.turmaId) : undefined;
    if (
      turmaId !== undefined &&
      (!Number.isInteger(turmaId) || turmaId <= 0)
    ) {
      throw new AppError('turmaId inválido.', 400);
    }
    res.json(await this.alunoService.listarPorProfessor(req.usuario!.sub, turmaId));
  };

  buscarPorId = async (req: Request, res: Response) => {
    res.json(await this.alunoService.buscarPorIdEProfessor(Number(req.params.id), req.usuario!.sub));
  };

  criar = async (req: Request, res: Response) => {
    res.status(201).json(await this.alunoService.criarParaProfessor(req.body, req.usuario!.sub));
  };

  atualizar = async (req: Request, res: Response) => {
    res.json(
      await this.alunoService.atualizarParaProfessor(
        Number(req.params.id),
        req.body,
        req.usuario!.sub
      )
    );
  };

  remover = async (req: Request, res: Response) => {
    await this.alunoService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
