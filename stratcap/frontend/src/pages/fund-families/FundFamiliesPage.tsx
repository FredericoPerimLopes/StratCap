import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

const FundFamiliesPage: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Fund Families
        </Typography>
      </Box>

      {/* Content */}
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Fund families management interface coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FundFamiliesPage;