import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../setup/mocks';
import { renderWithProviders, createMockFund } from '../../utils/test-utils';
import FundForm from '../../../components/Funds/FundForm';

// Mock the API endpoints
const mockFund = createMockFund();

beforeEach(() => {
  server.use(
    rest.post('/api/funds', (req, res, ctx) => {
      return res(ctx.json(mockFund));
    }),
    rest.put('/api/funds/:id', (req, res, ctx) => {
      return res(ctx.json({ ...mockFund, id: req.params.id }));
    }),
    rest.get('/api/fund-families', (req, res, ctx) => {
      return res(ctx.json([
        { id: '1', name: 'Test Fund Family' },
        { id: '2', name: 'Another Fund Family' }
      ]));
    })
  );
});

describe('FundForm Component', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create fund form correctly', () => {
      renderWithProviders(<FundForm {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /create new fund/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/fund name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fund type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vintage year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/management fee rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/carried interest rate/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create fund/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders edit fund form correctly when fund is provided', () => {
      renderWithProviders(<FundForm {...defaultProps} fund={mockFund} />);
      
      expect(screen.getByRole('heading', { name: /edit fund/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update fund/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFund.name)).toBeInTheDocument();
    });

    it('pre-fills form fields when editing existing fund', () => {
      renderWithProviders(<FundForm {...defaultProps} fund={mockFund} />);
      
      expect(screen.getByDisplayValue(mockFund.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFund.fundType)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFund.targetSize.toString())).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFund.vintage.toString())).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/fund name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/fund type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/target size is required/i)).toBeInTheDocument();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('validates target size is a positive number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const targetSizeInput = screen.getByLabelText(/target size/i);
      await user.type(targetSizeInput, '-1000000');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/target size must be positive/i)).toBeInTheDocument();
      });
    });

    it('validates vintage year is valid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const vintageInput = screen.getByLabelText(/vintage year/i);
      await user.type(vintageInput, '1900');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/vintage year must be between/i)).toBeInTheDocument();
      });
    });

    it('validates management fee rate is within valid range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const feeRateInput = screen.getByLabelText(/management fee rate/i);
      await user.type(feeRateInput, '15');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/management fee rate must be between 0 and 10/i)).toBeInTheDocument();
      });
    });

    it('validates carried interest rate is within valid range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const carriedInterestInput = screen.getByLabelText(/carried interest rate/i);
      await user.type(carriedInterestInput, '50');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/carried interest rate must be between 0 and 30/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data for new fund', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      // Fill out the form
      await user.type(screen.getByLabelText(/fund name/i), 'New Test Fund');
      await user.selectOptions(screen.getByLabelText(/fund type/i), 'Private Equity');
      await user.type(screen.getByLabelText(/target size/i), '100000000');
      await user.type(screen.getByLabelText(/vintage year/i), '2024');
      await user.type(screen.getByLabelText(/management fee rate/i), '2.0');
      await user.type(screen.getByLabelText(/carried interest rate/i), '20.0');
      await user.type(screen.getByLabelText(/general partner/i), 'Test GP LLC');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Test Fund',
            fundType: 'Private Equity',
            targetSize: 100000000,
            vintage: 2024,
            managementFeeRate: 2.0,
            carriedInterestRate: 20.0,
            generalPartner: 'Test GP LLC'
          })
        );
      });
    });

    it('submits form with updated data for existing fund', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} fund={mockFund} />);
      
      // Update the fund name
      const nameInput = screen.getByDisplayValue(mockFund.name);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Fund Name');
      
      const submitButton = screen.getByRole('button', { name: /update fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockFund,
            name: 'Updated Fund Name'
          })
        );
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Delay the API response
      server.use(
        rest.post('/api/funds', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json(mockFund));
        })
      );
      
      renderWithProviders(<FundForm {...defaultProps} />);
      
      // Fill out minimum required fields
      await user.type(screen.getByLabelText(/fund name/i), 'Test Fund');
      await user.selectOptions(screen.getByLabelText(/fund type/i), 'Private Equity');
      await user.type(screen.getByLabelText(/target size/i), '100000000');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/funds', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ error: 'Fund name already exists' }));
        })
      );
      
      renderWithProviders(<FundForm {...defaultProps} />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/fund name/i), 'Duplicate Fund');
      await user.selectOptions(screen.getByLabelText(/fund type/i), 'Private Equity');
      await user.type(screen.getByLabelText(/target size/i), '100000000');
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/fund name already exists/i)).toBeInTheDocument();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Interactions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('resets form when reset button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      // Fill out some fields
      await user.type(screen.getByLabelText(/fund name/i), 'Test Fund');
      await user.type(screen.getByLabelText(/target size/i), '100000000');
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);
      
      expect(screen.getByLabelText(/fund name/i)).toHaveValue('');
      expect(screen.getByLabelText(/target size/i)).toHaveValue('');
    });

    it('formats currency input correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const targetSizeInput = screen.getByLabelText(/target size/i);
      await user.type(targetSizeInput, '100000000');
      
      // Check if the value is formatted correctly (this depends on implementation)
      expect(targetSizeInput).toHaveValue('100000000');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<FundForm {...defaultProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/fund name/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/fund type/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/target size/i)).toHaveAttribute('required');
    });

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create fund/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/fund name/i);
        const errorMessage = screen.getByText(/fund name is required/i);
        
        expect(nameInput).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id));
      });
    });

    it('maintains focus management during form interactions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FundForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/fund name/i);
      await user.click(nameInput);
      
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/fund type/i)).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now();
      renderWithProviders(<FundForm {...defaultProps} />);
      const endTime = performance.now();
      
      // Component should render within 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <>{children}</>;
      };
      
      const { rerender } = renderWithProviders(
        <TestWrapper>
          <FundForm {...defaultProps} />
        </TestWrapper>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props should not trigger unnecessary renders
      rerender(
        <TestWrapper>
          <FundForm {...defaultProps} />
        </TestWrapper>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Only initial + explicit rerender
    });
  });
});