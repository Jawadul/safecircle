/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '@safecircle/shared-types': '<rootDir>/../../packages/shared-types/src/index.ts',
    '@safecircle/shared-utils': '<rootDir>/../../packages/shared-utils/src/index.ts',
    '@safecircle/ui': '<rootDir>/../../packages/ui/src/index.ts',
  },
};
