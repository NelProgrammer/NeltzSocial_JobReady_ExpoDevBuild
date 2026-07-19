// @ts-nocheck
// jest.setup.js
// Global mocks for Jest tests

global.IS_REACT_ACT_ENVIRONMENT = true;

// Suppress false positive React 18/19 act warnings arising from async/waitFor testing library internal setups
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('The current testing environment is not configured to support act')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock AsyncStorage using the provided mock implementation
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

