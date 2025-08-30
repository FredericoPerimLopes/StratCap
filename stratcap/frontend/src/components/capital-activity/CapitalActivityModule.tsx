import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Dialog
} from '@mui/material';
import {
  Call as CallIcon,
  TrendingDown as DistributionIcon,
  Waterfall as WaterfallIcon,
  Balance as EqualizationIcon
} from '@mui/icons-material';

// Import all the components we created
import CapitalCallDashboard from './calls/CapitalCallDashboard';
import CapitalCallCreation from './calls/CapitalCallCreation';
import CapitalCallReview from './calls/CapitalCallReview';
import DistributionDashboard from './distributions/DistributionDashboard';
import WaterfallCalculation from './waterfall/WaterfallCalculation';
import EqualizationDashboard from './equalization/EqualizationDashboard';

// Types
import {
  Fund,
  Investor,
  CapitalCall,
  Distribution,
  WaterfallStructure,
  Equalization
} from '../../types/capital-activity';

interface CapitalActivityModuleProps {
  funds: Fund[];
  investors: Investor[];
  waterfallStructures: WaterfallStructure[];
  selectedFundId?: string;
  onFundChange?: (fundId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`capital-activity-tabpanel-${index}`}
      aria-labelledby={`capital-activity-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `capital-activity-tab-${index}`,
    'aria-controls': `capital-activity-tabpanel-${index}`,
  };
}

type ModalState = {
  type: 'capital-call-creation' | 'capital-call-review' | 'distribution-creation' | 'waterfall-calculation' | null;
  data?: any;
};

const CapitalActivityModule: React.FC<CapitalActivityModuleProps> = ({
  funds,
  investors,
  waterfallStructures,
  selectedFundId,
  onFundChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFund, setSelectedFund] = useState<Fund | undefined>(
    funds.find(f => f.id === selectedFundId)
  );
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update selected fund when prop changes
  useEffect(() => {
    const fund = funds.find(f => f.id === selectedFundId);
    setSelectedFund(fund);
  }, [selectedFundId, funds]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFundChange = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    setSelectedFund(fund);
    if (onFundChange) {
      onFundChange(fundId);
    }
  };

  const handleCreateCapitalCall = () => {
    if (!selectedFund) {
      setError('Please select a fund first');
      return;
    }
    setModal({ type: 'capital-call-creation' });
  };

  const handleEditCapitalCall = (call: CapitalCall) => {
    setModal({ type: 'capital-call-review', data: call });
  };

  const handleViewCapitalCall = (call: CapitalCall) => {
    setModal({ type: 'capital-call-review', data: call });
  };

  const handleCreateDistribution = () => {
    if (!selectedFund) {
      setError('Please select a fund first');
      return;
    }
    setModal({ type: 'distribution-creation' });
  };

  const handleEditDistribution = (distribution: Distribution) => {
    setModal({ type: 'distribution-creation', data: distribution });
  };

  const handleViewDistribution = (distribution: Distribution) => {
    // Could open a distribution details view
    console.log('View distribution:', distribution);
  };

  const handleCalculateWaterfall = (distribution: Distribution) => {
    setModal({ type: 'waterfall-calculation', data: distribution });
  };

  const handleCreateEqualization = () => {
    if (!selectedFund) {
      setError('Please select a fund first');
      return;
    }
    // Could open equalization creation modal
    console.log('Create equalization for fund:', selectedFund);
  };

  const handleEditEqualization = (equalization: Equalization) => {
    // Could open equalization edit modal
    console.log('Edit equalization:', equalization);
  };

  const handleViewEqualization = (equalization: Equalization) => {
    // Could open equalization details view
    console.log('View equalization:', equalization);
  };

  const handleModalClose = () => {
    setModal({ type: null });
    setError(null);
  };

  const handleCapitalCallComplete = (callId: string) => {
    console.log('Capital call created:', callId);
    setModal({ type: null });
    // Could refresh data or show success message
  };

  const handleWaterfallSave = (calculation: any) => {
    console.log('Waterfall calculation saved:', calculation);
    setModal({ type: null });
    // Could refresh data or show success message
  };

  const tabs = [
    {
      label: 'Capital Calls',
      icon: <CallIcon />,
      component: (
        <CapitalCallDashboard
          selectedFund={selectedFund}
          onCreateCall={handleCreateCapitalCall}
          onEditCall={handleEditCapitalCall}
          onViewCall={handleViewCapitalCall}
        />
      )
    },
    {
      label: 'Distributions',
      icon: <DistributionIcon />,
      component: (
        <DistributionDashboard
          selectedFund={selectedFund}
          onCreateDistribution={handleCreateDistribution}
          onEditDistribution={handleEditDistribution}
          onViewDistribution={handleViewDistribution}
          onCalculateWaterfall={handleCalculateWaterfall}
        />
      )
    },
    {
      label: 'Waterfall',
      icon: <WaterfallIcon />,
      component: (
        <Box textAlign="center" py={4}>
          <WaterfallIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Waterfall calculations are accessed through distributions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Use the Distributions tab to create and calculate waterfalls
          </Typography>
        </Box>
      )
    },
    {
      label: 'Equalization',
      icon: <EqualizationIcon />,
      component: (
        <EqualizationDashboard
          selectedFund={selectedFund}
          investors={investors}
          onCreateEqualization={handleCreateEqualization}
          onEditEqualization={handleEditEqualization}
          onViewEqualization={handleViewEqualization}
        />
      )
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/">
            Dashboard
          </Link>
          <Typography color="text.primary">Capital Activity</Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Capital Activity Management
          </Typography>
          
          {/* Fund Selector */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="fund-select-label">Select Fund</InputLabel>
            <Select
              labelId="fund-select-label"
              value={selectedFund?.id || ''}
              label="Select Fund"
              onChange={(e) => handleFundChange(e.target.value)}
            >
              {funds.map((fund) => (
                <MenuItem key={fund.id} value={fund.id}>
                  {fund.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* No Fund Selected Warning */}
      {!selectedFund && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please select a fund to view and manage capital activity.
        </Alert>
      )}

      {/* Tabs */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="capital activity tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              {...a11yProps(index)}
              sx={{ minHeight: 72 }}
            />
          ))}
        </Tabs>

        {/* Tab Panels */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            <Box sx={{ p: 3 }}>
              {tab.component}
            </Box>
          </TabPanel>
        ))}
      </Paper>

      {/* Modals */}
      
      {/* Capital Call Creation Modal */}
      <Dialog
        open={modal.type === 'capital-call-creation'}
        onClose={handleModalClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        {selectedFund && (
          <Box sx={{ p: 2 }}>
            <CapitalCallCreation
              fund={selectedFund}
              investors={investors}
              onComplete={handleCapitalCallComplete}
              onCancel={handleModalClose}
            />
          </Box>
        )}
      </Dialog>

      {/* Capital Call Review Modal */}
      <Dialog
        open={modal.type === 'capital-call-review'}
        onClose={handleModalClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        {modal.data && (
          <Box sx={{ p: 2 }}>
            <CapitalCallReview
              capitalCall={modal.data}
              onApprove={(notes) => {
                console.log('Approve call:', modal.data.id, notes);
                handleModalClose();
              }}
              onReject={(reason) => {
                console.log('Reject call:', modal.data.id, reason);
                handleModalClose();
              }}
              onIssue={() => {
                console.log('Issue call:', modal.data.id);
                handleModalClose();
              }}
              onEdit={() => {
                console.log('Edit call:', modal.data.id);
                handleModalClose();
              }}
              canApprove={true}
              canEdit={modal.data.status === 'draft'}
              canIssue={modal.data.status === 'approved'}
            />
          </Box>
        )}
      </Dialog>

      {/* Waterfall Calculation Modal */}
      <Dialog
        open={modal.type === 'waterfall-calculation'}
        onClose={handleModalClose}
        maxWidth="xl"
        fullWidth
        PaperProps={
          sx: { minHeight: '90vh' }
        }
      >
        {modal.data && (
          <Box sx={{ p: 2 }}>
            <WaterfallCalculation
              distribution={modal.data}
              waterfallStructures={waterfallStructures}
              onSave={handleWaterfallSave}
              onClose={handleModalClose}
            />
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default CapitalActivityModule;
