/**
 * Função serverless da Vercel. Todas as rotas são reescritas para cá (ver vercel.json).
 * O TypeScript é compilado para dist/ por `npm run build` (tsc com o tsconfig do projeto)
 * antes do empacotamento da função, então a Vercel só recebe JavaScript pronto.
 */
module.exports = require('../dist/vercel').default;
