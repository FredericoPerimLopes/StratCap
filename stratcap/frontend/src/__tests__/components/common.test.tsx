import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Mock additional common components that would exist in a real app
const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) => (
  <button
    type={type}
    className={`btn btn-${variant} btn-${size} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`}
    disabled={disabled || loading}
    onClick={onClick}
    data-testid="button"
    {...props}
  >
    {loading ? <LoadingSpinner size="sm" /> : children}
  </button>
);

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div 
        className={`modal modal-${size}`}
        data-testid="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} data-testid="close-button">×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const DataTable: React.FC<{
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  loading?: boolean;
  onRowClick?: (row: any) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}> = ({ data, columns, loading = false, onRowClick, pagination }) => {
  if (loading) {
    return <LoadingSpinner data-testid="table-loading" />;
  }

  return (
    <div data-testid="data-table">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={index}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'clickable' : ''}
              data-testid={`table-row-${index}`}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && (
        <div className="pagination" data-testid="pagination">
          <button 
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            data-testid="prev-page"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
          <button 
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page * pagination.limit >= pagination.total}
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}> = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder,
  disabled = false
}) => (
  <div className="form-field" data-testid={`form-field-${name}`}>
    <label htmlFor={name} className={required ? 'required' : ''}>
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={error ? 'error' : ''}
      data-testid={`input-${name}`}
    />
    {error && (
      <span className="error-message" data-testid={`error-${name}`}>
        {error}
      </span>
    )}
  </div>
);

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner-md');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('spinner-sm');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('spinner-lg');
  });

  it('displays custom text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders without text when text is not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('custom-spinner');
  });
});

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-primary', 'btn-md');
    expect(button).toHaveTextContent('Click me');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-danger');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByTestId('button')).toHaveClass('btn-lg');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('loading');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId('close-button'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId('modal'));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Small Modal" size="sm">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByTestId('modal')).toHaveClass('modal-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Large Modal" size="lg">
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByTestId('modal')).toHaveClass('modal-lg');
  });
});

describe('DataTable Component', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<DataTable data={[]} columns={mockColumns} loading />);

    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('handles row clicks', () => {
    const handleRowClick = jest.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        onRowClick={handleRowClick}
      />
    );

    fireEvent.click(screen.getByTestId('table-row-0'));
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('renders custom cell content', () => {
    const columnsWithRenderer = [
      { key: 'id', label: 'ID' },
      { 
        key: 'name', 
        label: 'Name',
        render: (value: string) => <strong>{value}</strong>
      },
      { key: 'email', label: 'Email' },
    ];

    render(<DataTable data={mockData} columns={columnsWithRenderer} />);

    const nameCell = screen.getByText('John Doe');
    expect(nameCell.tagName).toBe('STRONG');
  });

  it('renders pagination controls', () => {
    const mockPagination = {
      page: 1,
      limit: 10,
      total: 25,
      onPageChange: jest.fn(),
    };

    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        pagination={mockPagination}
      />
    );

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByTestId('prev-page')).toBeDisabled();
    expect(screen.getByTestId('next-page')).not.toBeDisabled();
  });

  it('handles pagination clicks', () => {
    const mockOnPageChange = jest.fn();
    const mockPagination = {
      page: 2,
      limit: 10,
      total: 25,
      onPageChange: mockOnPageChange,
    };

    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        pagination={mockPagination}
      />
    );

    fireEvent.click(screen.getByTestId('next-page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByTestId('prev-page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
});

describe('FormField Component', () => {
  it('renders form field with label and input', () => {
    const handleChange = jest.fn();
    render(
      <FormField
        label="Name"
        name="name"
        value=""
        onChange={handleChange}
      />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = jest.fn();
    render(
      <FormField
        label="Name"
        name="name"
        value=""
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByTestId('input-name'), {
      target: { value: 'John Doe' }
    });

    expect(handleChange).toHaveBeenCalledWith('John Doe');
  });

  it('displays error message', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Email is required"
      />
    );

    expect(screen.getByTestId('error-email')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toHaveClass('error');
  });

  it('shows required indicator', () => {
    render(
      <FormField
        label="Password"
        name="password"
        value=""
        onChange={() => {}}
        required
      />
    );

    expect(screen.getByLabelText('Password')).toHaveClass('required');
  });

  it('disables input when disabled prop is true', () => {
    render(
      <FormField
        label="Disabled Field"
        name="disabled"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    expect(screen.getByTestId('input-disabled')).toBeDisabled();
  });

  it('supports different input types', () => {
    render(
      <FormField
        label="Password"
        name="password"
        type="password"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByTestId('input-password')).toHaveAttribute('type', 'password');
  });

  it('shows placeholder text', () => {
    render(
      <FormField
        label="Search"
        name="search"
        value=""
        onChange={() => {}}
        placeholder="Enter search term..."
      />
    );

    expect(screen.getByTestId('input-search')).toHaveAttribute(
      'placeholder', 
      'Enter search term...'
    );
  });
});

describe('Component Accessibility', () => {
  it('components support keyboard navigation', () => {
    render(
      <div>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </div>
    );

    const buttons = screen.getAllByTestId('button');
    
    buttons[0].focus();
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(buttons[0], { key: 'Tab' });
    expect(buttons[1]).toHaveFocus();
  });

  it('modal traps focus', async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Focus Test">
        <Button>Inside Modal</Button>
      </Modal>
    );

    const modal = screen.getByTestId('modal');
    const button = screen.getByText('Inside Modal');
    
    // Focus should be trapped within modal
    modal.focus();
    fireEvent.keyDown(modal, { key: 'Tab' });
    
    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });

  it('form fields have proper ARIA attributes', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Invalid email"
        required
      />
    );

    const input = screen.getByTestId('input-email');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-email');
  });
});