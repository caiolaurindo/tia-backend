import { Request, Response } from 'express';
import { AlunoConquistaService } from '../services/aluno-conquista.service';
import { AppError } from '../utils/app-error';

export class AlunoConquistaController {
  constructor(private readonly alunoConquistaService: AlunoConquistaService) {}

  listar = async (req: Request, res: Response) => {
    const alunoId = Number(req.query.alunoId);

    if (
      !req.query.alunoId ||
      !Number.isInteger(alunoId) ||
      alunoId <= 0
    ) {
      throw new AppError(
        'O parâmetro alunoId é obrigatório e deve ser numérico.',
        400
      );
    }

    res.json(
      await this.alunoConquistaService.listarPorAluno(
        alunoId,
        req.usuario!.sub
      )
    );
  };

  atribuir = async (req: Request, res: Response) => {
    res.status(201).json(
      await this.alunoConquistaService.atribuirParaProfessor(req.body, req.usuario!.sub)
    );
  };

  atualizar = async (req: Request, res: Response) => {
    res.json(
      await this.alunoConquistaService.atualizarParaProfessor(
        Number(req.params.id),
        req.body,
        req.usuario!.sub
      )
    );
  };

  remover = async (req: Request, res: Response) => {
    await this.alunoConquistaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
