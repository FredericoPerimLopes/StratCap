import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  styled,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';

const StyledBreadcrumbs = styled(MuiBreadcrumbs)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  '& .MuiBreadcrumbs-separator': {
    color: theme.palette.text.secondary,
  },
}));

const BreadcrumbLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const BreadcrumbText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  maxItems?: number;
  showHome?: boolean;
  homeLabel?: string;
  homePath?: string;
}

// Route mapping for automatic breadcrumb generation
const routeMap: Record<string, string> = {
  '/': 'Dashboard',
  '/funds': 'Funds',
  '/fund-families': 'Fund Families',
  '/investors': 'Investors',
  '/capital-activities': 'Capital Activities',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/waterfall': 'Waterfall',
  '/fee-management': 'Fee Management',
  '/credit-facilities': 'Credit Facilities',
  '/global-entities': 'Global Entities',
  '/data-analysis': 'Data Analysis',
  '/general-ledger': 'General Ledger',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  maxItems = 8,
  showHome = true,
  homeLabel = 'Dashboard',
  homePath = '/',
}) => {
  const location = useLocation();

  // Generate breadcrumbs from current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome && location.pathname !== homePath) {
      breadcrumbs.push({
        label: homeLabel,
        href: homePath,
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Try to get a readable label from route map or format the segment
      let label = routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Handle dynamic segments (numbers, IDs)
      if (/^\d+$/.test(segment)) {
        label = `#${segment}`;
      }
      
      // Replace hyphens with spaces and capitalize
      label = label.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box>
      <StyledBreadcrumbs
        maxItems={maxItems}
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast || !item.href) {
            return (
              <BreadcrumbText key={index} color="text.primary">
                {item.label}
              </BreadcrumbText>
            );
          }

          return (
            <BreadcrumbLink
              key={index}
              component={RouterLink}
              to={item.href}
            >
              {item.label}
            </BreadcrumbLink>
          );
        })}
      </StyledBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;