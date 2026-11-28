import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';

import { AppDataSource } from '../data-source';
import { Professor } from '../../models/professor.entity';
import { Turma } from '../../models/turma.entity';
import { Aluno, SituacaoAluno } from '../../models/aluno.entity';
import { Conquista, CategoriaConquista } from '../../models/conquista.entity';
import { TurmaConquista } from '../../models/turma-conquista.entity';
import { AlunoConquista, StatusConquista } from '../../models/aluno-conquista.entity';
import { Aula, AulaAtividade, AulaStatus } from '../../models/aula.entity';
import { AulaConquista } from '../../models/aula-conquista.entity';
import { Registro } from '../../models/registro.entity';

/**
 * Seed de desenvolvimento: popula todas as tabelas com dados coerentes de uma
 * escola de inglês infantil (professores, turmas, alunos, conquistas, aulas,
 * metas por aula, progresso dos alunos e registros de acompanhamento).
 *
 * Uso:
 *   npm run seed            -> aborta se o banco já tiver dados
 *   npm run seed -- --reset -> APAGA todos os dados e popula novamente
 *
 * As datas das aulas são relativas ao dia em que a seed roda (aulas passadas
 * concluídas, aula de hoje em andamento e próximas aulas planejadas).
 *
 * @author caiolaurindo
 */

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** PRNG determinístico (mulberry32) para que a seed gere sempre os mesmos dados. */
function criarAleatorio(semente: number) {
  let estado = semente;
  const proximo = () => {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: proximo,
    chance: (probabilidade: number) => proximo() < probabilidade,
    escolher: <T>(lista: readonly T[]): T => lista[Math.floor(proximo() * lista.length)],
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
  };
}

const aleatorio = criarAleatorio(20261127);

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

