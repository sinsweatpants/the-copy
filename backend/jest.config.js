export default {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true, diagnostics: false }] },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transformIgnorePatterns: []
};
