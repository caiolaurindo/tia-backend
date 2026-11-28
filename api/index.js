/**
 * Função serverless da Vercel. Todas as rotas são reescritas para cá (ver vercel.json).
 * O código TypeScript é compilado para dist/ por `npm run build` antes do empacotamento
 * da função — a Vercel não compila o TS do projeto porque usamos TypeScript 7, que não
 * expõe a API JS que o runtime @vercel/node utiliza.
 */
module.exports = require('../dist/vercel').default;
