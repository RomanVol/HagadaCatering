/**
 * Login Page Locators
 * 
 * @description All locators for the login page are defined here
 * This allows for easy maintenance and updates when UI changes
 */
export const LoginLocators = {
  // Container
  container: 'main',
  
  // Logo and branding
  shieldIcon: '[data-testid="shield-icon"], .lucide-shield-check',
  
  // Text elements
  title: 'h1:has-text("כניסה מאובטחת")',
  subtitle: 'text=מערכת ניהול הזמנות',
  description: 'text=התחברו עם חשבון Google',
  
  // Login button
  loginButton: 'button:has-text("התחברו עם Google")',
  loginButtonAlt: 'button:has(.lucide-log-in)',
  
  // Loading state
  loadingSpinner: '.animate-spin',
  
  // Error message
  errorMessage: '[class*="error"], .text-red-500, [class*="bg-error"]',
  
  // Links
  googleAuthLink: 'a[href*="auth/login"]',
  
  // Form elements (if any future additions)
  form: 'form',
  
  // Get specific locators by text content (Hebrew)
  getByHebrewText: (text: string) => `text=${text}`,
  
  // Accessible elements
  loginButtonByRole: 'role=button[name="התחברו עם Google"]',
} as const;

/**
 * Login Page Error Messages
 */
export const LoginErrorMessages = {
  authError: 'שגיאת התחברות',
  invalidCredentials: 'פרטים שגויים',
  networkError: 'שגיאת רשת',
} as const;

/**
 * Login Page URLs
 */
export const LoginUrls = {
  login: '/login',
  authCallback: '/api/auth/callback',
  googleAuth: '/api/auth/login',
} as const;
