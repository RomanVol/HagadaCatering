/**
 * Login Page Object
 * 
 * @description Page object for the login page (/login)
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { LoginLocators, LoginUrls } from '../locators/login.locators';

export class LoginPage extends BasePage {
  // URL
  private readonly url = LoginUrls.login;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page (override base method)
   */
  async navigate(): Promise<void> {
    await super.navigate(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Alias for navigate
   */
  async goto(): Promise<void> {
    await this.navigate();
  }

  /**
   * Mock login for testing (bypasses OAuth)
   */
  async mockLogin(): Promise<void> {
    // Set mock auth state in localStorage
    await this.page.evaluate(() => {
      localStorage.setItem('mock-auth', 'true');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
    });
  }

  /**
   * Check if user is on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/login');
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    const title = await this.getText(LoginLocators.title);
    return title;
  }

  /**
   * Check if login button is visible
   */
  async isLoginButtonVisible(): Promise<boolean> {
    return await this.isVisible(LoginLocators.loginButton);
  }

  /**
   * Click login with Google button
   */
  async clickLoginButton(): Promise<void> {
    await this.click(LoginLocators.loginButton);
  }

  /**
   * Wait for login button to be ready
   */
  async waitForLoginButton(): Promise<void> {
    await this.waitForElement(LoginLocators.loginButton);
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(LoginLocators.loadingSpinner);
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(LoginLocators.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.getText(LoginLocators.errorMessage);
    }
    return '';
  }

  /**
   * Perform login flow (clicks Google login)
   * Note: This initiates OAuth flow, actual login needs to be handled
   * by the test setup or auth fixtures
   */
  async login(): Promise<void> {
    await this.waitForLoginButton();
    await this.clickLoginButton();
  }

  /**
   * Wait for redirect after login
   */
  async waitForRedirect(targetPath: string = '/order'): Promise<void> {
    await this.waitForUrl(targetPath);
  }

  /**
   * Assert login page is displayed correctly
   */
  async assertLoginPageDisplayed(): Promise<void> {
    await this.assertVisible(LoginLocators.title);
    await this.assertVisible(LoginLocators.loginButton);
    await this.assertText(LoginLocators.title, 'כניסה מאובטחת');
  }

  /**
   * Assert error is displayed
   */
  async assertErrorDisplayed(): Promise<void> {
    await this.assertVisible(LoginLocators.errorMessage);
  }
}
