import { Request, Response } from 'express';
import { RegistroService } from '../services/registro.service';

export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  criar = async (req: Request, res: Response) => {
    const registro = await this.registroService.criar(req.body, req.usuario!.sub);
    res.status(201).json(registro);
  };

  listar = async (req: Request, res: Response) => {
    const registros = await this.registroService.listarTodos(req.usuario!.sub);
    res.json(registros);
  };

  buscarPorAluno = async (req: Request, res: Response) => {
    const { aluno_id } = req.params;
    const registros = await this.registroService.buscarPorAluno(Number(aluno_id), req.usuario!.sub);
    res.json(registros);
  };

  buscarPorAula = async (req: Request, res: Response) => {
    const { aula_id } = req.params;
    const registros = await this.registroService.buscarPorAula(Number(aula_id), req.usuario!.sub);
    res.json(registros);
  };

  buscarPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await this.registroService.buscarPorId(Number(id), req.usuario!.sub);
    res.json(registro);
  };

  atualizar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await this.registroService.atualizar(
      Number(id),
      req.body,
      req.usuario!.sub
    );
    res.json(registro);
  };

  remover = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.registroService.remover(Number(id), req.usuario!.sub);
    res.status(204).send();
  };
}
