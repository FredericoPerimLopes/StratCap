import React from 'react';
import { useSelector } from 'react-redux';
import {
  BuildingOfficeIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '../store/store';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="mt-3">
            <span
              className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </span>
            <span className="text-sm text-gray-500"> from last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const stats = [
    {
      title: 'Total Fund Families',
      value: '12',
      icon: BuildingOfficeIcon,
      change: '+2',
      changeType: 'increase' as const,
    },
    {
      title: 'Active Funds',
      value: '24',
      icon: BanknotesIcon,
      change: '+3',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Investors',
      value: '156',
      icon: UsersIcon,
      change: '+12',
      changeType: 'increase' as const,
    },
    {
      title: 'AUM',
      value: '$2.4B',
      icon: ChartBarIcon,
      change: '+8.2%',
      changeType: 'increase' as const,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'Capital Call',
      fund: 'Growth Fund III',
      amount: '$50M',
      date: '2024-01-15',
      status: 'Pending',
    },
    {
      id: 2,
      type: 'Distribution',
      fund: 'Opportunity Fund II',
      amount: '$25M',
      date: '2024-01-14',
      status: 'Completed',
    },
    {
      id: 3,
      type: 'New Commitment',
      fund: 'Growth Fund III',
      amount: '$100M',
      date: '2024-01-13',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here's an overview of your fund administration platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
        </div>
        <div className="px-6 py-4">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.type} - {activity.fund}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.amount} • {activity.date}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : activity.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="btn btn-primary">
            Create Capital Call
          </button>
          <button className="btn btn-secondary">
            Add New Investor
          </button>
          <button className="btn btn-outline">
            Generate Report
          </button>
          <button className="btn btn-outline">
            View Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;