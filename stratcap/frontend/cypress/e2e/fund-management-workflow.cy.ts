describe('Fund Management Workflow', () => {
  beforeEach(() => {
    // Seed database with test data
    cy.task('db:seed');
    
    // Login as fund manager
    cy.login('fundmanager@stratcap.com', 'TestPassword123!');
    
    // Navigate to funds page
    cy.visit('/funds');
  });

  afterEach(() => {
    // Clean up test data
    cy.task('db:clean');
  });

  describe('Fund Creation', () => {
    it('creates a new private equity fund successfully', () => {
      // Start performance measurement
      cy.window().then((win) => {
        win.performance.mark('fund-creation-start');
      });

      // Click create fund button
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Fill out fund form
      cy.findByLabelText(/fund name/i).type('Test PE Fund 2024');
      cy.findByLabelText(/fund type/i).select('Private Equity');
      cy.findByLabelText(/target size/i).type('500000000'); // $500M
      cy.findByLabelText(/vintage year/i).type('2024');
      cy.findByLabelText(/management fee rate/i).type('2.0');
      cy.findByLabelText(/carried interest rate/i).type('20.0');
      cy.findByLabelText(/general partner/i).type('StratCap GP LLC');
      
      // Add fund family
      cy.findByLabelText(/fund family/i).select('StratCap Funds');
      
      // Set investment strategy
      cy.findByLabelText(/investment strategy/i).type('Focus on mid-market technology companies');
      cy.findByLabelText(/geographic focus/i).select('North America');
      
      // Submit form
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Verify success
      cy.findByRole('alert').should('contain', 'Fund created successfully');
      cy.url().should('match', /\/funds\/[a-f0-9-]+$/);
      
      // Verify fund details are displayed
      cy.findByRole('heading', { name: /test pe fund 2024/i }).should('exist');
      cy.findByText('$500,000,000.00').should('exist');
      cy.findByText('2.00%').should('exist');
      cy.findByText('20.00%').should('exist');

      // Check performance
      cy.window().then((win) => {
        win.performance.mark('fund-creation-end');
        win.performance.measure('fund-creation', 'fund-creation-start', 'fund-creation-end');
        
        const measure = win.performance.getEntriesByName('fund-creation')[0];
        expect(measure.duration).to.be.lessThan(3000); // Less than 3 seconds
      });
    });

    it('validates fund creation form correctly', () => {
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Try to submit empty form
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Check validation errors
      cy.findByText(/fund name is required/i).should('exist');
      cy.findByText(/fund type is required/i).should('exist');
      cy.findByText(/target size is required/i).should('exist');
      
      // Test invalid target size
      cy.findByLabelText(/target size/i).type('-100000000');
      cy.findByRole('button', { name: /create fund/i }).click();
      cy.findByText(/target size must be positive/i).should('exist');
      
      // Test invalid management fee rate
      cy.findByLabelText(/management fee rate/i).clear().type('15');
      cy.findByRole('button', { name: /create fund/i }).click();
      cy.findByText(/management fee rate must be between 0 and 10/i).should('exist');
    });

    it('handles API errors gracefully', () => {
      // Intercept API call to return error
      cy.intercept('POST', '/api/funds', {
        statusCode: 400,
        body: { error: 'Fund name already exists' }
      }).as('createFundError');

      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Fill out minimal form
      cy.findByLabelText(/fund name/i).type('Existing Fund');
      cy.findByLabelText(/fund type/i).select('Private Equity');
      cy.findByLabelText(/target size/i).type('100000000');
      
      cy.findByRole('button', { name: /create fund/i }).click();
      
      cy.wait('@createFundError');
      cy.findByRole('alert').should('contain', 'Fund name already exists');
    });
  });

  describe('Fund List and Search', () => {
    it('displays fund list with correct information', () => {
      // Verify fund list loads
      cy.findByRole('heading', { name: /funds/i }).should('exist');
      
      // Check table headers
      cy.findByRole('columnheader', { name: /fund name/i }).should('exist');
      cy.findByRole('columnheader', { name: /type/i }).should('exist');
      cy.findByRole('columnheader', { name: /target size/i }).should('exist');
      cy.findByRole('columnheader', { name: /vintage/i }).should('exist');
      cy.findByRole('columnheader', { name: /status/i }).should('exist');
      
      // Verify fund data is displayed
      cy.findByRole('cell', { name: /stratcap pe fund i/i }).should('exist');
      cy.findByRole('cell', { name: /private equity/i }).should('exist');
    });

    it('filters funds by type', () => {
      // Apply filter
      cy.findByLabelText(/filter by fund type/i).select('Private Equity');
      
      // Verify only PE funds are shown
      cy.findAllByRole('row').should('have.length.greaterThan', 1);
      cy.findByText(/real estate/i).should('not.exist');
      
      // Clear filter
      cy.findByLabelText(/filter by fund type/i).select('All Types');
      cy.findByText(/real estate/i).should('exist');
    });

    it('searches funds by name', () => {
      const searchTerm = 'StratCap';
      
      cy.findByLabelText(/search funds/i).type(searchTerm);
      
      // Verify search results
      cy.findAllByRole('row').should('contain.text', searchTerm);
      
      // Clear search
      cy.findByLabelText(/search funds/i).clear();
      cy.findAllByRole('row').should('have.length.greaterThan', 1);
    });

    it('sorts funds by different columns', () => {
      // Sort by fund name
      cy.findByRole('columnheader', { name: /fund name/i }).click();
      
      // Verify ascending order
      cy.findAllByRole('cell').first().should('not.contain', 'Z');
      
      // Sort descending
      cy.findByRole('columnheader', { name: /fund name/i }).click();
      
      // Sort by target size
      cy.findByRole('columnheader', { name: /target size/i }).click();
      
      // Verify numerical sorting
      cy.findAllByRole('row').first().should('contain', '$');
    });
  });

  describe('Fund Details and Operations', () => {
    beforeEach(() => {
      // Navigate to first fund
      cy.findAllByRole('link', { name: /view details/i }).first().click();
    });

    it('displays comprehensive fund information', () => {
      // Basic information
      cy.findByRole('heading').should('contain', 'Fund');
      cy.findByText(/fund type/i).should('exist');
      cy.findByText(/target size/i).should('exist');
      cy.findByText(/vintage year/i).should('exist');
      
      // Financial metrics
      cy.findByText(/management fee/i).should('exist');
      cy.findByText(/carried interest/i).should('exist');
      cy.findByText(/commitment/i).should('exist');
      
      // Status information
      cy.findByText(/fund status/i).should('exist');
      cy.findByText(/closing date/i).should('exist');
    });

    it('shows fund performance metrics', () => {
      cy.findByRole('tab', { name: /performance/i }).click();
      
      // Key performance indicators
      cy.findByText(/irr/i).should('exist');
      cy.findByText(/tvpi/i).should('exist');
      cy.findByText(/dpi/i).should('exist');
      cy.findByText(/moic/i).should('exist');
      
      // Performance charts
      cy.findByTestId('performance-chart').should('exist');
      cy.findByTestId('cash-flow-chart').should('exist');
    });

    it('manages fund investors', () => {
      cy.findByRole('tab', { name: /investors/i }).click();
      
      // Add new investor
      cy.findByRole('button', { name: /add investor/i }).click();
      
      cy.findByLabelText(/investor/i).select('Pension Fund Alpha');
      cy.findByLabelText(/commitment amount/i).type('50000000');
      cy.findByLabelText(/commitment date/i).type('2024-01-15');
      
      cy.findByRole('button', { name: /add commitment/i }).click();
      
      // Verify investor was added
      cy.findByRole('alert').should('contain', 'Investor commitment added');
      cy.findByText('Pension Fund Alpha').should('exist');
      cy.findByText('$50,000,000.00').should('exist');
    });

    it('processes capital calls', () => {
      cy.findByRole('tab', { name: /capital activities/i }).click();
      
      // Create capital call
      cy.findByRole('button', { name: /new capital call/i }).click();
      
      cy.findByLabelText(/call amount/i).type('25000000');
      cy.findByLabelText(/call percentage/i).type('25');
      cy.findByLabelText(/purpose/i).type('Investment in TechCorp acquisition');
      cy.findByLabelText(/due date/i).type('2024-03-15');
      
      cy.findByRole('button', { name: /create capital call/i }).click();
      
      // Verify capital call
      cy.findByRole('alert').should('contain', 'Capital call created');
      cy.findByText('$25,000,000.00').should('exist');
      cy.findByText('TechCorp acquisition').should('exist');
    });

    it('manages fund expenses and fees', () => {
      cy.findByRole('tab', { name: /fees/i }).click();
      
      // View management fee schedule
      cy.findByText(/management fee schedule/i).should('exist');
      cy.findByText(/quarterly/i).should('exist');
      
      // Add expense
      cy.findByRole('button', { name: /add expense/i }).click();
      
      cy.findByLabelText(/expense type/i).select('Legal Fees');
      cy.findByLabelText(/amount/i).type('150000');
      cy.findByLabelText(/description/i).type('Due diligence for new investment');
      cy.findByLabelText(/date/i).type('2024-01-20');
      
      cy.findByRole('button', { name: /add expense/i }).click();
      
      // Verify expense added
      cy.findByText('Legal Fees').should('exist');
      cy.findByText('$150,000.00').should('exist');
    });
  });

  describe('Fund Reporting', () => {
    it('generates quarterly fund report', () => {
      // Navigate to reports
      cy.visit('/reports');
      
      // Select fund report
      cy.findByLabelText(/report type/i).select('Quarterly Fund Report');
      cy.findByLabelText(/fund/i).select('StratCap PE Fund I');
      cy.findByLabelText(/quarter/i).select('Q1 2024');
      
      cy.findByRole('button', { name: /generate report/i }).click();
      
      // Verify report generation
      cy.findByText(/generating report/i).should('exist');
      
      // Wait for report completion
      cy.findByText(/report generated successfully/i, { timeout: 15000 }).should('exist');
      
      // Download report
      cy.findByRole('button', { name: /download pdf/i }).click();
      
      // Verify download
      cy.readFile('cypress/downloads/quarterly-fund-report-q1-2024.pdf').should('exist');
    });

    it('creates investor statements', () => {
      cy.visit('/reports');
      
      cy.findByLabelText(/report type/i).select('Investor Statement');
      cy.findByLabelText(/fund/i).select('StratCap PE Fund I');
      cy.findByLabelText(/investor/i).select('Pension Fund Alpha');
      cy.findByLabelText(/period/i).type('2024-01-01');
      
      cy.findByRole('button', { name: /generate statement/i }).click();
      
      // Verify statement content
      cy.findByText(/investor statement/i).should('exist');
      cy.findByText(/commitment summary/i).should('exist');
      cy.findByText(/capital calls/i).should('exist');
      cy.findByText(/distributions/i).should('exist');
      cy.findByText(/performance summary/i).should('exist');
    });
  });

  describe('Performance and Load Testing', () => {
    it('handles large fund lists efficiently', () => {
      // Seed database with many funds
      cy.task('db:seed', { fundCount: 1000 });
      
      cy.visit('/funds');
      
      // Measure load time
      cy.window().then((win) => {
        win.performance.mark('large-list-start');
      });
      
      cy.findByRole('table').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('large-list-end');
        win.performance.measure('large-list-load', 'large-list-start', 'large-list-end');
        
        const measure = win.performance.getEntriesByName('large-list-load')[0];
        expect(measure.duration).to.be.lessThan(2000); // Less than 2 seconds
      });
      
      // Test pagination
      cy.findByText(/showing \d+ to \d+ of \d+ funds/i).should('exist');
      cy.findByRole('button', { name: /next page/i }).should('be.enabled');
    });

    it('maintains responsiveness during complex calculations', () => {
      // Navigate to fund with complex calculations
      cy.visit('/funds/complex-fund-id');
      
      // Trigger calculation-heavy operation
      cy.findByRole('tab', { name: /performance/i }).click();
      cy.findByRole('button', { name: /recalculate metrics/i }).click();
      
      // Verify UI remains responsive
      cy.findByRole('button', { name: /cancel/i }).should('be.enabled');
      
      // Wait for completion
      cy.findByText(/calculations complete/i, { timeout: 10000 }).should('exist');
      
      // Verify results
      cy.findByTestId('irr-value').should('contain', '%');
      cy.findByTestId('tvpi-value').should('contain', 'x');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/funds', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/funds');
      
      cy.wait('@networkError');
      
      // Verify error message
      cy.findByRole('alert').should('contain', 'Unable to load funds');
      cy.findByRole('button', { name: /retry/i }).should('exist');
      
      // Test retry functionality
      cy.intercept('GET', '/api/funds', { fixture: 'funds.json' }).as('retrySuccess');
      cy.findByRole('button', { name: /retry/i }).click();
      
      cy.wait('@retrySuccess');
      cy.findByRole('table').should('exist');
    });

    it('handles validation errors in fund updates', () => {
      cy.visit('/funds/existing-fund-id');
      
      cy.findByRole('button', { name: /edit fund/i }).click();
      
      // Clear required field
      cy.findByLabelText(/fund name/i).clear();
      
      cy.findByRole('button', { name: /update fund/i }).click();
      
      // Verify validation error
      cy.findByText(/fund name is required/i).should('exist');
      
      // Fix and retry
      cy.findByLabelText(/fund name/i).type('Updated Fund Name');
      cy.findByRole('button', { name: /update fund/i }).click();
      
      cy.findByRole('alert').should('contain', 'Fund updated successfully');
    });
  });
});