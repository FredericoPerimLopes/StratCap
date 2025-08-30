import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../setup/mocks';
import { renderWithProviders, createMockInvestor } from '../../utils/test-utils';
import InvestorForm from '../../../components/Investors/InvestorForm';

const mockInvestor = createMockInvestor();

beforeEach(() => {
  server.use(
    rest.post('/api/investors', (req, res, ctx) => {
      return res(ctx.json(mockInvestor));
    }),
    rest.put('/api/investors/:id', (req, res, ctx) => {
      return res(ctx.json({ ...mockInvestor, id: req.params.id }));
    }),
    rest.get('/api/investor-classes', (req, res, ctx) => {
      return res(ctx.json([
        { id: '1', name: 'Class A' },
        { id: '2', name: 'Class B' }
      ]));
    })
  );
});

describe('InvestorForm Component', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create investor form correctly', () => {
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /create new investor/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/investor name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/investor type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax id/i)).toBeInTheDocument();
    });

    it('renders edit investor form when investor is provided', () => {
      renderWithProviders(<InvestorForm {...defaultProps} investor={mockInvestor} />);
      
      expect(screen.getByRole('heading', { name: /edit investor/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockInvestor.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockInvestor.email)).toBeInTheDocument();
    });

    it('renders address fields correctly', () => {
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      const addressSection = screen.getByRole('group', { name: /address/i });
      expect(within(addressSection).getByLabelText(/street address/i)).toBeInTheDocument();
      expect(within(addressSection).getByLabelText(/city/i)).toBeInTheDocument();
      expect(within(addressSection).getByLabelText(/state/i)).toBeInTheDocument();
      expect(within(addressSection).getByLabelText(/zip code/i)).toBeInTheDocument();
      expect(within(addressSection).getByLabelText(/country/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/investor name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/investor type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/phone/i), '123');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
      });
    });

    it('validates tax ID format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/tax id/i), '123');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid tax id format/i)).toBeInTheDocument();
      });
    });

    it('validates zip code format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/zip code/i), '123');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid zip code format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Financial Information', () => {
    it('renders investment capacity fields for institutional investors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Institution');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/assets under management/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/investment capacity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/minimum investment/i)).toBeInTheDocument();
      });
    });

    it('renders net worth fields for individual investors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Individual');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/net worth/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/annual income/i)).toBeInTheDocument();
      });
    });

    it('validates financial amounts are positive', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Individual');
      await user.type(screen.getByLabelText(/net worth/i), '-1000000');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/net worth must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('KYC and Accreditation Status', () => {
    it('renders KYC status fields', () => {
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/kyc status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/accreditation status/i)).toBeInTheDocument();
    });

    it('requires KYC documentation upload when status is pending', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/kyc status/i), 'Pending');
      
      await waitFor(() => {
        expect(screen.getByText(/kyc documentation required/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/upload kyc documents/i)).toBeInTheDocument();
      });
    });

    it('shows accreditation verification fields when accredited', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/accreditation status/i), 'Accredited');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/accreditation verification date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/verification method/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with complete investor data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      // Fill out basic information
      await user.type(screen.getByLabelText(/investor name/i), 'Test Investor LLC');
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Institution');
      await user.type(screen.getByLabelText(/email/i), 'test@investor.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');
      await user.type(screen.getByLabelText(/tax id/i), '12-3456789');
      
      // Fill out address
      await user.type(screen.getByLabelText(/street address/i), '123 Investment St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/state/i), 'NY');
      await user.type(screen.getByLabelText(/zip code/i), '10001');
      await user.selectOptions(screen.getByLabelText(/country/i), 'US');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Investor LLC',
            type: 'Institution',
            email: 'test@investor.com',
            phone: '+1-555-123-4567',
            taxId: '12-3456789',
            address: expect.objectContaining({
              street: '123 Investment St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'US'
            })
          })
        );
      });
    });

    it('handles API validation errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/investors', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ 
              error: 'Validation failed',
              details: {
                taxId: 'Tax ID already exists'
              }
            })
          );
        })
      );
      
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      // Fill out minimal required fields
      await user.type(screen.getByLabelText(/investor name/i), 'Test Investor');
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Individual');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/tax id/i), '12-3456789');
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/tax id already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Upload', () => {
    it('handles document upload for KYC', async () => {
      const user = userEvent.setup();
      const file = new File(['test content'], 'kyc-document.pdf', { type: 'application/pdf' });
      
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/kyc status/i), 'Pending');
      
      await waitFor(() => {
        const fileInput = screen.getByLabelText(/upload kyc documents/i);
        expect(fileInput).toBeInTheDocument();
      });
      
      const fileInput = screen.getByLabelText(/upload kyc documents/i);
      await user.upload(fileInput, file);
      
      expect(fileInput).toHaveProperty('files', expect.arrayContaining([file]));
    });

    it('validates file types for document upload', async () => {
      const user = userEvent.setup();
      const invalidFile = new File(['test'], 'document.txt', { type: 'text/plain' });
      
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/kyc status/i), 'Pending');
      
      await waitFor(() => {
        const fileInput = screen.getByLabelText(/upload kyc documents/i);
        expect(fileInput).toBeInTheDocument();
      });
      
      const fileInput = screen.getByLabelText(/upload kyc documents/i);
      await user.upload(fileInput, invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('validates file size limits', async () => {
      const user = userEvent.setup();
      // Create a large file (> 10MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });
      
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/kyc status/i), 'Pending');
      
      const fileInput = screen.getByLabelText(/upload kyc documents/i);
      await user.upload(fileInput, largeFile);
      
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds limit/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains proper form structure', () => {
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Check fieldsets for grouped content
      expect(screen.getByRole('group', { name: /basic information/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /address/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /compliance/i })).toBeInTheDocument();
    });

    it('provides proper error announcements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create investor/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorSummary = screen.getByRole('alert');
        expect(errorSummary).toBeInTheDocument();
        expect(errorSummary).toHaveTextContent(/form contains errors/i);
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/investor name/i);
      await user.click(nameInput);
      expect(nameInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/investor type/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
    });
  });

  describe('Data Privacy', () => {
    it('masks sensitive information in form', () => {
      renderWithProviders(<InvestorForm {...defaultProps} investor={mockInvestor} />);
      
      const taxIdInput = screen.getByLabelText(/tax id/i);
      // Tax ID should be masked except for last 4 digits
      expect(taxIdInput).toHaveAttribute('type', 'password');
    });

    it('provides option to reveal masked data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} investor={mockInvestor} />);
      
      const showButton = screen.getByRole('button', { name: /show tax id/i });
      await user.click(showButton);
      
      const taxIdInput = screen.getByLabelText(/tax id/i);
      expect(taxIdInput).toHaveAttribute('type', 'text');
    });

    it('includes data privacy consent checkbox', () => {
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      const consentCheckbox = screen.getByRole('checkbox', { 
        name: /i consent to the processing of my personal data/i 
      });
      expect(consentCheckbox).toBeInTheDocument();
      expect(consentCheckbox).toBeRequired();
    });
  });

  describe('Financial Calculations', () => {
    it('calculates investment capacity based on net worth', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Individual');
      await user.type(screen.getByLabelText(/net worth/i), '10000000');
      
      await waitFor(() => {
        // Should suggest max investment capacity (typically 10% of net worth)
        expect(screen.getByText(/suggested max investment: \$1,000,000/i)).toBeInTheDocument();
      });
    });

    it('validates investment amounts against capacity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestorForm {...defaultProps} />);
      
      await user.selectOptions(screen.getByLabelText(/investor type/i), 'Individual');
      await user.type(screen.getByLabelText(/net worth/i), '1000000');
      await user.type(screen.getByLabelText(/intended investment/i), '2000000');
      
      await waitFor(() => {
        expect(screen.getByText(/investment exceeds recommended capacity/i)).toBeInTheDocument();
      });
    });
  });
});