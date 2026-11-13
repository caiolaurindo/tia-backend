import { Request, Response } from 'express';
import { AulaService } from '../services/aula.service';
import { AppError } from '../utils/app-error';

/**
 * Controller responsável pelo controle de requisições de Aulas.
 * 
 * @author caiolaurindo
 */
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  listar = async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;

    const turmaId = req.query.turmaId
      ? Number(req.query.turmaId)
      : undefined;

    if (turmaId !== undefined && (!Number.isInteger(turmaId) || turmaId <= 0)) {
      throw new AppError('turmaId inválido.', 400);
    }

    if (turmaId !== undefined) {
      const aulas = await this.aulaService.listarPorTurmaEProfessor(turmaId, professorId);
      return res.json(aulas);
    }

    const aulas = await this.aulaService.listarPorProfessor(professorId);
    return res.json(aulas);
  };

  buscarPorId = async (req: Request, res: Response) => {
    const aula = await this.aulaService.buscarPorIdEProfessor(
      Number(req.params.id),
      req.usuario!.sub
    );
    res.json(aula);
  };

  criar = async (req: Request, res: Response) => {
    const aula = await this.aulaService.criarParaProfessor(req.body, req.usuario!.sub);
    res.status(201).json(aula);
  };

  atualizar = async (req: Request, res: Response) => {
    const aula = await this.aulaService.atualizarParaProfessor(
      Number(req.params.id),
      req.body,
      req.usuario!.sub
    );
    res.json(aula);
  };

  remover = async (req: Request, res: Response) => {
    await this.aulaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
