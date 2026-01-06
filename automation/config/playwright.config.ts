import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Kitchen Orders Automation
 * 
 * @description Configuration file for running automated tests
 * @see https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  // Test directory
  testDir: '../tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: '../reports/html-report' }],
    ['json', { outputFile: '../reports/test-results.json' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for the application
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'on-first-retry',
    
    // Set viewport for RTL Hebrew interface
    viewport: { width: 1280, height: 720 },
    
    // Set locale to Hebrew
    locale: 'he-IL',
    
    // Set timezone to Israel
    timezoneId: 'Asia/Jerusalem',
    
    // Increase timeout for slower operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Global setup/teardown
  globalSetup: undefined, // Can be set to a file path if needed
  globalTeardown: undefined,

  // Configure projects for different scenarios
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop Chrome - Primary browser
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'automation/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'automation/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'automation/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'automation/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'automation/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Test timeout
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Output folder for test artifacts
  outputDir: '../reports/test-artifacts',
});
