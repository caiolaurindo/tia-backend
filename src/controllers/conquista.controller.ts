import { Request, Response } from 'express';
import { ConquistaService } from '../services/conquista.service';

export class ConquistaController {
  constructor(private readonly conquistaService: ConquistaService) {}

  listar = async (req: Request, res: Response) => {
    res.json(await this.conquistaService.listarPorProfessor(req.usuario!.sub));
  };

  progresso = async (req: Request, res: Response) => {
    res.json(await this.conquistaService.progressoPorTurma(req.usuario!.sub));
  };

  buscarPorId = async (req: Request, res: Response) => {
    res.json(
      await this.conquistaService.buscarPorIdEProfessor(Number(req.params.id), req.usuario!.sub)
    );
  };

  criar = async (req: Request, res: Response) => {
    res.status(201).json(await this.conquistaService.criarConquista(req.body, req.usuario!.sub));
  };

  atualizar = async (req: Request, res: Response) => {
    res.json(
      await this.conquistaService.atualizarConquista(
        Number(req.params.id),
        req.body,
        req.usuario!.sub
      )
    );
  };

  remover = async (req: Request, res: Response) => {
    await this.conquistaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  };
}
