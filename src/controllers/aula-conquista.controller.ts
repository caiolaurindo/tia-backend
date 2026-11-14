import { Request, Response } from 'express';
import { AulaConquistaService } from '../services/aula-conquista.service';
import { AppError } from '../utils/app-error';

/**
 * Controller responsável pela gestão de conquistas por aula.
 * 
 * @author caiolaurindo
 */
export class AulaConquistaController {
  constructor(private readonly aulaConquistaService: AulaConquistaService) {}

  listar = async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;
    const aulaId = req.query.aulaId ? Number(req.query.aulaId) : undefined;

    if (
      aulaId === undefined ||
      !Number.isInteger(aulaId) ||
      aulaId <= 0
    ) {
      throw new AppError(
        'O parâmetro de consulta aulaId é obrigatório e deve ser um número válido.',
        400
      );
    }

    const conquistas = await this.aulaConquistaService.listarPorAula(
      aulaId,
      professorId
    );

    res.json(conquistas);
  };

  buscarPorId = async (req: Request, res: Response) => {
    const conquistaAula = await this.aulaConquistaService.buscarPorIdEProfessor(
      Number(req.params.id),
      req.usuario!.sub
    );
    res.json(conquistaAula);
  };

  vincular = async (req: Request, res: Response) => {
    const novaAulaConquista = await this.aulaConquistaService.vincularConquistaAAula(
      req.body,
      req.usuario!.sub
    );
    res.status(201).json(novaAulaConquista);
  };

  atualizar = async (req: Request, res: Response) => {
    const aulaConquistaAtualizada = await this.aulaConquistaService.atualizarMeta(
      Number(req.params.id),
      req.body,
      req.usuario!.sub
    );
    res.json(aulaConquistaAtualizada);
  };

  remover = async (req: Request, res: Response) => {
    await this.aulaConquistaService.removerDaAula(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
