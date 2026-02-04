// Add custom jest matchers
require("@testing-library/jest-dom");

// Mock global objects if needed
global.console = {
  ...console,
  // Uncomment to ignore console.log during tests
  // log: jest.fn(),
  error: jest.fn(),
};
