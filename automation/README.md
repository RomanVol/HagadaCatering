# Kitchen Orders Automation Framework

## Overview

This is a comprehensive Playwright-based test automation framework for the Kitchen Orders (HagadaOrder) catering application. The framework follows the Page Object Model (POM) design pattern with separated concerns for maintainability and scalability.

## Architecture

```
automation/
├── config/                 # Playwright configuration
│   └── playwright.config.ts
├── data/                   # Test data files
│   ├── customers.data.ts
│   ├── orders.data.ts
│   └── food-items.data.ts
├── locators/               # Element selectors (separated from page logic)
│   ├── login.locators.ts
│   ├── order.locators.ts
│   ├── summary.locators.ts
│   ├── edit-order.locators.ts
│   └── print-preview.locators.ts
├── pages/                  # Page Object Model classes
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── order.page.ts
│   ├── summary.page.ts
│   ├── edit-order.page.ts
│   └── print-preview.page.ts
├── components/             # Reusable UI components
│   ├── customer-details.component.ts
│   └── food-category.component.ts
├── fixtures/               # Custom Playwright fixtures
│   └── test-fixtures.ts
├── utils/                  # Helper functions
│   ├── helpers.ts
│   └── api-helpers.ts
└── tests/                  # Test specifications
    ├── order-creation.spec.ts    # TC-001 to TC-008
    ├── order-search.spec.ts      # TC-009 to TC-013
    ├── order-summary.spec.ts     # TC-014 to TC-018
    ├── order-edit.spec.ts        # TC-019 to TC-024
    ├── print-preview.spec.ts     # TC-025 to TC-028
    ├── data-integrity.spec.ts    # TC-029 to TC-032
    ├── edge-cases.spec.ts        # TC-033 to TC-036
    ├── performance.spec.ts       # TC-037 to TC-038
    ├── item-variations.spec.ts   # TC-039 to TC-040
    └── workflow.spec.ts          # TC-041 to TC-042
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd kitchen-orders
npm install
```

2. Install Playwright and browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests:
```bash
npx playwright test
```

### Run specific test file:
```bash
npx playwright test tests/order-creation.spec.ts
```

### Run tests with specific tag:
```bash
npx playwright test --grep "@critical"
npx playwright test --grep "@sanity"
npx playwright test --grep "@performance"
```

### Run tests in headed mode:
```bash
npx playwright test --headed
```

### Run tests in UI mode:
```bash
npx playwright test --ui
```

### Run tests on specific browser:
```bash
npx playwright test --project=webkit
npx playwright test --project=chromium
```

## Test Categories

| Category | Test Cases | Description |
|----------|------------|-------------|
| Order Creation | TC-001 to TC-008 | Creating new orders |
| Order Search | TC-009 to TC-013 | Searching and filtering |
| Order Summary | TC-014 to TC-018 | Summary page functionality |
| Order Edit | TC-019 to TC-024 | Editing existing orders |
| Print Preview | TC-025 to TC-028 | Print preview verification |
| Data Integrity | TC-029 to TC-032 | Data persistence tests |
| Edge Cases | TC-033 to TC-036 | Boundary conditions |
| Performance | TC-037 to TC-038 | Performance benchmarks |
| Item Variations | TC-039 to TC-040 | Item types and measurements |
| E2E Workflow | TC-041 to TC-042 | Complete user journeys |

## Test Tags

- `@critical` - Must-pass tests for deployment
- `@high` - High priority tests
- `@medium` - Medium priority tests
- `@low` - Low priority tests
- `@sanity` - Quick sanity check tests
- `@smoke` - Smoke tests
- `@regression` - Full regression tests
- `@performance` - Performance tests
- `@edge-case` - Edge case tests

## Page Object Model

### Base Page
All page objects extend the `BasePage` class which provides common functionality:
- Navigation
- Wait for page load
- Screenshot capture
- Scroll actions

### Page Objects
Each page has its own class with:
- Locators (imported from locators directory)
- Action methods (click, fill, select)
- Verification methods (isVisible, getText)
- Page-specific business logic

### Components
Reusable UI components:
- `CustomerDetailsComponent` - Customer form accordion
- `FoodCategoryComponent` - Food item selection

## Test Data

### Customer Data (`customers.data.ts`)
- `testCustomer` - Default test customer
- `validCustomers` - Array of valid customers
- `edgeCaseCustomers` - Edge case data
- `invalidCustomers` - Invalid data for negative tests
- `generateUniqueCustomer()` - Generate unique customer per test

### Order Data (`orders.data.ts`)
- `testOrder` - Default test order
- `orderTiming` - Time configurations
- `orderPricing` - Pricing configurations
- Date helper functions

### Food Items (`food-items.data.ts`)
- `FoodCategories` - Category enum
- `foodItemSamples` - Sample items per category
- `literSizes` - Available liter options
- Item lists with variations

## Configuration

### Playwright Config (`playwright.config.ts`)
- Base URL: `http://localhost:3000`
- Timeout: 30 seconds
- Browsers: WebKit (default), Chromium
- Retries: 2 on CI, 0 locally
- HTML Reporter

## Reporting

Test results are generated in:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots and traces on failure

View report:
```bash
npx playwright show-report
```

## Best Practices

1. **Test Isolation**: Each test uses `generateUniqueCustomer()` for data isolation
2. **Page Objects**: All interactions go through page objects
3. **Locators Separation**: Selectors are in separate files for easy maintenance
4. **Descriptive Names**: Test names include test case IDs and tags
5. **Proper Waits**: Use Playwright's auto-waiting instead of hard waits
6. **Error Handling**: Tests handle missing data gracefully with `test.skip()`

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in config
   - Check if app is running on correct port

2. **Element not found**
   - Verify locators in browser DevTools
   - Check if element is in iframe or shadow DOM

3. **Login issues**
   - Verify mock login is working
   - Check authentication state

### Debug Mode

Run with debug:
```bash
PWDEBUG=1 npx playwright test --headed
```

## Contributing

1. Create tests following existing patterns
2. Add test case ID to test name
3. Use appropriate tags
4. Update this README for new features
