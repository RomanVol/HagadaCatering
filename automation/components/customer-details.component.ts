/**
 * Customer Details Component
 * 
 * @description Reusable component for customer details accordion section
 */
import { Page, Locator } from '@playwright/test';
import { OrderLocators } from '../locators/order.locators';

export class CustomerDetailsComponent {
  private page: Page;
  private locators = OrderLocators.customerDetails;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the accordion trigger button
   */
  private get trigger(): Locator {
    return this.page.locator(this.locators.trigger);
  }

  /**
   * Get the accordion content (when expanded)
   */
  private get content(): Locator {
    return this.page.locator(this.locators.content);
  }

  /**
   * Check if section is expanded
   */
  async isExpanded(): Promise<boolean> {
    const content = this.page.locator(this.locators.section);
    const state = await content.getAttribute('data-state');
    return state === 'open';
  }

  /**
   * Expand the customer details section
   */
  async expand(): Promise<void> {
    if (!(await this.isExpanded())) {
      await this.trigger.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  /**
   * Collapse the customer details section
   */
  async collapse(): Promise<void> {
    if (await this.isExpanded()) {
      await this.trigger.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Fill customer name
   */
  async fillName(name: string): Promise<void> {
    const input = this.page.locator(this.locators.customerName);
    await input.clear();
    await input.fill(name);
  }

  /**
   * Get customer name value
   */
  async getName(): Promise<string> {
    return await this.page.locator(this.locators.customerName).inputValue();
  }

  /**
   * Fill phone number
   */
  async fillPhone(phone: string): Promise<void> {
    const input = this.page.locator(this.locators.phone);
    await input.clear();
    await input.fill(phone);
  }

  /**
   * Get phone number value
   */
  async getPhone(): Promise<string> {
    return await this.page.locator(this.locators.phone).inputValue();
  }

  /**
   * Fill alternative phone number
   */
  async fillPhoneAlt(phone: string): Promise<void> {
    const input = this.page.locator(this.locators.phoneAlt);
    await input.clear();
    await input.fill(phone);
  }

  /**
   * Get alternative phone value
   */
  async getPhoneAlt(): Promise<string> {
    return await this.page.locator(this.locators.phoneAlt).inputValue();
  }

  /**
   * Fill customer time
   */
  async fillCustomerTime(time: string): Promise<void> {
    const input = this.page.locator(this.locators.customerTime);
    await input.fill(time);
  }

  /**
   * Get customer time value
   */
  async getCustomerTime(): Promise<string> {
    return await this.page.locator(this.locators.customerTime).inputValue();
  }

  /**
   * Fill kitchen time
   */
  async fillKitchenTime(time: string): Promise<void> {
    const input = this.page.locator(this.locators.kitchenTime);
    await input.fill(time);
  }

  /**
   * Get kitchen time value
   */
  async getKitchenTime(): Promise<string> {
    return await this.page.locator(this.locators.kitchenTime).inputValue();
  }

  /**
   * Fill order date
   */
  async fillOrderDate(date: string): Promise<void> {
    const input = this.page.locator(this.locators.orderDate);
    await input.fill(date);
  }

  /**
   * Get order date value
   */
  async getOrderDate(): Promise<string> {
    return await this.page.locator(this.locators.orderDate).inputValue();
  }

  /**
   * Fill address
   */
  async fillAddress(address: string): Promise<void> {
    const input = this.page.locator(this.locators.address);
    await input.clear();
    await input.fill(address);
  }

  /**
   * Get address value
   */
  async getAddress(): Promise<string> {
    return await this.page.locator(this.locators.address).inputValue();
  }

  /**
   * Fill notes
   */
  async fillNotes(notes: string): Promise<void> {
    const input = this.page.locator(this.locators.notes);
    await input.clear();
    await input.fill(notes);
  }

  /**
   * Get notes value
   */
  async getNotes(): Promise<string> {
    return await this.page.locator(this.locators.notes).inputValue();
  }

  /**
   * Fill total portions
   */
  async fillTotalPortions(portions: number): Promise<void> {
    const input = this.page.locator(this.locators.totalPortions);
    await input.clear();
    await input.fill(String(portions));
  }

  /**
   * Get total portions value
   */
  async getTotalPortions(): Promise<number> {
    const value = await this.page.locator(this.locators.totalPortions).inputValue();
    return parseInt(value) || 0;
  }

  /**
   * Fill price per portion
   */
  async fillPricePerPortion(price: number): Promise<void> {
    const input = this.page.locator(this.locators.pricePerPortion);
    await input.clear();
    await input.fill(String(price));
  }

  /**
   * Get price per portion value
   */
  async getPricePerPortion(): Promise<number> {
    const value = await this.page.locator(this.locators.pricePerPortion).inputValue();
    return parseFloat(value) || 0;
  }

  /**
   * Fill delivery fee
   */
  async fillDeliveryFee(fee: number): Promise<void> {
    const input = this.page.locator(this.locators.deliveryFee);
    await input.clear();
    await input.fill(String(fee));
  }

  /**
   * Get delivery fee value
   */
  async getDeliveryFee(): Promise<number> {
    const value = await this.page.locator(this.locators.deliveryFee).inputValue();
    return parseFloat(value) || 0;
  }

  /**
   * Get calculated total payment
   */
  async getTotalPayment(): Promise<number> {
    const text = await this.page.locator(this.locators.totalPayment).textContent();
    const match = text?.match(/₪([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
  }

  /**
   * Fill all customer details at once
   */
  async fillAll(data: {
    name: string;
    phone: string;
    phoneAlt?: string;
    address: string;
    orderDate?: string;
    kitchenTime?: string;
    customerTime?: string;
    notes?: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillPhone(data.phone);
    if (data.phoneAlt) await this.fillPhoneAlt(data.phoneAlt);
    await this.fillAddress(data.address);
    if (data.orderDate) await this.fillOrderDate(data.orderDate);
    if (data.kitchenTime) await this.fillKitchenTime(data.kitchenTime);
    if (data.customerTime) await this.fillCustomerTime(data.customerTime);
    if (data.notes) await this.fillNotes(data.notes);
  }

  /**
   * Fill all pricing details at once
   */
  async fillPricing(data: {
    totalPortions: number;
    pricePerPortion: number;
    deliveryFee: number;
  }): Promise<void> {
    await this.fillTotalPortions(data.totalPortions);
    await this.fillPricePerPortion(data.pricePerPortion);
    await this.fillDeliveryFee(data.deliveryFee);
  }
}
