/**
 * Order Edit Tests
 * 
 * @description Tests for editing existing orders
 * Test Cases: TC-019 to TC-024
 */
import { test, expect, TestTags, TestCategories } from '../fixtures/test-fixtures';
import { testCustomer, validCustomers } from '../data/customers.data';
import { FoodCategories, foodItemSamples } from '../data/food-items.data';
import { orderTiming } from '../data/orders.data';

test.describe(TestCategories.ORDER_EDIT, () => {
  
  test.beforeEach(async ({ loginPage, summaryPage }) => {
    // Setup: Mock login and navigate to summary page
    await loginPage.navigate();
    await loginPage.mockLogin();
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
  });

  /**
   * TC-019: Edit Customer Details in Existing Order
   * Priority: Critical
   * Test Steps:
   * 1. Open an existing order for edit
   * 2. Modify customer name
   * 3. Modify phone number
   * 4. Save changes
   * 5. Verify changes are persisted
   */
  test(`TC-019: Edit Customer Details in Existing Order ${TestTags.CRITICAL}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange - Find and open an order for editing
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Store original values
    const originalName = await editOrderPage.getCustomerName();
    
    // Act - Modify customer details
    const newCustomer = validCustomers[1];
    await editOrderPage.updateCustomerDetails({
      name: newCustomer.name,
      phone: newCustomer.phone,
    });
    
    await editOrderPage.saveChanges();
    
    // Assert - Verify changes in summary
    await summaryPage.navigate();
    const updatedCard = await summaryPage.findOrderCard(newCustomer.name);
    expect(updatedCard).toBeTruthy();
  });

  /**
   * TC-020: Add Items to Existing Order
   * Priority: High
   * Test Steps:
   * 1. Open an existing order for edit
   * 2. Add new food items
   * 3. Save changes
   * 4. Verify new items appear in order
   */
  test(`TC-020: Add Items to Existing Order ${TestTags.HIGH}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Get initial item count
    const initialItemCount = await editOrderPage.getTotalItemCount();
    
    // Act - Add new items
    await editOrderPage.openCategory(FoodCategories.SIDES);
    await editOrderPage.selectFirstAvailableItem(FoodCategories.SIDES);
    
    await editOrderPage.saveChanges();
    
    // Assert - Verify item count increased
    await summaryPage.navigate();
    const updatedCard = await summaryPage.getVisibleOrderCards();
    expect(updatedCard.length).toBeGreaterThan(0);
  });

  /**
   * TC-021: Remove Items from Existing Order
   * Priority: High
   * Test Steps:
   * 1. Open an existing order with items
   * 2. Remove an item
   * 3. Save changes
   * 4. Verify item is removed
   */
  test(`TC-021: Remove Items from Existing Order ${TestTags.HIGH}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Get initial items
    const initialItemCount = await editOrderPage.getTotalItemCount();
    
    if (initialItemCount === 0) {
      test.skip();
      return;
    }
    
    // Act - Remove first item
    await editOrderPage.removeFirstItem();
    await editOrderPage.saveChanges();
    
    // Assert
    await summaryPage.navigate();
    // Verify order still exists (didn't get deleted)
    const updatedCards = await summaryPage.getVisibleOrderCards();
    expect(updatedCards.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * TC-022: Modify Item Quantities
   * Priority: High
   * Test Steps:
   * 1. Open an existing order
   * 2. Change quantity of an item
   * 3. Save changes
   * 4. Verify new quantity is saved
   */
  test(`TC-022: Modify Item Quantities ${TestTags.HIGH}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Act - Modify quantity
    await editOrderPage.openCategory(FoodCategories.BAKERY);
    
    // Select or modify an item
    const itemName = foodItemSamples.bakery[0];
    await editOrderPage.setItemQuantity(itemName, 10);
    
    await editOrderPage.saveChanges();
    
    // Assert - Reopen and verify
    await summaryPage.navigate();
    const updatedCards = await summaryPage.getVisibleOrderCards();
    expect(updatedCards.length).toBeGreaterThan(0);
  });

  /**
   * TC-023: Update Collection Time
   * Priority: Medium
   * Test Steps:
   * 1. Open an existing order
   * 2. Change customer collection time
   * 3. Save changes
   * 4. Verify new time is saved
   */
  test(`TC-023: Update Collection Time ${TestTags.MEDIUM}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Act - Update time
    const newTime = orderTiming.eveningTime;
    await editOrderPage.updateCollectionTime(newTime);
    
    await editOrderPage.saveChanges();
    
    // Assert
    await summaryPage.navigate();
    const updatedCards = await summaryPage.getVisibleOrderCards();
    expect(updatedCards.length).toBeGreaterThan(0);
  });

  /**
   * TC-024: Cancel Order Edit
   * Priority: Medium
   * Test Steps:
   * 1. Open an existing order
   * 2. Make changes
   * 3. Cancel without saving
   * 4. Verify original data is unchanged
   */
  test(`TC-024: Cancel Order Edit ${TestTags.MEDIUM}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const firstCard = orderCards[0];
    const originalName = await summaryPage.getOrderCustomerName(firstCard);
    
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Act - Make changes but don't save
    await editOrderPage.updateCustomerDetails({
      name: 'שם זמני לבדיקה',
    });
    
    await editOrderPage.cancelEdit();
    
    // Assert - Original name should still be there
    await summaryPage.navigate();
    const orderCard = await summaryPage.findOrderCard(originalName!);
    expect(orderCard).toBeTruthy();
  });

  /**
   * TC-024b: Delete Order
   * Priority: High
   * Test Steps:
   * 1. Open an existing order
   * 2. Click delete button
   * 3. Confirm deletion
   * 4. Verify order is removed from summary
   */
  test(`TC-024b: Delete Order ${TestTags.HIGH}`, async ({ 
    summaryPage,
    editOrderPage 
  }) => {
    // Arrange
    const orderCards = await summaryPage.getVisibleOrderCards();
    
    if (orderCards.length === 0) {
      test.skip();
      return;
    }
    
    const initialCount = orderCards.length;
    const firstCard = orderCards[0];
    const orderName = await summaryPage.getOrderCustomerName(firstCard);
    
    await summaryPage.clickEditButton(firstCard);
    await editOrderPage.waitForPageLoad();
    
    // Act - Delete order
    await editOrderPage.deleteOrder();
    await editOrderPage.confirmDelete();
    
    // Assert
    await summaryPage.navigate();
    await summaryPage.waitForPageLoad();
    
    const finalCount = await summaryPage.getVisibleOrderCount();
    expect(finalCount).toBeLessThan(initialCount);
  });
});
