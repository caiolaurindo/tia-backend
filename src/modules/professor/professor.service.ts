import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Professor } from './professor.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarProfessorDTO, LoginProfessorDTO } from './professor.schema';
import { AppError } from '../../common/utils/app-error';
import { JwtUtil } from '../../common/utils/jwt.util';

export class ProfessorService extends ServiceGenerico<Professor> {
  constructor(repositorio: Repository<Professor>) {
    super(repositorio);
  }

  async cadastrar(dados: CriarProfessorDTO) {
    const emailExistente = await this.repositorio.findOneBy({ email: dados.email });
    if (emailExistente) {
      throw new AppError('E-mail já cadastrado.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(dados.senha, salt);

    const professor = await this.criar({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
    });

    const { senhaHash: _, ...professorSemSenha } = professor;
    return professorSemSenha;
  }

  async login(dados: LoginProfessorDTO) {
    const professor = await this.repositorio.findOneBy({ email: dados.email });
    if (!professor) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const senhaValida = await bcrypt.compare(dados.senha, professor.senhaHash);
    if (!senhaValida) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = JwtUtil.gerarToken({
      sub: professor.id,
      email: professor.email,
    });

    const { senhaHash: _, ...professorSemSenha } = professor;
    return {
      professor: professorSemSenha,
      token,
    };
  }
}