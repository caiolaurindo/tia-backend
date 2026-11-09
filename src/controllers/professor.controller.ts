import { Request, Response } from 'express';
import { ProfessorService } from '../services/professor.service';

export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  cadastrar = async (req: Request, res: Response) => {
    const resultado = await this.professorService.cadastrar(req.body);
    res.status(201).json(resultado);
  };

  login = async (req: Request, res: Response) => {
    const resultado = await this.professorService.login(req.body);
    res.json(resultado);
  };

  me = async (req: Request, res: Response) => {
    const professor = await this.professorService.buscarPorId(req.usuario!.sub);
    const { senhaHash, ...professorSemSenha } = professor;
    res.json(professorSemSenha);
  };
}
