import { Request, Response } from 'express';
import { TurmaService } from '../services/turma.service';

export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  listar = async (req: Request, res: Response) => {
    const turmas = await this.turmaService.listarPorProfessor(req.usuario!.sub);
    res.json(turmas);
  };

  buscarPorId = async (req: Request, res: Response) => {
    const turma = await this.turmaService.buscarPorIdEProfessor(
      Number(req.params.id),
      req.usuario!.sub
    );
    res.json(turma);
  };

  criar = async (req: Request, res: Response) => {
    const turma = await this.turmaService.criarParaProfessor(req.body, req.usuario!.sub);
    res.status(201).json(turma);
  };

  atualizar = async (req: Request, res: Response) => {
    const turma = await this.turmaService.atualizarParaProfessor(
      Number(req.params.id),
      req.body,
      req.usuario!.sub
    );
    res.json(turma);
  };

  remover = async (req: Request, res: Response) => {
    await this.turmaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
