import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  TreeView,
  TreeItem,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Code as CodeIcon,
  Category as CategoryIcon,
  Mapping as MappingIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface TransactionCode {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  type: 'inflow' | 'outflow' | 'internal';
  subType?: string;
  isActive: boolean;
  isSystem: boolean;
  settings: {
    requiresApproval: boolean;
    autoPostToGL: boolean;
    glAccountCode?: string;
    feeCalculationImpact: boolean;
    waterfallImpact: boolean;
    reportingCategory?: string;
  };
  validationRules: {
    minAmount?: number;
    maxAmount?: number;
    requiredFields: string[];
    conditionalFields: { field: string; condition: string; value: any }[];
  };
}

interface TransactionCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  color: string;
  isSystem: boolean;
}

interface CodeMapping {
  id: string;
  sourceSystem: string;
  sourceCode: string;
  targetCode: string;
  description: string;
  isActive: boolean;
}

interface TransactionCodeManagerProps {
  configuration: {
    codes: TransactionCode[];
    categories: TransactionCategory[];
    mappings: CodeMapping[];
  };
  onChange: (configuration: any) => void;
  fundFamilyId?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`code-manager-tabpanel-${index}`}
    aria-labelledby={`code-manager-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

const codeValidationSchema = Yup.object({
  code: Yup.string()
    .required('Transaction code is required')
    .matches(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and dashes')
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be less than 20 characters'),
  name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  category: Yup.string().required('Category is required'),
  type: Yup.string().required('Type is required')
});

const TransactionCodeManager: React.FC<TransactionCodeManagerProps> = ({
  configuration,
  onChange,
  fundFamilyId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<TransactionCode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const codeFormik = useFormik({
    initialValues: {
      code: '',
      name: '',
      description: '',
      category: '',
      type: 'inflow' as const,
      subType: '',
      isActive: true,
      settings: {
        requiresApproval: false,
        autoPostToGL: true,
        glAccountCode: '',
        feeCalculationImpact: false,
        waterfallImpact: false,
        reportingCategory: ''
      },
      validationRules: {
        minAmount: undefined,
        maxAmount: undefined,
        requiredFields: ['amount', 'date'],
        conditionalFields: []
      }
    },
    validationSchema: codeValidationSchema,
    onSubmit: (values) => {
      const newCode: TransactionCode = {
        id: editingCode?.id || `code_${Date.now()}`,
        ...values,
        isSystem: editingCode?.isSystem || false,
        subType: values.subType || undefined,
        settings: {
          ...values.settings,
          glAccountCode: values.settings.glAccountCode || undefined,
          reportingCategory: values.settings.reportingCategory || undefined
        },
        validationRules: {
          ...values.validationRules,
          minAmount: values.validationRules.minAmount || undefined,
          maxAmount: values.validationRules.maxAmount || undefined
        }
      };

      const updatedCodes = editingCode
        ? configuration.codes.map(c => c.id === editingCode.id ? newCode : c)
        : [...configuration.codes, newCode];

      onChange({
        ...configuration,
        codes: updatedCodes
      });

      setCodeDialogOpen(false);
      setEditingCode(null);
      codeFormik.resetForm();
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditCode = (code: TransactionCode) => {
    setEditingCode(code);
    codeFormik.setValues({
      code: code.code,
      name: code.name,
      description: code.description,
      category: code.category,
      type: code.type,
      subType: code.subType || '',
      isActive: code.isActive,
      settings: code.settings,
      validationRules: {
        ...code.validationRules,
        minAmount: code.validationRules.minAmount || undefined,
        maxAmount: code.validationRules.maxAmount || undefined
      }
    });
    setCodeDialogOpen(true);
  };

  const handleDeleteCode = (codeId: string) => {
    const code = configuration.codes.find(c => c.id === codeId);
    if (code?.isSystem) {
      alert('System transaction codes cannot be deleted');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this transaction code?')) {
      const updatedCodes = configuration.codes.filter(c => c.id !== codeId);
      const updatedMappings = configuration.mappings.filter(m => m.targetCode !== code?.code);

      onChange({
        ...configuration,
        codes: updatedCodes,
        mappings: updatedMappings
      });
    }
  };

  const addNewCode = () => {
    setEditingCode(null);
    codeFormik.resetForm();
    setCodeDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inflow': return 'success';
      case 'outflow': return 'error';
      case 'internal': return 'info';
      default: return 'default';
    }
  };

  // Default transaction categories
  const defaultCategories: TransactionCategory[] = [
    {
      id: 'capital',
      name: 'Capital Transactions',
      description: 'Capital calls, distributions, and commitments',
      color: '#1976d2',
      isSystem: true
    },
    {
      id: 'fees',
      name: 'Fee Transactions',
      description: 'Management fees, carried interest, and other fees',
      color: '#f57c00',
      isSystem: true
    },
    {
      id: 'investments',
      name: 'Investment Transactions',
      description: 'Investment acquisitions, disposals, and valuations',
      color: '#388e3c',
      isSystem: true
    },
    {
      id: 'expenses',
      name: 'Operating Expenses',
      description: 'Fund operating expenses and costs',
      color: '#d32f2f',
      isSystem: true
    },
    {
      id: 'interest',
      name: 'Interest & Income',
      description: 'Interest income, dividends, and other income',
      color: '#7b1fa2',
      isSystem: true
    }
  ];

  // Combine default and custom categories
  const allCategories = [...defaultCategories, ...configuration.categories];

  // Default transaction codes
  const defaultCodes: TransactionCode[] = [
    {
      id: 'capital_call',
      code: 'CAP_CALL',
      name: 'Capital Call',
      description: 'Capital contribution from investors',
      category: 'capital',
      type: 'inflow',
      isActive: true,
      isSystem: true,
      settings: {
        requiresApproval: true,
        autoPostToGL: true,
        feeCalculationImpact: true,
        waterfallImpact: false,
        reportingCategory: 'Capital Activities'
      },
      validationRules: {
        requiredFields: ['amount', 'date', 'investor', 'dueDate'],
        conditionalFields: []
      }
    },
    {
      id: 'distribution',
      code: 'DIST',
      name: 'Distribution',
      description: 'Distribution to investors',
      category: 'capital',
      type: 'outflow',
      isActive: true,
      isSystem: true,
      settings: {
        requiresApproval: true,
        autoPostToGL: true,
        feeCalculationImpact: false,
        waterfallImpact: true,
        reportingCategory: 'Capital Activities'
      },
      validationRules: {
        requiredFields: ['amount', 'date', 'investor', 'distributionType'],
        conditionalFields: []
      }
    },
    {
      id: 'mgmt_fee',
      code: 'MGMT_FEE',
      name: 'Management Fee',
      description: 'Management fee charge',
      category: 'fees',
      type: 'outflow',
      isActive: true,
      isSystem: true,
      settings: {
        requiresApproval: false,
        autoPostToGL: true,
        feeCalculationImpact: false,
        waterfallImpact: false,
        reportingCategory: 'Fee Activities'
      },
      validationRules: {
        requiredFields: ['amount', 'date', 'calculationPeriod'],
        conditionalFields: []
      }
    }
  ];

  // Combine default and custom codes
  const allCodes = [...defaultCodes, ...configuration.codes];

  const filteredCodes = selectedCategory 
    ? allCodes.filter(code => code.category === selectedCategory)
    : allCodes;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const subTypes = {
    inflow: ['subscription', 'interest', 'dividend', 'proceeds', 'other'],
    outflow: ['investment', 'distribution', 'expense', 'fee', 'other'],
    internal: ['transfer', 'adjustment', 'allocation', 'reclass', 'other']
  };

  const reportingCategories = [
    'Capital Activities',
    'Fee Activities',
    'Investment Activities',
    'Operating Activities',
    'Other'
  ];

  const requiredFieldOptions = [
    'amount',
    'date',
    'investor',
    'fund',
    'dueDate',
    'description',
    'reference',
    'calculationPeriod',
    'distributionType',
    'approver'
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600">
            Transaction Code Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure transaction codes, categories, and system mappings
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setCategoryDialogOpen(true)}
          >
            Manage Categories
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addNewCode}
          >
            Add Transaction Code
          </Button>
        </Box>
      </Box>

      {/* Configuration Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              icon={<CodeIcon />} 
              label={`Codes (${allCodes.length})`}
              id="code-manager-tab-0"
              aria-controls="code-manager-tabpanel-0"
            />
            <Tab 
              icon={<CategoryIcon />} 
              label={`Categories (${allCategories.length})`}
              id="code-manager-tab-1"
              aria-controls="code-manager-tabpanel-1"
            />
            <Tab 
              icon={<MappingIcon />} 
              label={`Mappings (${configuration.mappings.length})`}
              id="code-manager-tab-2"
              aria-controls="code-manager-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Transaction Codes Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Filter by Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {allCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Codes Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>GL Integration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCodes
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((code) => (
                      <TableRow key={code.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="600">
                              {code.code}
                            </Typography>
                            {code.isSystem && (
                              <Chip 
                                label="System" 
                                size="small" 
                                color="info"
                                sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{code.name}</Typography>
                          {code.description && (
                            <Typography variant="caption" color="text.secondary">
                              {code.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={allCategories.find(c => c.id === code.category)?.name || code.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={code.type}
                            size="small"
                            color={getTypeColor(code.type) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {code.settings.autoPostToGL ? (
                              <Chip label="Auto" size="small" color="success" />
                            ) : (
                              <Chip label="Manual" size="small" color="default" />
                            )}
                            {code.settings.glAccountCode && (
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {code.settings.glAccountCode}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={code.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={code.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Code">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditCode(code)}
                              disabled={code.isSystem}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={code.isSystem ? 'System codes cannot be deleted' : 'Delete Code'}>
                            <span>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteCode(code.id)}
                                disabled={code.isSystem}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Categories Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {allCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: category.color,
                            mr: 2
                          }}
                        />
                        <Typography variant="h6" fontWeight="600">
                          {category.name}
                        </Typography>
                        {category.isSystem && (
                          <Chip 
                            label="System" 
                            size="small" 
                            color="info"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {allCodes.filter(c => c.category === category.id).length} codes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Mappings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Transaction code mappings allow integration with external systems by 
              mapping their transaction codes to your internal codes.
            </Alert>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setMappingDialogOpen(true)}
              sx={{ mb: 3 }}
            >
              Add Mapping
            </Button>

            {configuration.mappings.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <MappingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No mappings configured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add mappings to integrate with external systems
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Source System</TableCell>
                      <TableCell>Source Code</TableCell>
                      <TableCell>Target Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configuration.mappings.map((mapping) => (
                      <TableRow key={mapping.id} hover>
                        <TableCell>{mapping.sourceSystem}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {mapping.sourceCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" color="primary.main">
                            {mapping.targetCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{mapping.description}</TableCell>
                        <TableCell>
                          <Chip 
                            label={mapping.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={mapping.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Transaction Code Dialog */}
      <Dialog 
        open={codeDialogOpen} 
        onClose={() => {
          setCodeDialogOpen(false);
          setEditingCode(null);
          codeFormik.resetForm();
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingCode ? 'Edit Transaction Code' : 'Add New Transaction Code'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="code"
                label="Transaction Code"
                value={codeFormik.values.code}
                onChange={codeFormik.handleChange}
                onBlur={codeFormik.handleBlur}
                error={codeFormik.touched.code && Boolean(codeFormik.errors.code)}
                helperText={codeFormik.touched.code && codeFormik.errors.code}
                disabled={editingCode?.isSystem}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="name"
                label="Display Name"
                value={codeFormik.values.name}
                onChange={codeFormik.handleChange}
                onBlur={codeFormik.handleBlur}
                error={codeFormik.touched.name && Boolean(codeFormik.errors.name)}
                helperText={codeFormik.touched.name && codeFormik.errors.name}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="description"
                label="Description"
                value={codeFormik.values.description}
                onChange={codeFormik.handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={codeFormik.values.category}
                  onChange={codeFormik.handleChange}
                  label="Category"
                >
                  {allCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={codeFormik.values.type}
                  onChange={codeFormik.handleChange}
                  label="Type"
                >
                  <MenuItem value="inflow">Inflow</MenuItem>
                  <MenuItem value="outflow">Outflow</MenuItem>
                  <MenuItem value="internal">Internal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sub Type</InputLabel>
                <Select
                  name="subType"
                  value={codeFormik.values.subType}
                  onChange={codeFormik.handleChange}
                  label="Sub Type"
                >
                  <MenuItem value="">None</MenuItem>
                  {subTypes[codeFormik.values.type]?.map((subType) => (
                    <MenuItem key={subType} value={subType}>
                      {subType.charAt(0).toUpperCase() + subType.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={codeFormik.values.isActive}
                    onChange={codeFormik.handleChange}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="settings.requiresApproval"
                    checked={codeFormik.values.settings.requiresApproval}
                    onChange={codeFormik.handleChange}
                  />
                }
                label="Requires Approval"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="settings.autoPostToGL"
                    checked={codeFormik.values.settings.autoPostToGL}
                    onChange={codeFormik.handleChange}
                  />
                }
                label="Auto Post to General Ledger"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="settings.glAccountCode"
                label="GL Account Code"
                value={codeFormik.values.settings.glAccountCode}
                onChange={codeFormik.handleChange}
                helperText="General Ledger account code for auto-posting"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Reporting Category</InputLabel>
                <Select
                  name="settings.reportingCategory"
                  value={codeFormik.values.settings.reportingCategory}
                  onChange={codeFormik.handleChange}
                  label="Reporting Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {reportingCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="settings.feeCalculationImpact"
                    checked={codeFormik.values.settings.feeCalculationImpact}
                    onChange={codeFormik.handleChange}
                  />
                }
                label="Impacts Fee Calculations"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="settings.waterfallImpact"
                    checked={codeFormik.values.settings.waterfallImpact}
                    onChange={codeFormik.handleChange}
                  />
                }
                label="Impacts Waterfall Calculations"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Validation Rules
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="validationRules.minAmount"
                label="Minimum Amount"
                value={codeFormik.values.validationRules.minAmount || ''}
                onChange={codeFormik.handleChange}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="validationRules.maxAmount"
                label="Maximum Amount"
                value={codeFormik.values.validationRules.maxAmount || ''}
                onChange={codeFormik.handleChange}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={requiredFieldOptions}
                value={codeFormik.values.validationRules.requiredFields}
                onChange={(_, newValue) => {
                  codeFormik.setFieldValue('validationRules.requiredFields', newValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Required Fields"
                    helperText="Fields that must be provided when using this transaction code"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCodeDialogOpen(false);
            setEditingCode(null);
            codeFormik.resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={codeFormik.handleSubmit as any}
            disabled={!codeFormik.isValid}
          >
            {editingCode ? 'Update Code' : 'Add Code'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Transaction Categories</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Category management interface would allow users to create custom
            transaction categories with color coding and hierarchical organization.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Mapping Dialog */}
      <Dialog
        open={mappingDialogOpen}
        onClose={() => setMappingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Code Mapping</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            Code mapping interface would allow users to map external system
            transaction codes to internal codes for seamless integration.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Add Mapping</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionCodeManager;