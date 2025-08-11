describe('Fund Management E2E Tests', () => {
  beforeEach(() => {
    // Clean database and seed test data
    cy.task('db:clean');
    cy.task('db:seed');
    
    // Login as admin user
    cy.login('admin@stratcap.com', 'TestPassword123!');
  });

  afterEach(() => {
    // Clean up test data
    cy.task('db:clean');
  });

  describe('Fund Creation Workflow', () => {
    it('should create a complete fund with all required information', () => {
      // Navigate to fund families
      cy.visit('/fund-families');
      cy.get('[data-testid="page-header"]').should('contain', 'Fund Families');
      
      // Create fund family first
      cy.get('[data-testid="create-fund-family"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Fund Family');
      
      // Fill fund family form
      cy.get('[data-testid="input-name"]').type('E2E Test Capital Partners');
      cy.get('[data-testid="input-description"]').type('End-to-end test fund family');
      cy.get('[data-testid="input-headquarters"]').type('New York, NY');
      cy.get('[data-testid="input-founded-year"]').type('2024');
      cy.get('[data-testid="input-aum"]').type('500000000');
      
      // Submit fund family
      cy.get('[data-testid="submit-fund-family"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="modal"]').should('not.exist');
      
      // Verify fund family appears in list
      cy.get('[data-testid="fund-family-list"]')
        .should('contain', 'E2E Test Capital Partners');
      
      // Navigate to funds
      cy.get('[data-testid="nav-funds"]').click();
      cy.url().should('include', '/funds');
      
      // Create new fund
      cy.get('[data-testid="create-fund"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Fund');
      
      // Fill fund form
      cy.get('[data-testid="select-fund-family"]').click();
      cy.get('[data-testid="option-fund-family"]')
        .contains('E2E Test Capital Partners')
        .click();
      
      cy.get('[data-testid="input-name"]').type('E2E Test Fund I');
      cy.get('[data-testid="select-fund-type"]').select('private_equity');
      cy.get('[data-testid="input-target-size"]').type('100000000');
      cy.get('[data-testid="input-management-fee-rate"]').type('2.0');
      cy.get('[data-testid="input-carried-interest-rate"]').type('20.0');
      cy.get('[data-testid="input-preferred-return-rate"]').type('8.0');
      cy.get('[data-testid="input-vintage"]').type('2024');
      cy.get('[data-testid="select-currency"]').select('USD');
      cy.get('[data-testid="select-jurisdiction"]').select('Delaware');
      
      // Submit fund
      cy.get('[data-testid="submit-fund"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="modal"]').should('not.exist');
      
      // Verify fund appears in list
      cy.get('[data-testid="fund-list"]')
        .should('contain', 'E2E Test Fund I');
      
      // Click on fund to view details
      cy.get('[data-testid="fund-row"]')
        .contains('E2E Test Fund I')
        .click();
      
      // Verify fund details page
      cy.url().should('include', '/funds/');
      cy.get('[data-testid="fund-name"]').should('contain', 'E2E Test Fund I');
      cy.get('[data-testid="fund-target-size"]').should('contain', '$100,000,000');
      cy.get('[data-testid="fund-status"]').should('contain', 'Active');
    });
    
    it('should validate required fund fields', () => {
      cy.visit('/funds');
      cy.get('[data-testid="create-fund"]').click();
      
      // Try to submit without filling required fields
      cy.get('[data-testid="submit-fund"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="error-name"]').should('be.visible');
      cy.get('[data-testid="error-fund-family"]').should('be.visible');
      cy.get('[data-testid="error-fund-type"]').should('be.visible');
      cy.get('[data-testid="error-target-size"]').should('be.visible');
      
      // Modal should remain open
      cy.get('[data-testid="modal"]').should('exist');
    });
  });

  describe('Investor Management Workflow', () => {
    it('should add investors and create commitments', () => {
      // First create a fund (using existing test data)
      cy.visit('/funds');
      cy.get('[data-testid="fund-row"]').first().click();
      const fundId = cy.url().then(url => url.split('/').pop());
      
      // Navigate to investors
      cy.get('[data-testid="nav-investors"]').click();
      cy.url().should('include', '/investors');
      
      // Create new investor
      cy.get('[data-testid="create-investor"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Investor');
      
      // Fill investor form
      cy.get('[data-testid="input-entity-name"]').type('E2E Pension Fund');
      cy.get('[data-testid="select-entity-type"]').select('pension_fund');
      cy.get('[data-testid="select-jurisdiction"]').select('California');
      cy.get('[data-testid="select-tax-status"]').select('tax_exempt');
      cy.get('[data-testid="input-contact-email"]').type('contact@e2epension.com');
      cy.get('[data-testid="input-contact-phone"]').type('+1-555-0199');
      
      // Address information
      cy.get('[data-testid="input-address-street"]').type('123 Investor Street');
      cy.get('[data-testid="input-address-city"]').type('San Francisco');
      cy.get('[data-testid="input-address-state"]').type('CA');
      cy.get('[data-testid="input-address-zip"]').type('94105');
      cy.get('[data-testid="select-address-country"]').select('USA');
      
      // Submit investor
      cy.get('[data-testid="submit-investor"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Navigate to newly created investor
      cy.get('[data-testid="investor-row"]')
        .contains('E2E Pension Fund')
        .click();
      
      // Create commitment
      cy.get('[data-testid="create-commitment"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Commitment');
      
      // Select fund and fill commitment details
      cy.get('[data-testid="select-fund"]').click();
      cy.get('[data-testid="fund-option"]').first().click();
      
      cy.get('[data-testid="input-commitment-amount"]').type('10000000');
      cy.get('[data-testid="input-commitment-date"]').type('2024-01-01');
      cy.get('[data-testid="input-closing-id"]').type('1');
      
      // Submit commitment
      cy.get('[data-testid="submit-commitment"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Verify commitment appears in investor details
      cy.get('[data-testid="commitments-section"]')
        .should('contain', '$10,000,000');
      cy.get('[data-testid="commitment-status"]')
        .should('contain', 'Active');
    });
  });

  describe('Capital Activity Workflow', () => {
    it('should create and process capital call', () => {
      // Navigate to capital activities
      cy.visit('/capital-activities');
      cy.get('[data-testid="page-header"]').should('contain', 'Capital Activities');
      
      // Create capital call
      cy.get('[data-testid="create-capital-call"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Capital Call');
      
      // Select fund
      cy.get('[data-testid="select-fund"]').click();
      cy.get('[data-testid="fund-option"]').first().click();
      
      // Fill capital call details
      cy.get('[data-testid="input-total-amount"]').type('5000000');
      cy.get('[data-testid="input-call-date"]').type('2024-03-01');
      cy.get('[data-testid="input-due-date"]').type('2024-03-15');
      cy.get('[data-testid="input-purpose"]').type('E2E Test Investment Funding');
      
      // Submit capital call
      cy.get('[data-testid="submit-capital-call"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Verify capital call in list
      cy.get('[data-testid="capital-activity-list"]')
        .should('contain', 'E2E Test Investment Funding');
      
      // Click on capital call to view details
      cy.get('[data-testid="capital-activity-row"]')
        .contains('E2E Test Investment Funding')
        .click();
      
      // Process capital call
      cy.get('[data-testid="process-capital-call"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Process Capital Call');
      
      // Review allocations
      cy.get('[data-testid="allocations-table"]').should('be.visible');
      cy.get('[data-testid="total-allocation"]')
        .should('contain', '$5,000,000');
      
      // Approve and process
      cy.get('[data-testid="approve-process"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Verify status updated
      cy.get('[data-testid="activity-status"]')
        .should('contain', 'Processed');
      
      // Check that investor balances were updated
      cy.visit('/investors');
      cy.get('[data-testid="investor-row"]').first().click();
      cy.get('[data-testid="called-amount"]').should('not.contain', '$0');
    });
    
    it('should create distribution and calculate waterfall', () => {
      // Navigate to capital activities
      cy.visit('/capital-activities');
      
      // Create distribution
      cy.get('[data-testid="create-distribution"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Distribution');
      
      // Fill distribution details
      cy.get('[data-testid="select-fund"]').click();
      cy.get('[data-testid="fund-option"]').first().click();
      
      cy.get('[data-testid="input-total-amount"]').type('6000000');
      cy.get('[data-testid="input-distribution-date"]').type('2024-12-01');
      cy.get('[data-testid="select-distribution-type"]').select('capital_gains');
      cy.get('[data-testid="input-description"]').type('E2E Test Distribution');
      
      // Submit distribution
      cy.get('[data-testid="submit-distribution"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Navigate to waterfall calculations
      cy.get('[data-testid="nav-waterfall"]').click();
      cy.url().should('include', '/waterfall');
      
      // Create waterfall calculation
      cy.get('[data-testid="create-waterfall"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Calculate Waterfall');
      
      // Fill waterfall calculation form
      cy.get('[data-testid="select-fund"]').click();
      cy.get('[data-testid="fund-option"]').first().click();
      
      cy.get('[data-testid="input-distribution-amount"]').type('6000000');
      cy.get('[data-testid="input-distribution-date"]').type('2024-12-01');
      cy.get('[data-testid="select-calculation-type"]').select('distribution');
      
      // Submit calculation
      cy.get('[data-testid="submit-waterfall"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Verify waterfall results
      cy.get('[data-testid="waterfall-results"]').should('be.visible');
      cy.get('[data-testid="total-distributed"]')
        .should('contain', '$6,000,000');
      cy.get('[data-testid="waterfall-tiers"]').should('exist');
      cy.get('[data-testid="tier-table"]').should('be.visible');
      
      // Verify carried interest calculation
      cy.get('[data-testid="carried-interest-section"]').should('be.visible');
    });
  });

  describe('Reporting and Analytics', () => {
    it('should generate fund performance report', () => {
      // Navigate to reports
      cy.visit('/reports');
      cy.get('[data-testid="page-header"]').should('contain', 'Reports');
      
      // Select fund performance report
      cy.get('[data-testid="report-type-fund-performance"]').click();
      cy.get('[data-testid="modal-title"]').should('contain', 'Fund Performance Report');
      
      // Configure report parameters
      cy.get('[data-testid="select-fund"]').click();
      cy.get('[data-testid="fund-option"]').first().click();
      
      cy.get('[data-testid="input-start-date"]').type('2024-01-01');
      cy.get('[data-testid="input-end-date"]').type('2024-12-31');
      
      // Generate report
      cy.get('[data-testid="generate-report"]').click();
      
      // Wait for report generation
      cy.get('[data-testid="loading-spinner"]', { timeout: 30000 })
        .should('not.exist');
      
      // Verify report content
      cy.get('[data-testid="report-content"]').should('be.visible');
      cy.get('[data-testid="fund-metrics"]').should('exist');
      cy.get('[data-testid="investor-performance"]').should('exist');
      
      // Check key metrics
      cy.get('[data-testid="total-commitments"]').should('be.visible');
      cy.get('[data-testid="total-called"]').should('be.visible');
      cy.get('[data-testid="total-distributed"]').should('be.visible');
      cy.get('[data-testid="net-irr"]').should('be.visible');
      cy.get('[data-testid="tvpi-multiple"]').should('be.visible');
      
      // Export report
      cy.get('[data-testid="export-report"]').click();
      cy.get('[data-testid="export-format-pdf"]').click();
      cy.get('[data-testid="confirm-export"]').click();
      cy.get('[data-testid="success-message"]').should('contain', 'exported');
    });
    
    it('should display dashboard with key metrics', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="page-header"]').should('contain', 'Dashboard');
      
      // Verify dashboard widgets load
      cy.get('[data-testid="dashboard-widgets"]').should('be.visible');
      
      // Fund metrics widget
      cy.get('[data-testid="fund-metrics-widget"]').should('be.visible');
      cy.get('[data-testid="total-funds"]').should('exist');
      cy.get('[data-testid="total-aum"]').should('exist');
      
      // Investor metrics widget
      cy.get('[data-testid="investor-metrics-widget"]').should('be.visible');
      cy.get('[data-testid="total-investors"]').should('exist');
      cy.get('[data-testid="total-commitments"]').should('exist');
      
      // Recent activities widget
      cy.get('[data-testid="recent-activities-widget"]').should('be.visible');
      cy.get('[data-testid="activity-list"]').should('exist');
      
      // Performance chart
      cy.get('[data-testid="performance-chart"]').should('be.visible');
      
      // Verify data is loaded (not just loading states)
      cy.get('[data-testid="fund-metrics-widget"]')
        .should('not.contain', 'Loading...');
      cy.get('[data-testid="investor-metrics-widget"]')
        .should('not.contain', 'Loading...');
    });
  });

  describe('User Interface and UX', () => {
    it('should navigate through main sections smoothly', () => {
      // Test main navigation
      const navItems = [
        { testId: 'nav-dashboard', url: '/dashboard', title: 'Dashboard' },
        { testId: 'nav-funds', url: '/funds', title: 'Funds' },
        { testId: 'nav-investors', url: '/investors', title: 'Investors' },
        { testId: 'nav-capital-activities', url: '/capital-activities', title: 'Capital Activities' },
        { testId: 'nav-reports', url: '/reports', title: 'Reports' },
        { testId: 'nav-settings', url: '/settings', title: 'Settings' }
      ];
      
      navItems.forEach(({ testId, url, title }) => {
        cy.get(`[data-testid="${testId}"]`).click();
        cy.url().should('include', url);
        cy.get('[data-testid="page-header"]').should('contain', title);
      });
    });
    
    it('should handle responsive design on mobile viewport', () => {
      // Switch to mobile viewport
      cy.viewport('iphone-x');
      
      cy.visit('/dashboard');
      
      // Mobile menu should be visible
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
      
      // Sidebar should be collapsed
      cy.get('[data-testid="sidebar"]').should('have.class', 'mobile-collapsed');
      
      // Open mobile menu
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      
      // Navigate via mobile menu
      cy.get('[data-testid="mobile-nav-funds"]').click();
      cy.url().should('include', '/funds');
      
      // Menu should close after navigation
      cy.get('[data-testid="mobile-menu"]').should('not.be.visible');
    });
    
    it('should handle loading states and error conditions', () => {
      // Intercept API calls to simulate loading states
      cy.intercept('GET', '/api/funds', { delay: 2000, body: { success: true, data: [] } });
      
      cy.visit('/funds');
      
      // Should show loading spinner
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="fund-list"]').should('not.exist');
      
      // Wait for loading to complete
      cy.get('[data-testid="loading-spinner"]', { timeout: 10000 })
        .should('not.exist');
      cy.get('[data-testid="fund-list"]').should('be.visible');
      
      // Test error handling
      cy.intercept('GET', '/api/investors', { 
        statusCode: 500, 
        body: { success: false, message: 'Server error' } 
      });
      
      cy.visit('/investors');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'error');
      
      // Should have retry button
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Data Persistence and Consistency', () => {
    it('should maintain data consistency across page refreshes', () => {
      // Create some test data
      cy.visit('/funds');
      cy.get('[data-testid="create-fund"]').click();
      
      // Fill form with unique data
      const fundName = `Persistence Test Fund ${Date.now()}`;
      cy.get('[data-testid="input-name"]').type(fundName);
      cy.get('[data-testid="select-fund-family"]').select(0);
      cy.get('[data-testid="input-target-size"]').type('50000000');
      cy.get('[data-testid="submit-fund"]').click();
      
      cy.get('[data-testid="success-message"]').should('be.visible');
      
      // Verify data exists
      cy.get('[data-testid="fund-list"]').should('contain', fundName);
      
      // Refresh page
      cy.reload();
      
      // Data should still exist
      cy.get('[data-testid="fund-list"]').should('contain', fundName);
      
      // Navigate away and back
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.get('[data-testid="nav-funds"]').click();
      
      // Data should still exist
      cy.get('[data-testid="fund-list"]').should('contain', fundName);
    });
  });

  describe('Search and Filtering', () => {
    it('should filter and search data effectively', () => {
      cy.visit('/funds');
      
      // Test search functionality
      cy.get('[data-testid="search-input"]').type('Test');
      cy.get('[data-testid="search-button"]').click();
      
      // Results should be filtered
      cy.get('[data-testid="fund-list"] [data-testid="fund-row"]')
        .each($row => {
          cy.wrap($row).should('contain.text', 'Test');
        });
      
      // Clear search
      cy.get('[data-testid="clear-search"]').click();
      cy.get('[data-testid="search-input"]').should('have.value', '');
      
      // Test filter functionality
      cy.get('[data-testid="filter-status"]').select('Active');
      cy.get('[data-testid="apply-filters"]').click();
      
      // Results should show only active funds
      cy.get('[data-testid="fund-status"]').each($status => {
        cy.wrap($status).should('contain', 'Active');
      });
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should validate forms comprehensively', () => {
      cy.visit('/investors');
      cy.get('[data-testid="create-investor"]').click();
      
      // Test required field validation
      cy.get('[data-testid="submit-investor"]').click();
      cy.get('[data-testid="error-entity-name"]').should('be.visible');
      cy.get('[data-testid="error-entity-type"]').should('be.visible');
      
      // Test email validation
      cy.get('[data-testid="input-contact-email"]').type('invalid-email');
      cy.get('[data-testid="input-contact-email"]').blur();
      cy.get('[data-testid="error-contact-email"]').should('contain', 'valid email');
      
      // Test numeric validation
      cy.get('[data-testid="input-contact-phone"]').type('not-a-number');
      cy.get('[data-testid="input-contact-phone"]').blur();
      cy.get('[data-testid="error-contact-phone"]').should('be.visible');
      
      // Fix validation errors
      cy.get('[data-testid="input-entity-name"]').type('Valid Entity Name');
      cy.get('[data-testid="select-entity-type"]').select('corporation');
      cy.get('[data-testid="input-contact-email"]').clear().type('valid@email.com');
      cy.get('[data-testid="input-contact-phone"]').clear().type('+1-555-0123');
      
      // Form should now submit successfully
      cy.get('[data-testid="submit-investor"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});