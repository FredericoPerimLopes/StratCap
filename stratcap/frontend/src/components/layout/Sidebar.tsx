import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HomeIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  CreditCardIcon,
  GlobeAltIcon,
  CalculatorIcon,
  BookOpenIcon,
  TableCellsIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '../../store/store';
import { toggleSidebar } from '../../store/slices/uiSlice';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { 
    name: 'Fund Management', 
    icon: BanknotesIcon,
    children: [
      { name: 'Funds', href: '/funds' },
      { name: 'Fund Families', href: '/fund-families' },
    ]
  },
  { name: 'Investors', href: '/investors', icon: UsersIcon },
  { name: 'Capital Activities', href: '/capital-activities', icon: ArrowsRightLeftIcon },
  { name: 'Waterfall', href: '/waterfall', icon: CalculatorIcon },
  { name: 'Credit Facilities', href: '/credit-facilities', icon: CreditCardIcon },
  { name: 'Global Entities', href: '/global-entities', icon: GlobeAltIcon },
  { name: 'Data Analysis', href: '/data-analysis', icon: TableCellsIcon },
  { name: 'General Ledger', href: '/general-ledger/journal-entries', icon: BookOpenIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { 
    name: 'Configuration', 
    icon: CogIcon,
    children: [
      { name: 'System Settings', href: '/configuration/system' },
      { name: 'User Preferences', href: '/configuration/preferences' },
    ]
  },
];

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-900">StratCap</h1>
            )}
          </div>
          <button
            onClick={handleToggleSidebar}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.href ? (
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon
                    className={`${
                      sidebarOpen ? 'mr-3' : 'mx-auto'
                    } flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {sidebarOpen && item.name}
                </NavLink>
              ) : (
                <>
                  <div className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600">
                    <item.icon
                      className={`${
                        sidebarOpen ? 'mr-3' : 'mx-auto'
                      } flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {sidebarOpen && item.name}
                  </div>
                  {sidebarOpen && item.children && (
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`
                          }
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        {sidebarOpen && user && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};