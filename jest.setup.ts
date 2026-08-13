import AsyncStorage from '@react-native-async-storage/async-storage';

// Global mocks & configuration for Jest tests
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Suppress false positive React 18/19 act warnings arising from async/waitFor testing library internal setups
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('The current testing environment is not configured to support act')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock AsyncStorage using official mock implementation
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @expo/vector-icons deterministically
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'Icon',
  Ionicons: 'Icon',
  Feather: 'Icon',
  FontAwesome: 'Icon',
}), { virtual: true });

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Clear state and mocks before every test execution for 100% idempotency
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});


