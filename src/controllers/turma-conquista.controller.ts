import { Request, Response } from 'express';
import { TurmaConquistaService } from '../services/turma-conquista.service';

export class TurmaConquistaController {
  constructor(private readonly turmaConquistaService: TurmaConquistaService) {}

  listar = async (req: Request, res: Response) => {
    const turmaId = Number(req.params.turmaId);
    const professorId = req.usuario!.sub;
    res.json(await this.turmaConquistaService.listarConquistasDaTurma(turmaId, professorId));
  };

  vincular = async (req: Request, res: Response) => {
    const turmaId = Number(req.params.turmaId);
    const { conquistaId } = req.body;
    const professorId = req.usuario!.sub;
    res.status(201).json(
      await this.turmaConquistaService.vincularConquista(turmaId, conquistaId, professorId)
    );
  };

  desvincular = async (req: Request, res: Response) => {
    const turmaId = Number(req.params.turmaId);
    const conquistaId = Number(req.params.conquistaId);
    const professorId = req.usuario!.sub;
    await this.turmaConquistaService.desvincularConquista(turmaId, conquistaId, professorId);
    res.status(204).send();
  };
}