/** Data de nascimento para uma criança que terá `idade` anos no ano corrente. */
function dataNascimentoParaIdade(idade: number): string {
  const ano = new Date().getFullYear() - idade;
  const mes = aleatorio.inteiro(1, 12);
  const dia = aleatorio.inteiro(1, 28);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Dados de referência
// ---------------------------------------------------------------------------

const SENHA_PADRAO = 'Senha@123';

const PROFESSORES = [
  { nome: 'Ana Paula Ferreira', email: 'ana.ferreira@tia.com' },
  { nome: 'Ricardo Mendes', email: 'ricardo.mendes@tia.com' },
];

type DefinicaoConquista = {
  nome: string;
  descricao: string;
  categoria: CategoriaConquista;
  nivel: string;
  ativa?: boolean;
};

const CONQUISTAS_PROFESSORA_ANA: DefinicaoConquista[] = [
  { nome: 'Se apresentar em inglês', descricao: 'Diz o próprio nome e idade usando "My name is..." e "I am ... years old".', categoria: CategoriaConquista.SPEAKING, nivel: 'A1' },
  { nome: 'Pedir ajuda em inglês', descricao: 'Usa frases como "Can you help me?" e "I don\'t understand" durante a aula.', categoria: CategoriaConquista.SPEAKING, nivel: 'A1' },
  { nome: 'Descrever a rotina', descricao: 'Conta o que faz no dia a dia usando o presente simples ("I wake up", "I go to school").', categoria: CategoriaConquista.SPEAKING, nivel: 'A2' },
  { nome: 'Seguir comandos de sala', descricao: 'Compreende e executa comandos como "stand up", "sit down", "open your book".', categoria: CategoriaConquista.LISTENING, nivel: 'A1' },
  { nome: 'Compreender histórias curtas', descricao: 'Entende a ideia principal de uma história curta contada em inglês.', categoria: CategoriaConquista.LISTENING, nivel: 'A2' },
  { nome: 'Usar o verbo to be', descricao: 'Forma frases afirmativas e negativas com am / is / are.', categoria: CategoriaConquista.GRAMMAR, nivel: 'A1' },
  { nome: 'Usar o presente contínuo', descricao: 'Descreve ações acontecendo agora ("She is running").', categoria: CategoriaConquista.GRAMMAR, nivel: 'A2' },
  { nome: 'Cores e números até 20', descricao: 'Reconhece e nomeia as cores básicas e os números de 1 a 20.', categoria: CategoriaConquista.VOCABULARY, nivel: 'A1' },
  { nome: 'Animais e família', descricao: 'Nomeia animais comuns e membros da família.', categoria: CategoriaConquista.VOCABULARY, nivel: 'A1' },
  { nome: 'Ler frases simples', descricao: 'Lê em voz alta frases curtas com vocabulário conhecido.', categoria: CategoriaConquista.READING, nivel: 'A1' },
  { nome: 'Interpretar pequenos textos', descricao: 'Responde perguntas sobre um texto curto lido em inglês.', categoria: CategoriaConquista.READING, nivel: 'A2' },
  { nome: 'Escrever o próprio nome e idade', descricao: 'Escreve uma frase de apresentação sem apoio.', categoria: CategoriaConquista.WRITING, nivel: 'A1' },
  { nome: 'Escrever um pequeno parágrafo', descricao: 'Produz 3 a 4 frases sobre si mesmo ou sobre um tema da aula.', categoria: CategoriaConquista.WRITING, nivel: 'A2' },
  // Conquista arquivada (a tela arquiva em vez de excluir)
  { nome: 'Cantar a música do alfabeto', descricao: 'Canta a "ABC song" acompanhando a turma.', categoria: CategoriaConquista.LISTENING, nivel: 'A1', ativa: false },
];

const CONQUISTAS_PROFESSOR_RICARDO: DefinicaoConquista[] = [
  { nome: 'Cumprimentar e se despedir', descricao: 'Usa "Hello", "Good morning", "Goodbye" e "See you" no momento certo.', categoria: CategoriaConquista.SPEAKING, nivel: 'A1' },
  { nome: 'Identificar sons das letras', descricao: 'Reconhece o som inicial de palavras simples (phonics).', categoria: CategoriaConquista.LISTENING, nivel: 'A1' },
  { nome: 'Pronomes pessoais', descricao: 'Usa I, you, he, she, we e they corretamente.', categoria: CategoriaConquista.GRAMMAR, nivel: 'A1' },
  { nome: 'Frutas e alimentos', descricao: 'Nomeia frutas e alimentos do dia a dia.', categoria: CategoriaConquista.VOCABULARY, nivel: 'A1' },
  { nome: 'Ler palavras com imagens', descricao: 'Associa palavras escritas às imagens correspondentes.', categoria: CategoriaConquista.READING, nivel: 'A1' },
  { nome: 'Copiar palavras corretamente', descricao: 'Copia palavras do quadro sem erros de grafia.', categoria: CategoriaConquista.WRITING, nivel: 'A1' },
];

type DefinicaoTurma = {
  professor: number;
  nome: string;
  serie: string;
  faixaEtaria: string;
  idades: [number, number];
  turno: 'Manhã' | 'Tarde' | 'Noite';
  horario: [string, string];
  diaSemana: number; // 0 = domingo ... 6 = sábado
  descricao: string;
  arquivada?: boolean;
  conquistas: string[];
  temas: { nome: string; assunto: string; conquistas: string[] }[];
};

const TURMAS: DefinicaoTurma[] = [
  {
    professor: 0,
    nome: 'Kids 1 - Turma A',
    serie: '1º ano',
    faixaEtaria: '6 a 7 anos',
    idades: [6, 7],
    turno: 'Manhã',
    horario: ['08:00', '09:00'],
    diaSemana: 1,
    descricao: 'Primeiro contato com o inglês: músicas, jogos e vocabulário básico.',
    conquistas: ['Se apresentar em inglês', 'Seguir comandos de sala', 'Cores e números até 20', 'Animais e família', 'Usar o verbo to be', 'Ler frases simples', 'Escrever o próprio nome e idade', 'Pedir ajuda em inglês'],
    temas: [
      { nome: 'Hello, friends!', assunto: 'Cumprimentos e apresentação pessoal', conquistas: ['Se apresentar em inglês'] },
      { nome: 'Classroom commands', assunto: 'Comandos de sala de aula com jogo "Simon says"', conquistas: ['Seguir comandos de sala'] },
      { nome: 'Rainbow colors', assunto: 'Cores com atividade de pintura', conquistas: ['Cores e números até 20'] },
      { nome: 'Let\'s count!', assunto: 'Números de 1 a 20 com músicas', conquistas: ['Cores e números até 20'] },
      { nome: 'My family', assunto: 'Membros da família com álbum de fotos', conquistas: ['Animais e família', 'Se apresentar em inglês'] },
      { nome: 'At the farm', assunto: 'Animais da fazenda e seus sons', conquistas: ['Animais e família'] },
      { nome: 'I am happy', assunto: 'Verbo to be com sentimentos', conquistas: ['Usar o verbo to be'] },
      { nome: 'Reading time', assunto: 'Leitura compartilhada de frases curtas', conquistas: ['Ler frases simples', 'Pedir ajuda em inglês'] },
      { nome: 'This is me', assunto: 'Produção escrita: cartão de apresentação', conquistas: ['Escrever o próprio nome e idade'] },
      { nome: 'Review and games', assunto: 'Revisão com bingo de vocabulário', conquistas: ['Cores e números até 20', 'Animais e família'] },
    ],
  },
  {
    professor: 0,
    nome: 'Kids 2 - Turma B',
    serie: '3º ano',
    faixaEtaria: '8 a 9 anos',
    idades: [8, 9],
    turno: 'Tarde',
    horario: ['14:00', '15:00'],
    diaSemana: 3,
    descricao: 'Ampliação de vocabulário e primeiras estruturas gramaticais.',
    conquistas: ['Pedir ajuda em inglês', 'Seguir comandos de sala', 'Compreender histórias curtas', 'Usar o verbo to be', 'Usar o presente contínuo', 'Animais e família', 'Ler frases simples', 'Escrever o próprio nome e idade'],
    temas: [
      { nome: 'Back to school', assunto: 'Objetos escolares e pedidos de ajuda', conquistas: ['Pedir ajuda em inglês'] },
      { nome: 'Who are they?', assunto: 'Verbo to be com pronomes', conquistas: ['Usar o verbo to be'] },
      { nome: 'Wild animals', assunto: 'Animais selvagens e habitats', conquistas: ['Animais e família'] },
      { nome: 'Story time: The Lion and the Mouse', assunto: 'Compreensão auditiva de fábula', conquistas: ['Compreender histórias curtas'] },
      { nome: 'What are you doing?', assunto: 'Presente contínuo com mímica', conquistas: ['Usar o presente contínuo'] },
      { nome: 'Action verbs', assunto: 'Verbos de ação e comandos', conquistas: ['Usar o presente contínuo', 'Seguir comandos de sala'] },
      { nome: 'Little readers', assunto: 'Leitura de mini-livros', conquistas: ['Ler frases simples'] },
      { nome: 'About me', assunto: 'Ficha de apresentação escrita', conquistas: ['Escrever o próprio nome e idade'] },
      { nome: 'Story time: The Three Little Pigs', assunto: 'Reconto de história com fantoches', conquistas: ['Compreender histórias curtas', 'Pedir ajuda em inglês'] },
      { nome: 'Review quiz', assunto: 'Quiz de revisão em equipes', conquistas: ['Usar o verbo to be', 'Usar o presente contínuo'] },
    ],
  },
  {
    professor: 0,
    nome: 'Teens - Turma C',
    serie: '5º ano',
    faixaEtaria: '10 a 11 anos',
    idades: [10, 11],
    turno: 'Tarde',
    horario: ['16:00', '17:30'],
    diaSemana: 5,
    descricao: 'Comunicação em situações do dia a dia, leitura e produção de textos curtos.',
    conquistas: ['Descrever a rotina', 'Pedir ajuda em inglês', 'Compreender histórias curtas', 'Usar o presente contínuo', 'Interpretar pequenos textos', 'Escrever um pequeno parágrafo', 'Ler frases simples', 'Usar o verbo to be'],
    temas: [
      { nome: 'My daily routine', assunto: 'Rotina com presente simples', conquistas: ['Descrever a rotina'] },
      { nome: 'Time and schedules', assunto: 'Horas e agenda semanal', conquistas: ['Descrever a rotina', 'Usar o verbo to be'] },
      { nome: 'Right now!', assunto: 'Presente contínuo x presente simples', conquistas: ['Usar o presente contínuo'] },
      { nome: 'Reading club', assunto: 'Interpretação de texto sobre esportes', conquistas: ['Interpretar pequenos textos', 'Ler frases simples'] },
      { nome: 'Podcast listening', assunto: 'Escuta de áudio curto sobre viagens', conquistas: ['Compreender histórias curtas'] },
      { nome: 'Write about you', assunto: 'Parágrafo sobre hobbies', conquistas: ['Escrever um pequeno parágrafo'] },
      { nome: 'Asking for help', assunto: 'Role play: na biblioteca', conquistas: ['Pedir ajuda em inglês'] },
      { nome: 'News for kids', assunto: 'Leitura de notícia adaptada', conquistas: ['Interpretar pequenos textos'] },
      { nome: 'My weekend', assunto: 'Produção escrita sobre o fim de semana', conquistas: ['Escrever um pequeno parágrafo', 'Descrever a rotina'] },
      { nome: 'Final presentation', assunto: 'Apresentação oral em grupos', conquistas: ['Descrever a rotina', 'Pedir ajuda em inglês'] },
    ],
  },
  {
    professor: 1,
    nome: 'Starters - Turma D',
    serie: '2º ano',
    faixaEtaria: '7 a 8 anos',
    idades: [7, 8],
    turno: 'Manhã',
    horario: ['10:00', '11:00'],
    diaSemana: 2,
    descricao: 'Turma iniciante com foco em phonics e vocabulário do cotidiano.',
    conquistas: ['Cumprimentar e se despedir', 'Identificar sons das letras', 'Pronomes pessoais', 'Frutas e alimentos', 'Ler palavras com imagens', 'Copiar palavras corretamente'],
    temas: [
      { nome: 'Good morning!', assunto: 'Cumprimentos ao longo do dia', conquistas: ['Cumprimentar e se despedir'] },
      { nome: 'Phonics A to E', assunto: 'Sons das letras A a E', conquistas: ['Identificar sons das letras'] },
      { nome: 'Fruit salad', assunto: 'Frutas com atividade de culinária', conquistas: ['Frutas e alimentos'] },
      { nome: 'I and you', assunto: 'Pronomes pessoais com bonecos', conquistas: ['Pronomes pessoais'] },
      { nome: 'Picture words', assunto: 'Jogo da memória palavra x imagem', conquistas: ['Ler palavras com imagens'] },
      { nome: 'Phonics F to J', assunto: 'Sons das letras F a J', conquistas: ['Identificar sons das letras'] },
      { nome: 'Lunch box', assunto: 'Alimentos da lancheira', conquistas: ['Frutas e alimentos', 'Copiar palavras corretamente'] },
      { nome: 'Copy and draw', assunto: 'Cópia de palavras com ilustração', conquistas: ['Copiar palavras corretamente'] },
      { nome: 'He and she', assunto: 'Pronomes he/she com fotos', conquistas: ['Pronomes pessoais'] },
      { nome: 'See you!', assunto: 'Revisão e despedidas', conquistas: ['Cumprimentar e se despedir', 'Ler palavras com imagens'] },
    ],
  },
];

const NOMES_ALUNOS = [
  'Miguel Santos', 'Helena Oliveira', 'Arthur Souza', 'Alice Lima', 'Gael Pereira',
  'Laura Costa', 'Theo Rodrigues', 'Maria Clara Almeida', 'Heitor Nascimento', 'Valentina Araújo',
  'Ravi Carvalho', 'Cecília Gomes', 'Davi Martins', 'Manuela Ribeiro', 'Bernardo Rocha',
  'Isabella Barbosa', 'Gabriel Dias', 'Sophia Teixeira', 'Lorenzo Moreira', 'Lívia Cardoso',
  'Samuel Correia', 'Júlia Freitas', 'Benjamin Monteiro', 'Antonella Pinto', 'Pedro Henrique Castro',
  'Maitê Vieira', 'Matheus Batista', 'Lara Fernandes', 'Lucas Mendes', 'Beatriz Ramos',
  'Nicolas Azevedo', 'Mariana Duarte', 'Joaquim Cunha', 'Lorena Barros', 'Enzo Gabriel Lopes',
  'Esther Campos', 'Rafael Nunes', 'Clara Rezende', 'Henrique Farias', 'Elisa Moura',
];

const NOMES_RESPONSAVEIS = [
  'Fernanda', 'Carlos', 'Juliana', 'Marcelo', 'Patrícia', 'Rodrigo', 'Camila', 'André',
  'Aline', 'Thiago', 'Renata', 'Bruno', 'Vanessa', 'Leandro', 'Tatiane', 'Fábio',
];

const OBSERVACOES_POR_SITUACAO: Record<SituacaoAluno, string[]> = {
  [SituacaoAluno.DESTAQUE]: [
    'Muito participativo, ajuda os colegas e sempre se voluntaria para falar.',
    'Aprende rápido e já usa frases completas em inglês espontaneamente.',
    'Excelente pronúncia; pode receber atividades de desafio.',
  ],
  [SituacaoAluno.NO_RITMO]: [
    'Acompanha bem o conteúdo e realiza as atividades propostas.',
    'Participa quando solicitado; está evoluindo de forma constante.',
    'Gosta das atividades com música e jogos.',
  ],
  [SituacaoAluno.ATENCAO]: [
    'Tímido para falar em inglês; precisa de incentivo e atividades em dupla.',
    'Apresenta dispersão nas atividades longas; responde melhor a tarefas curtas.',
    'Faltou em algumas aulas e precisa de reforço no vocabulário básico.',
  ],
};

const CORES_ATIVIDADE = ['purple', 'green', 'amber', 'blue', 'rose', 'navy', 'slate'] as const;

const ATIVIDADES_POSSIVEIS = [
  'Warm-up com música', 'Flashcards', 'Jogo em duplas', 'Leitura compartilhada', 'Role play',
  'Atividade no caderno', 'Desenho e legenda', 'Quiz rápido', 'Roda de conversa', 'Jogo de mímica',
];

const TEXTOS_PARTICIPACAO: Record<SituacaoAluno, string[]> = {
  [SituacaoAluno.DESTAQUE]: ['Participou ativamente e respondeu em inglês sem apoio.', 'Liderou a atividade em grupo e ajudou colegas.', 'Fez perguntas em inglês e se ofereceu para ler.'],
  [SituacaoAluno.NO_RITMO]: ['Participou da aula respondendo às perguntas.', 'Participou das atividades em dupla.', 'Respondeu quando chamado, com boa pronúncia.'],
  [SituacaoAluno.ATENCAO]: ['Participou pouco; respondeu apenas com incentivo.', 'Participou melhor na atividade com música.', 'Ficou mais quieto, mas acompanhou o grupo.'],
};

const TEXTOS_ATIVIDADE: Record<SituacaoAluno, string[]> = {
  [SituacaoAluno.DESTAQUE]: ['Concluiu a atividade antes do tempo e fez a extra.', 'Realizou a atividade com todas as respostas corretas.'],
  [SituacaoAluno.NO_RITMO]: ['Realizou a atividade com poucos erros.', 'Concluiu a atividade proposta.'],
  [SituacaoAluno.ATENCAO]: ['Realizou parte da atividade com ajuda.', 'Não concluiu a atividade no tempo previsto.'],
};

const TEXTOS_COMANDOS: Record<SituacaoAluno, string[]> = {
  [SituacaoAluno.DESTAQUE]: ['Seguiu todos os comandos sem precisar de demonstração.'],
  [SituacaoAluno.NO_RITMO]: ['Seguiu os comandos com pequena demonstração.', 'Seguiu os comandos na maior parte do tempo.'],
  [SituacaoAluno.ATENCAO]: ['Precisou de repetição e gestos para seguir os comandos.', 'Seguiu os comandos observando os colegas.'],
};

const TEXTOS_DIFICULDADE = [
  'Confundiu a pronúncia de palavras parecidas.',
  'Teve dificuldade com a ordem das palavras na frase.',
  'Esqueceu parte do vocabulário da aula anterior.',
  'Dificuldade em compreender o áudio na primeira escuta.',
  'Trocou letras na escrita das palavras novas.',
];

const TEXTOS_OBSERVACAO_LIVRE = [
  'Chegou animado contando o que aprendeu em casa.',
  'Levou para casa a atividade para terminar com a família.',
  'Pediu para repetir a música no final da aula.',
  'Sentou com um novo colega e se integrou bem.',
  'Trouxe material de casa relacionado ao tema da aula.',
];

const METAS_AULA = [
  'Pelo menos 70% da turma usar a estrutura sem apoio visual.',
  'Todos os alunos falarem ao menos uma frase com o conteúdo da aula.',
  'Alunos identificarem o vocabulário apresentado nos flashcards.',
  'Turma realizar a atividade em duplas com autonomia.',
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const TABELAS = [
  'registro', 'aula_conquista', 'aluno_conquista', 'turma_conquista',
  'aula', 'aluno', 'conquista', 'turma', 'professor',
];

async function limparBanco(manager: EntityManager) {
  await manager.query(`TRUNCATE TABLE ${TABELAS.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

/** Distribuição de status de conquista coerente com a situação do aluno. */
function sortearStatus(situacao: SituacaoAluno): StatusConquista {
  const pesos: Record<SituacaoAluno, [number, number, number, number]> = {
    // [NAO_TRABALHADO, EM_DESENVOLVIMENTO, EM_DESENVOLVIMENTO_AVANCADO, CONQUISTADO]
    [SituacaoAluno.DESTAQUE]: [0.05, 0.1, 0.25, 0.6],
    [SituacaoAluno.NO_RITMO]: [0.1, 0.3, 0.3, 0.3],
    [SituacaoAluno.ATENCAO]: [0.35, 0.45, 0.15, 0.05],
  };
  const ordem = [
    StatusConquista.NAO_TRABALHADO,
    StatusConquista.EM_DESENVOLVIMENTO,
    StatusConquista.EM_DESENVOLVIMENTO_AVANCADO,
    StatusConquista.CONQUISTADO,
  ];
  let sorteio = aleatorio.numero();
  for (let i = 0; i < ordem.length; i++) {
    sorteio -= pesos[situacao][i];
    if (sorteio <= 0) return ordem[i];
  }
  return ordem[ordem.length - 1];
}

/** Data da n-ésima ocorrência do dia da semana relativa à semana atual. */
function dataDaSemana(hoje: Date, diaSemana: number, deslocamentoSemanas: number): Date {
  const diferenca = diaSemana - hoje.getDay();
  return somarDias(hoje, diferenca + deslocamentoSemanas * 7);
}

function montarAtividades(): AulaAtividade[] {
  const quantidade = aleatorio.inteiro(2, 4);
  const disponiveis = [...ATIVIDADES_POSSIVEIS];
  const atividades: AulaAtividade[] = [];
  for (let i = 0; i < quantidade; i++) {
    const indice = aleatorio.inteiro(0, disponiveis.length - 1);
    const [label] = disponiveis.splice(indice, 1);
    atividades.push({
      id: `atv-${i + 1}`,
      label,
      color: CORES_ATIVIDADE[i % CORES_ATIVIDADE.length],
    });
  }
  return atividades;
}

async function popular(manager: EntityManager) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const anoLetivo = hoje.getFullYear();

  // 1. Professores -----------------------------------------------------------
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  const professores = await manager.save(
    Professor,
    PROFESSORES.map((p) => manager.create(Professor, { ...p, senhaHash }))
  );

  // 2. Conquistas (por professor) ---------------------------------------------
  const conquistasPorProfessor = await Promise.all(
    [CONQUISTAS_PROFESSORA_ANA, CONQUISTAS_PROFESSOR_RICARDO].map((lista, indice) =>
      manager.save(
        Conquista,
        lista.map((c) =>
          manager.create(Conquista, {
            ...c,
            ativa: c.ativa ?? true,
            professorId: professores[indice].id,
          })
        )
      )
    )
  );

  const buscarConquista = (professorIndice: number, nome: string) => {
    const conquista = conquistasPorProfessor[professorIndice].find((c) => c.nome === nome);
    if (!conquista) throw new Error(`Conquista "${nome}" não encontrada na seed.`);
    return conquista;
  };

  const resumo = { turmas: 0, alunos: 0, aulas: 0, metas: 0, progressos: 0, registros: 0 };
  let indiceNome = 0;

  for (const definicao of TURMAS) {
    const professor = professores[definicao.professor];

    // 3. Turma ---------------------------------------------------------------
    const turma = await manager.save(
      Turma,
      manager.create(Turma, {
        nome: definicao.nome,
        serie: definicao.serie,
        anoLetivo,
        faixaEtaria: definicao.faixaEtaria,
        turno: definicao.turno,
        descricao: definicao.descricao,
        arquivada: definicao.arquivada ?? false,
        professor,
      })
    );
    resumo.turmas++;

    // 4. Alunos (10 por turma: 2 destaque, 6 no ritmo, 2 atenção) ---------------
    const situacoes: SituacaoAluno[] = [
      SituacaoAluno.DESTAQUE, SituacaoAluno.DESTAQUE,
      ...Array(6).fill(SituacaoAluno.NO_RITMO),
      SituacaoAluno.ATENCAO, SituacaoAluno.ATENCAO,
    ];
    const alunos = await manager.save(
      Aluno,
      situacoes.map((situacao) => {
        const nome = NOMES_ALUNOS[indiceNome++ % NOMES_ALUNOS.length];
        const sobrenome = nome.split(' ').slice(-1)[0];
        return manager.create(Aluno, {
          nome,
          dataNascimento: dataNascimentoParaIdade(aleatorio.inteiro(...definicao.idades)),
          responsavel: `${aleatorio.escolher(NOMES_RESPONSAVEIS)} ${sobrenome}`,
          situacao,
          observacoes: aleatorio.escolher(OBSERVACOES_POR_SITUACAO[situacao]),
          turma,
        });
      })
    );
    resumo.alunos += alunos.length;

    // 5. Conquistas vinculadas à turma ---------------------------------------
    const conquistasTurma = definicao.conquistas.map((nome) => buscarConquista(definicao.professor, nome));
    await manager.save(
      TurmaConquista,
      conquistasTurma.map((c) => manager.create(TurmaConquista, { turmaId: turma.id, conquistaId: c.id }))
    );

    // 6. Aulas: 7 passadas (concluídas), 1 hoje/esta semana, 2 futuras -----------
    const aulas: Aula[] = [];
    for (let i = 0; i < definicao.temas.length; i++) {
      const tema = definicao.temas[i];
      const semana = i - 7; // -7..-1 passadas, 0 atual, 1..2 futuras
      const data = dataDaSemana(hoje, definicao.diaSemana, semana);
      const diff = data.getTime() - hoje.getTime();

      let status: AulaStatus;
      if (diff < 0) status = 'concluida';
      else if (diff === 0) status = 'em_andamento';
      else if (semana === 0 || semana === 1) status = 'proxima';
      else status = 'planejada';

      aulas.push(
        manager.create(Aula, {
          nome: tema.nome,
          assunto: tema.assunto,
          data: formatarData(data),
          horarioInicio: definicao.horario[0],
          horarioFim: definicao.horario[1],
          status,
          atividades: montarAtividades(),
          turma,
          professor,
        })
      );
    }
    // Garante uma única aula "proxima" por turma (a mais cedo); as demais futuras ficam "planejada".
    const futuras = aulas.filter((a) => a.status === 'proxima');
    futuras.slice(1).forEach((a) => (a.status = 'planejada'));

    const aulasSalvas = await manager.save(Aula, aulas);
    resumo.aulas += aulasSalvas.length;

    // 7. Metas (conquistas) de cada aula --------------------------------------
    const metasPorAula = new Map<number, Conquista[]>();
    const aulaConquistas: AulaConquista[] = [];
    aulasSalvas.forEach((aula, i) => {
      const conquistas = definicao.temas[i].conquistas.map((nome) => buscarConquista(definicao.professor, nome));
      metasPorAula.set(aula.id, conquistas);
      for (const conquista of conquistas) {
        aulaConquistas.push(
          manager.create(AulaConquista, { aula, conquista, meta: aleatorio.escolher(METAS_AULA) })
        );
      }
    });
    await manager.save(AulaConquista, aulaConquistas);
    resumo.metas += aulaConquistas.length;

    // 8. Progresso de cada aluno em cada conquista da turma ------------------
    // Só conquistas já trabalhadas em aulas concluídas podem ter progresso.
    const concluidas = aulasSalvas.filter((a) => a.status === 'concluida');
    const conquistasTrabalhadas = new Set(
      concluidas.flatMap((a) => (metasPorAula.get(a.id) ?? []).map((c) => c.id))
    );
    const progresso = new Map<string, AlunoConquista>();
    for (const aluno of alunos) {
      for (const conquista of conquistasTurma) {
        const status = conquistasTrabalhadas.has(conquista.id)
          ? sortearStatus(aluno.situacao)
          : StatusConquista.NAO_TRABALHADO;
        progresso.set(
          `${aluno.id}:${conquista.id}`,
          manager.create(AlunoConquista, {
            alunoId: aluno.id,
            conquistaId: conquista.id,
            status,
            dataConquista: null,
            observacao:
              status === StatusConquista.CONQUISTADO
                ? 'Demonstrou a habilidade com autonomia em aula.'
                : status === StatusConquista.EM_DESENVOLVIMENTO_AVANCADO
                  ? 'Quase lá: já usa com pequeno apoio da professora.'
                  : status === StatusConquista.EM_DESENVOLVIMENTO
                    ? 'Em prática; precisa de modelo e repetição.'
                    : undefined,
          })
        );
      }
    }

    // 9. Registros das aulas concluídas (com presença ~90%) -------------------
    const registros: Registro[] = [];
    for (const aula of concluidas) {
      const metas = metasPorAula.get(aula.id) ?? [];
      for (const aluno of alunos) {
        const faltou = aluno.situacao === SituacaoAluno.ATENCAO ? aleatorio.chance(0.2) : aleatorio.chance(0.07);
        if (faltou) continue;

        // Conquista alcançada nesta aula: primeira meta da aula que o aluno
        // conquistou e que ainda não tem data registrada.
        let conquistaDaAula: Conquista | null = null;
        for (const meta of metas) {
          const item = progresso.get(`${aluno.id}:${meta.id}`);
          if (item && item.status === StatusConquista.CONQUISTADO && !item.dataConquista && aleatorio.chance(0.7)) {
            item.dataConquista = aula.data as unknown as Date;
            conquistaDaAula = meta;
            break;
          }
        }

        const teveDificuldade =
          aluno.situacao === SituacaoAluno.ATENCAO ? aleatorio.chance(0.6)
            : aluno.situacao === SituacaoAluno.NO_RITMO ? aleatorio.chance(0.2)
              : aleatorio.chance(0.05);

        registros.push(
          manager.create(Registro, {
            alunoId: aluno.id,
            aulaId: aula.id,
            conquistaId: conquistaDaAula?.id ?? null,
            data: aula.data,
            participacao: aleatorio.escolher(TEXTOS_PARTICIPACAO[aluno.situacao]),
            realizouAtividade: aleatorio.escolher(TEXTOS_ATIVIDADE[aluno.situacao]),
            seguiuComandos: aleatorio.escolher(TEXTOS_COMANDOS[aluno.situacao]),
            dificuldades: teveDificuldade ? aleatorio.escolher(TEXTOS_DIFICULDADE) : null,
            observacoesLivres: conquistaDaAula
              ? `Alcançou a conquista na atividade "${(aula.atividades ?? [])[0]?.label ?? aula.nome}".`
              : aleatorio.chance(0.25) ? aleatorio.escolher(TEXTOS_OBSERVACAO_LIVRE) : null,
          })
        );
      }
    }

    // Registros avulsos (sem aula vinculada), ex.: observação no recreio ou reunião com responsável.
    for (const aluno of alunos.filter((a) => a.situacao !== SituacaoAluno.NO_RITMO)) {
      const data = formatarData(somarDias(hoje, -aleatorio.inteiro(3, 20)));
      registros.push(
        manager.create(Registro, {
          alunoId: aluno.id,
          aulaId: null,
          conquistaId: null,
          data,
          participacao: null,
          realizouAtividade: null,
          seguiuComandos: null,
          dificuldades: aluno.situacao === SituacaoAluno.ATENCAO ? 'Responsável relatou que a criança tem receio de errar ao falar.' : null,
          observacoesLivres:
            aluno.situacao === SituacaoAluno.ATENCAO
              ? 'Conversa com o responsável: combinado reforço com músicas em casa.'
              : 'Usou inglês espontaneamente com os colegas durante o intervalo.',
        })
      );
    }

    // Conquistas marcadas como conquistadas sem aula específica recebem a data
    // da última aula concluída (ex.: avaliação contínua).
    const ultimaConcluida = concluidas[concluidas.length - 1];
    for (const item of progresso.values()) {
      if (item.status === StatusConquista.CONQUISTADO && !item.dataConquista && ultimaConcluida) {
        item.dataConquista = ultimaConcluida.data as unknown as Date;
      }
    }

    await manager.save(AlunoConquista, [...progresso.values()]);
    await manager.save(Registro, registros, { chunk: 100 });
    resumo.progressos += progresso.size;
    resumo.registros += registros.length;
  }

  return {
    professores: professores.length,
    conquistas: conquistasPorProfessor.flat().length,
    ...resumo,
  };
}

async function executar() {
  const resetar = process.argv.includes('--reset');

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('Variável de ambiente DATABASE_URL é obrigatória.');
  }

  await AppDataSource.initialize();
  try {
    const [{ total }] = await AppDataSource.query('SELECT COUNT(*)::int AS total FROM "professor"');
    if (total > 0 && !resetar) {
      console.error(
        `O banco já possui ${total} professor(es). Para apagar tudo e popular novamente, rode: npm run seed -- --reset`
      );
      process.exitCode = 1;
      return;
    }

    const resultado = await AppDataSource.transaction(async (manager) => {
      if (resetar) await limparBanco(manager);
      return popular(manager);
    });

    console.log('Seed concluída com sucesso:');
    console.table(resultado);
    console.log('\nLogins disponíveis (senha para todos: %s):', SENHA_PADRAO);
    PROFESSORES.forEach((p) => console.log(`  - ${p.nome}: ${p.email}`));
  } finally {
    await AppDataSource.destroy();
  }
}

executar().catch((erro) => {
  console.error('Erro ao executar a seed:', erro);
  process.exit(1);
});
