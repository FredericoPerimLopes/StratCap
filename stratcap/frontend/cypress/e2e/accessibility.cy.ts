import 'cypress-axe';

describe('Accessibility Testing', () => {
  beforeEach(() => {
    cy.login('admin@stratcap.com', 'TestPassword123!');
    cy.injectAxe();
  });

  describe('Core Application Pages', () => {
    it('dashboard page meets accessibility standards', () => {
      cy.visit('/dashboard');
      cy.wait(1000); // Allow content to load
      
      // Check for accessibility violations
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true }
        }
      });
      
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'role', 'button');
      
      // Test skip links
      cy.get('body').type('{enter}');
      cy.focused().should('have.attr', 'id', 'main-content');
    });

    it('fund list page is keyboard accessible', () => {
      cy.visit('/funds');
      cy.wait(1000);
      
      cy.checkA11y();
      
      // Test table navigation
      cy.findByRole('table').focus();
      cy.focused().type('{downarrow}');
      cy.focused().should('have.attr', 'role', 'row');
      
      // Test filter controls
      cy.findByLabelText(/filter by fund type/i).focus();
      cy.focused().type('{downarrow}');
      cy.focused().type('{enter}');
    });

    it('investor form has proper labels and descriptions', () => {
      cy.visit('/investors/new');
      cy.wait(1000);
      
      cy.checkA11y();
      
      // Verify form labels
      cy.findByLabelText(/investor name/i).should('exist');
      cy.findByLabelText(/email address/i).should('exist');
      
      // Check required field indicators
      cy.findByLabelText(/investor name/i).should('have.attr', 'required');
      
      // Test error announcements
      cy.findByRole('button', { name: /create investor/i }).click();
      
      cy.findByRole('alert').should('exist');
      cy.findByRole('alert').should('have.attr', 'aria-live', 'polite');
      
      // Verify error is associated with field
      cy.findByLabelText(/investor name/i)
        .should('have.attr', 'aria-describedby')
        .and('contain', 'error');
    });
  });

  describe('Interactive Components', () => {
    it('modal dialogs are accessible', () => {
      cy.visit('/funds');
      
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Verify modal structure
      cy.findByRole('dialog').should('exist');
      cy.findByRole('dialog').should('have.attr', 'aria-modal', 'true');
      cy.findByRole('dialog').should('have.attr', 'aria-labelledby');
      
      // Test focus management
      cy.focused().should('be.inside', '[role="dialog"]');
      
      // Test escape key
      cy.get('body').type('{esc}');
      cy.findByRole('dialog').should('not.exist');
      
      cy.checkA11y();
    });

    it('dropdown menus support keyboard navigation', () => {
      cy.visit('/funds/new');
      
      const dropdown = cy.findByLabelText(/fund type/i);
      
      dropdown.focus();
      dropdown.type('{downarrow}');
      
      // Verify dropdown opens
      cy.findByRole('listbox').should('be.visible');
      
      // Navigate options
      cy.focused().type('{downarrow}');
      cy.focused().should('have.attr', 'role', 'option');
      
      // Select option
      cy.focused().type('{enter}');
      
      cy.checkA11y();
    });

    it('data tables support screen readers', () => {
      cy.visit('/investors');
      cy.wait(1000);
      
      const table = cy.findByRole('table');
      
      // Check table structure
      table.should('have.attr', 'aria-label');
      table.findByRole('rowgroup').should('exist'); // thead
      table.findAllByRole('rowgroup').should('have.length', 2); // thead and tbody
      
      // Check column headers
      cy.findAllByRole('columnheader').each($header => {
        cy.wrap($header).should('have.attr', 'scope', 'col');
      });
      
      // Check row headers if present
      cy.findAllByRole('rowheader').each($header => {
        cy.wrap($header).should('have.attr', 'scope', 'row');
      });
      
      cy.checkA11y();
    });
  });

  describe('Form Accessibility', () => {
    it('complex forms maintain proper structure', () => {
      cy.visit('/capital-activities/new');
      cy.wait(1000);
      
      // Check fieldset groupings
      cy.findAllByRole('group').should('have.length.greaterThan', 0);
      cy.findAllByRole('group').each($group => {
        cy.wrap($group).find('legend').should('exist');
      });
      
      // Test error summary
      cy.findByRole('button', { name: /create/i }).click();
      
      cy.findByRole('alert').should('exist');
      cy.findByRole('alert').should('contain.text', 'Please correct the following errors');
      
      // Verify error links
      cy.findByRole('alert').findAllByRole('link').each($link => {
        cy.wrap($link).click();
        cy.focused().should('have.attr', 'aria-invalid', 'true');
      });
      
      cy.checkA11y();
    });

    it('date pickers are accessible', () => {
      cy.visit('/capital-activities/new');
      
      const datePicker = cy.findByLabelText(/call date/i);
      
      datePicker.should('have.attr', 'role', 'textbox');
      datePicker.should('have.attr', 'aria-expanded', 'false');
      
      datePicker.click();
      datePicker.should('have.attr', 'aria-expanded', 'true');
      
      // Calendar should be accessible
      cy.findByRole('grid').should('exist'); // Calendar grid
      cy.findByRole('grid').should('have.attr', 'aria-label');
      
      cy.checkA11y();
    });

    it('file upload components are accessible', () => {
      cy.visit('/documents/upload');
      cy.wait(1000);
      
      const fileInput = cy.findByLabelText(/upload document/i);
      
      fileInput.should('have.attr', 'type', 'file');
      fileInput.should('have.attr', 'aria-describedby');
      
      // Check helper text
      const helpText = fileInput.invoke('attr', 'aria-describedby');
      cy.get(`#${helpText}`).should('contain.text', 'Accepted formats');
      
      cy.checkA11y();
    });
  });

  describe('Dynamic Content', () => {
    it('loading states are announced properly', () => {
      cy.visit('/funds');
      
      // Intercept API to add delay
      cy.intercept('GET', '/api/funds', req => {
        req.reply({
          delay: 2000,
          fixture: 'funds.json'
        });
      }).as('loadFunds');
      
      cy.reload();
      
      // Check loading indicator
      cy.findByRole('status').should('exist');
      cy.findByRole('status').should('have.attr', 'aria-live', 'polite');
      cy.findByRole('status').should('contain.text', 'Loading');
      
      cy.wait('@loadFunds');
      
      // Verify content loaded
      cy.findByRole('table').should('be.visible');
      cy.checkA11y();
    });

    it('error messages are properly announced', () => {
      // Simulate API error
      cy.intercept('GET', '/api/funds', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('fundError');
      
      cy.visit('/funds');
      cy.wait('@fundError');
      
      // Check error announcement
      cy.findByRole('alert').should('exist');
      cy.findByRole('alert').should('have.attr', 'aria-live', 'assertive');
      cy.findByRole('alert').should('contain.text', 'Unable to load funds');
      
      cy.checkA11y();
    });

    it('success messages are accessible', () => {
      cy.visit('/funds/new');
      
      // Fill form and submit
      cy.findByLabelText(/fund name/i).type('Accessibility Test Fund');
      cy.findByLabelText(/fund type/i).select('Private Equity');
      cy.findByLabelText(/target size/i).type('100000000');
      
      cy.findByRole('button', { name: /create fund/i }).click();
      
      // Check success message
      cy.findByRole('alert').should('exist');
      cy.findByRole('alert').should('have.attr', 'aria-live', 'polite');
      cy.findByRole('alert').should('contain.text', 'Fund created successfully');
      
      cy.checkA11y();
    });
  });

  describe('Color and Contrast', () => {
    it('maintains sufficient color contrast', () => {
      cy.visit('/dashboard');
      cy.wait(1000);
      
      // Check color contrast specifically
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('information is not conveyed by color alone', () => {
      cy.visit('/funds');
      
      // Check status indicators
      cy.findAllByTestId('fund-status').each($status => {
        // Should have text or icon in addition to color
        cy.wrap($status).should('not.be.empty');
        cy.wrap($status).should(el => {
          const hasText = el.text().trim().length > 0;
          const hasIcon = el.find('[role="img"]').length > 0;
          expect(hasText || hasIcon).to.be.true;
        });
      });
      
      cy.checkA11y();
    });
  });

  describe('Screen Reader Testing', () => {
    it('page landmarks are properly defined', () => {
      cy.visit('/dashboard');
      
      // Check main landmarks
      cy.findByRole('banner').should('exist'); // Header
      cy.findByRole('main').should('exist'); // Main content
      cy.findByRole('navigation').should('exist'); // Navigation
      cy.findByRole('contentinfo').should('exist'); // Footer
      
      // Check heading hierarchy
      cy.get('h1').should('have.length', 1);
      cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
        const levels = Array.from($headings).map(h => parseInt(h.tagName.slice(1)));
        
        // Verify proper heading sequence
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i] - levels[i-1]).to.be.at.most(1);
        }
      });
      
      cy.checkA11y();
    });

    it('images have appropriate alt text', () => {
      cy.visit('/dashboard');
      cy.wait(1000);
      
      cy.get('img').each($img => {
        const alt = $img.attr('alt');
        const role = $img.attr('role');
        
        // Decorative images should have empty alt or role="presentation"
        // Informative images should have meaningful alt text
        if (role === 'presentation' || alt === '') {
          // Decorative image - OK
        } else {
          expect(alt).to.exist;
          expect(alt.length).to.be.greaterThan(0);
        }
      });
      
      cy.checkA11y();
    });
  });

  describe('Mobile Accessibility', () => {
    it('maintains accessibility on mobile viewports', () => {
      cy.viewport('iphone-x');
      cy.visit('/funds');
      cy.wait(1000);
      
      cy.checkA11y();
      
      // Test mobile menu
      cy.findByRole('button', { name: /menu/i }).click();
      cy.findByRole('navigation').should('be.visible');
      
      // Test touch targets
      cy.findAllByRole('button').each($button => {
        cy.wrap($button).then($el => {
          const rect = $el[0].getBoundingClientRect();
          const minSize = 44; // Minimum touch target size
          
          expect(Math.max(rect.width, rect.height)).to.be.at.least(minSize);
        });
      });
    });

    it('supports zoom up to 200%', () => {
      cy.visit('/funds');
      
      // Simulate 200% zoom
      cy.get('body').invoke('css', 'zoom', '2');
      cy.wait(500);
      
      // Verify content is still accessible
      cy.checkA11y();
      
      // Test key functionality still works
      cy.findByRole('button', { name: /create fund/i }).should('be.visible').click();
      cy.findByRole('dialog').should('exist');
    });
  });

  describe('Assistive Technology Integration', () => {
    it('works with virtual screen reader cursors', () => {
      cy.visit('/investors');
      cy.wait(1000);
      
      // Test that content is properly exposed to screen readers
      cy.get('body').then($body => {
        // Should have proper ARIA structure
        const hasAriaLabelledBy = $body.find('[aria-labelledby]').length > 0;
        const hasAriaDescribedBy = $body.find('[aria-describedby]').length > 0;
        const hasAriaLabel = $body.find('[aria-label]').length > 0;
        
        expect(hasAriaLabelledBy || hasAriaDescribedBy || hasAriaLabel).to.be.true;
      });
      
      cy.checkA11y();
    });

    it('provides appropriate ARIA live regions', () => {
      cy.visit('/dashboard');
      
      // Check for live regions
      cy.get('[aria-live]').should('exist');
      
      // Trigger dynamic update
      cy.findByRole('button', { name: /refresh/i }).click();
      
      // Verify update is announced
      cy.findByRole('status').should('contain.text', 'Updated');
      
      cy.checkA11y();
    });
  });

  // Custom accessibility commands for common patterns
  Cypress.Commands.add('checkFormAccessibility', (formSelector) => {
    cy.get(formSelector).within(() => {
      // Check all inputs have labels
      cy.get('input, select, textarea').each($input => {
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaLabelledBy = $input.attr('aria-labelledby');
        
        if (!ariaLabel && !ariaLabelledBy) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
      
      // Check required fields are marked
      cy.get('[required]').each($required => {
        cy.wrap($required).should('have.attr', 'aria-required', 'true');
      });
    });
  });

  Cypress.Commands.add('checkTableAccessibility', (tableSelector) => {
    cy.get(tableSelector).within(() => {
      // Check table structure
      cy.get('thead').should('exist');
      cy.get('tbody').should('exist');
      
      // Check headers have proper scope
      cy.get('th').each($th => {
        cy.wrap($th).should('have.attr', 'scope');
      });
      
      // Check table has caption or aria-label
      cy.get('caption').should('exist')
        .or(cy.get(tableSelector).should('have.attr', 'aria-label'));
    });
  });
});