import { Request, Response } from 'express';
import { ConquistaService } from '../services/conquista.service';

export class ConquistaController {
  constructor(private readonly conquistaService: ConquistaService) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.conquistaService.listarTodos());
  };

  buscarPorId = async (req: Request, res: Response) => {
    res.json(await this.conquistaService.buscarPorId(Number(req.params.id)));
  };

  criar = async (req: Request, res: Response) => {
    res.status(201).json(await this.conquistaService.criarConquista(req.body));
  };

  atualizar = async (req: Request, res: Response) => {
    res.json(await this.conquistaService.atualizarConquista(Number(req.params.id), req.body));
  };

  remover = async (req: Request, res: Response) => {
    await this.conquistaService.remover(Number(req.params.id));
    res.status(204).send();
  };
}
