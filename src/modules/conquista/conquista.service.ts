import { Repository } from 'typeorm';
import { Conquista } from './conquista.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { AppError } from '../../common/utils/app-error';
import { CriarConquistaDTO, AtualizarConquistaDTO } from './conquista.schema';

export class ConquistaService extends ServiceGenerico<Conquista> {
  constructor(repositorio: Repository<Conquista>) {
    super(repositorio);
  }

  async criarConquista(dados: CriarConquistaDTO) {
    await this.garantirNomeUnico(dados.nome);
    return this.criar(dados);
  }

  async atualizarConquista(id: number, dados: AtualizarConquistaDTO) {
    if (dados.nome) await this.garantirNomeUnico(dados.nome, id);
    return this.atualizar(id, dados);
  }

  private async garantirNomeUnico(nome: string, ignorarId?: number) {
    const existente = await this.repositorio.findOneBy({ nome });
    if (existente && existente.id !== ignorarId) {
      throw new AppError('Já existe uma conquista com esse nome.', 409);
    }
  }
}