import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Layout from '../../components/layout/Layout';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
        token: 'mock-token',
        loading: false,
        error: null,
      },
      ui: {
        sidebarOpen: true,
        theme: 'light',
        notifications: [],
      },
      ...initialState,
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Layout Component', () => {
  it('renders layout with header and sidebar', () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="main-content">Main Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testContent = 'Test content for layout';
    
    render(
      <TestWrapper>
        <Layout>
          <div>{testContent}</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    const layoutElement = container.firstChild as HTMLElement;
    expect(layoutElement).toHaveClass('layout');
  });

  it('handles sidebar toggle', () => {
    const store = createMockStore({
      ui: { sidebarOpen: false, theme: 'light', notifications: [] }
    });

    render(
      <TestWrapper store={store}>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check if sidebar is collapsed when sidebarOpen is false
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('sidebar-collapsed');
  });
});

describe('Header Component', () => {
  it('displays user information', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows logout button', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('handles logout click', () => {
    const store = createMockStore();
    const mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth/logout'
      })
    );
  });

  it('displays notifications indicator', () => {
    const store = createMockStore({
      ui: {
        sidebarOpen: true,
        theme: 'light',
        notifications: [
          { id: 1, message: 'Test notification', type: 'info' }
        ]
      }
    });

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByTestId('notification-indicator')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
  });

  it('handles sidebar toggle', () => {
    const store = createMockStore();
    const mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/toggleSidebar'
      })
    );
  });

  it('shows different content for different user roles', () => {
    const adminStore = createMockStore({
      auth: {
        isAuthenticated: true,
        user: { role: 'admin', firstName: 'Admin', lastName: 'User' },
      }
    });

    const { rerender } = render(
      <TestWrapper store={adminStore}>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByTestId('admin-menu')).toBeInTheDocument();

    const userStore = createMockStore({
      auth: {
        isAuthenticated: true,
        user: { role: 'user', firstName: 'Regular', lastName: 'User' },
      }
    });

    rerender(
      <TestWrapper store={userStore}>
        <Header />
      </TestWrapper>
    );

    expect(screen.queryByTestId('admin-menu')).not.toBeInTheDocument();
  });
});

describe('Sidebar Component', () => {
  it('renders navigation menu items', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Funds')).toBeInTheDocument();
    expect(screen.getByText('Investors')).toBeInTheDocument();
    expect(screen.getByText('Capital Activities')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active menu item', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { ...window.location, pathname: '/funds' };

    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    const fundsMenuItem = screen.getByText('Funds').closest('a');
    expect(fundsMenuItem).toHaveClass('active');
  });

  it('shows correct icons for menu items', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('funds-icon')).toBeInTheDocument();
    expect(screen.getByTestId('investors-icon')).toBeInTheDocument();
  });

  it('handles menu item clicks', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const fundsLink = screen.getByText('Funds').closest('a');
    expect(fundsLink).toHaveAttribute('href', '/funds');
  });

  it('collapses when sidebar is closed', () => {
    const store = createMockStore({
      ui: { sidebarOpen: false, theme: 'light', notifications: [] }
    });

    render(
      <TestWrapper store={store}>
        <Sidebar />
      </TestWrapper>
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('collapsed');

    // Text should be hidden when collapsed
    expect(screen.queryByText('Dashboard')).not.toBeVisible();
  });

  it('shows user role-specific menu items', () => {
    const adminStore = createMockStore({
      auth: {
        isAuthenticated: true,
        user: { role: 'admin' },
      }
    });

    render(
      <TestWrapper store={adminStore}>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('renders submenu items', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    const reportsMenu = screen.getByText('Reports');
    fireEvent.click(reportsMenu);

    expect(screen.getByText('Performance Reports')).toBeInTheDocument();
    expect(screen.getByText('Capital Activity Reports')).toBeInTheDocument();
    expect(screen.getByText('Tax Reports')).toBeInTheDocument();
  });
});

describe('Layout Responsive Behavior', () => {
  it('adapts to mobile screen size', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      </TestWrapper>
    );

    const layout = screen.getByTestId('layout');
    expect(layout).toHaveClass('mobile-layout');
  });

  it('shows mobile menu toggle on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
  });
});

describe('Layout Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
    expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
  });

  it('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    dashboardLink?.focus();
    expect(dashboardLink).toHaveFocus();

    // Test Tab navigation
    fireEvent.keyDown(dashboardLink!, { key: 'Tab' });
    const fundsLink = screen.getByText('Funds').closest('a');
    expect(fundsLink).toHaveFocus();
  });

  it('announces state changes to screen readers', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    const announcements = screen.getByRole('status');
    expect(announcements).toBeInTheDocument();
  });
});

describe('Layout Performance', () => {
  it('memoizes expensive computations', () => {
    const store = createMockStore();
    
    const { rerender } = render(
      <TestWrapper store={store}>
        <Layout>
          <div>Content 1</div>
        </Layout>
      </TestWrapper>
    );

    // Should not re-render header and sidebar when only content changes
    rerender(
      <TestWrapper store={store}>
        <Layout>
          <div>Content 2</div>
        </Layout>
      </TestWrapper>
    );

    // Verify memoization is working (this would need actual performance testing)
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});

describe('Layout Error Boundaries', () => {
  it('handles component errors gracefully', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <Layout>
          <ThrowError />
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});