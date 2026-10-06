module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  clearMocks: true,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  modulePathIgnorePatterns: ['<rootDir>/tia-backend/'],
};