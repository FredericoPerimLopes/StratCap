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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Class as ClassIcon,
  WaterFall as WaterfallIcon,
  Rule as RuleIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface InvestmentClass {
  id: string;
  name: string;
  code: string;
  type: 'common' | 'preferred' | 'founder' | 'carried_interest';
  priority: number;
  isActive: boolean;
  settings: {
    managementFeeRate?: number;
    carriedInterestRate?: number;
    preferredReturn?: number;
    minInvestment?: number;
    maxInvestment?: number;
    lockupPeriod?: number;
    redemptionNotice?: number;
  };
  waterfall: {
    tiers: WaterfallTier[];
  };
  restrictions: {
    investorTypes: string[];
    maxInvestors?: number;
    transferRestrictions: boolean;
  };
}

interface WaterfallTier {
  id: string;
  name: string;
  priority: number;
  type: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest';
  rate?: number;
  threshold?: number;
  cap?: number;
  distribution: {
    lpPercentage: number;
    gpPercentage: number;
  };
}

interface ClassRule {
  id: string;
  name: string;
  classId: string;
  ruleType: 'eligibility' | 'investment_limit' | 'fee_calculation' | 'distribution';
  conditions: any[];
  actions: any[];
  isActive: boolean;
}

interface ClassConfigurationProps {
  configuration: {
    classes: InvestmentClass[];
    rules: ClassRule[];
    waterfalls: any[];
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
    id={`class-config-tabpanel-${index}`}
    aria-labelledby={`class-config-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

const classValidationSchema = Yup.object({
  name: Yup.string().required('Class name is required').min(2, 'Name must be at least 2 characters'),
  code: Yup.string().required('Class code is required').matches(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and dashes'),
  type: Yup.string().required('Class type is required'),
  priority: Yup.number().required('Priority is required').min(1, 'Priority must be at least 1')
});

const ClassConfiguration: React.FC<ClassConfigurationProps> = ({
  configuration,
  onChange,
  fundFamilyId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [waterfallDialogOpen, setWaterfallDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<InvestmentClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const classFormik = useFormik({
    initialValues: {
      name: '',
      code: '',
      type: 'common' as const,
      priority: 1,
      isActive: true,
      settings: {
        managementFeeRate: 2,
        carriedInterestRate: 20,
        preferredReturn: 8,
        minInvestment: 1000000,
        maxInvestment: undefined,
        lockupPeriod: 12,
        redemptionNotice: 90
      },
      restrictions: {
        investorTypes: ['institutional'],
        maxInvestors: undefined,
        transferRestrictions: true
      }
    },
    validationSchema: classValidationSchema,
    onSubmit: (values) => {
      const newClass: InvestmentClass = {
        id: editingClass?.id || `class_${Date.now()}`,
        ...values,
        settings: {
          ...values.settings,
          maxInvestment: values.settings.maxInvestment || undefined
        },
        waterfall: {
          tiers: editingClass?.waterfall.tiers || []
        },
        restrictions: {
          ...values.restrictions,
          maxInvestors: values.restrictions.maxInvestors || undefined
        }
      };

      const updatedClasses = editingClass
        ? configuration.classes.map(c => c.id === editingClass.id ? newClass : c)
        : [...configuration.classes, newClass];

      onChange({
        ...configuration,
        classes: updatedClasses
      });

      setClassDialogOpen(false);
      setEditingClass(null);
      classFormik.resetForm();
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditClass = (investmentClass: InvestmentClass) => {
    setEditingClass(investmentClass);
    classFormik.setValues({
      name: investmentClass.name,
      code: investmentClass.code,
      type: investmentClass.type,
      priority: investmentClass.priority,
      isActive: investmentClass.isActive,
      settings: investmentClass.settings,
      restrictions: investmentClass.restrictions
    });
    setClassDialogOpen(true);
  };

  const handleDeleteClass = (classId: string) => {
    if (window.confirm('Are you sure you want to delete this investment class?')) {
      const updatedClasses = configuration.classes.filter(c => c.id !== classId);
      const updatedRules = configuration.rules.filter(r => r.classId !== classId);

      onChange({
        ...configuration,
        classes: updatedClasses,
        rules: updatedRules
      });
    }
  };

  const addNewClass = () => {
    setEditingClass(null);
    classFormik.resetForm();
    setClassDialogOpen(true);
  };

  const getClassTypeColor = (type: string) => {
    switch (type) {
      case 'common': return 'primary';
      case 'preferred': return 'secondary';
      case 'founder': return 'success';
      case 'carried_interest': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const investorTypes = [
    'institutional',
    'individual',
    'family_office',
    'pension_fund',
    'insurance_company',
    'bank',
    'sovereign_wealth',
    'fund_of_funds'
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600">
            Investment Class Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define investment classes, waterfall structures, and rules
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addNewClass}
        >
          Add Investment Class
        </Button>
      </Box>

      {/* Configuration Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              icon={<ClassIcon />} 
              label={`Classes (${configuration.classes.length})`}
              id="class-config-tab-0"
              aria-controls="class-config-tabpanel-0"
            />
            <Tab 
              icon={<WaterfallIcon />} 
              label="Waterfall Structures"
              id="class-config-tab-1"
              aria-controls="class-config-tabpanel-1"
            />
            <Tab 
              icon={<RuleIcon />} 
              label={`Rules (${configuration.rules.length})`}
              id="class-config-tab-2"
              aria-controls="class-config-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Investment Classes Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            {configuration.classes.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <ClassIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No investment classes configured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create investment classes to define different participation rights
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addNewClass}>
                  Add First Class
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {configuration.classes
                  .sort((a, b) => a.priority - b.priority)
                  .map((investmentClass) => (
                    <Grid item xs={12} lg={6} key={investmentClass.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" fontWeight="600">
                                  {investmentClass.name}
                                </Typography>
                                <Chip 
                                  label={investmentClass.code} 
                                  size="small" 
                                  variant="outlined" 
                                />
                                <Chip 
                                  label={investmentClass.type.replace('_', ' ')} 
                                  size="small" 
                                  color={getClassTypeColor(investmentClass.type) as any}
                                />
                                {!investmentClass.isActive && (
                                  <Chip label="Inactive" size="small" color="default" />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Priority: {investmentClass.priority}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit Class">
                                <IconButton size="small" onClick={() => handleEditClass(investmentClass)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Class">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteClass(investmentClass.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Management Fee
                              </Typography>
                              <Typography variant="body2" fontWeight="600">
                                {investmentClass.settings.managementFeeRate}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Carried Interest
                              </Typography>
                              <Typography variant="body2" fontWeight="600">
                                {investmentClass.settings.carriedInterestRate}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Min Investment
                              </Typography>
                              <Typography variant="body2" fontWeight="600">
                                {formatCurrency(investmentClass.settings.minInvestment || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Lockup Period
                              </Typography>
                              <Typography variant="body2" fontWeight="600">
                                {investmentClass.settings.lockupPeriod} months
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              Investor Types:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {investmentClass.restrictions.investorTypes.map((type) => (
                                <Chip 
                                  key={type}
                                  label={type.replace('_', ' ')} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                            </Box>
                          </Box>

                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              startIcon={<WaterfallIcon />}
                              onClick={() => {
                                setSelectedClass(investmentClass.id);
                                setWaterfallDialogOpen(true);
                              }}
                            >
                              Configure Waterfall
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              startIcon={<RuleIcon />}
                              onClick={() => {
                                setSelectedClass(investmentClass.id);
                                setRuleDialogOpen(true);
                              }}
                            >
                              Manage Rules
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Waterfall Structures Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Waterfall configuration interface would show detailed tier structures, 
              distribution percentages, and threshold calculations for each investment class.
            </Alert>
            
            {configuration.classes.map((investmentClass) => (
              <Accordion key={investmentClass.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">{investmentClass.name} Waterfall</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Waterfall tier configuration for {investmentClass.name} would be displayed here
                    with drag-and-drop editing capabilities.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </TabPanel>

        {/* Rules Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info">
              Investment class rules and eligibility criteria configuration would be implemented here,
              allowing users to define complex conditional logic for class participation.
            </Alert>
          </Box>
        </TabPanel>
      </Card>

      {/* Investment Class Dialog */}
      <Dialog 
        open={classDialogOpen} 
        onClose={() => {
          setClassDialogOpen(false);
          setEditingClass(null);
          classFormik.resetForm();
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingClass ? 'Edit Investment Class' : 'Add New Investment Class'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="name"
                label="Class Name"
                value={classFormik.values.name}
                onChange={classFormik.handleChange}
                onBlur={classFormik.handleBlur}
                error={classFormik.touched.name && Boolean(classFormik.errors.name)}
                helperText={classFormik.touched.name && classFormik.errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="code"
                label="Class Code"
                value={classFormik.values.code}
                onChange={classFormik.handleChange}
                onBlur={classFormik.handleBlur}
                error={classFormik.touched.code && Boolean(classFormik.errors.code)}
                helperText={classFormik.touched.code && classFormik.errors.code}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Class Type</InputLabel>
                <Select
                  name="type"
                  value={classFormik.values.type}
                  onChange={classFormik.handleChange}
                  label="Class Type"
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="preferred">Preferred</MenuItem>
                  <MenuItem value="founder">Founder</MenuItem>
                  <MenuItem value="carried_interest">Carried Interest</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="priority"
                label="Priority"
                value={classFormik.values.priority}
                onChange={classFormik.handleChange}
                onBlur={classFormik.handleBlur}
                error={classFormik.touched.priority && Boolean(classFormik.errors.priority)}
                helperText={classFormik.touched.priority && classFormik.errors.priority || "Lower numbers have higher priority"}
                InputProps={{ inputProps: { min: 1, max: 100 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={classFormik.values.isActive}
                    onChange={classFormik.handleChange}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Fee Structure
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.managementFeeRate"
                label="Management Fee Rate (%)"
                value={classFormik.values.settings.managementFeeRate}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 10, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.carriedInterestRate"
                label="Carried Interest Rate (%)"
                value={classFormik.values.settings.carriedInterestRate}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 50, step: 1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.preferredReturn"
                label="Preferred Return (%)"
                value={classFormik.values.settings.preferredReturn}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Investment Limits
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="settings.minInvestment"
                label="Minimum Investment"
                value={classFormik.values.settings.minInvestment}
                onChange={classFormik.handleChange}
                InputProps={{ 
                  startAdornment: '$',
                  inputProps: { min: 0, step: 1000 } 
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="settings.maxInvestment"
                label="Maximum Investment (Optional)"
                value={classFormik.values.settings.maxInvestment || ''}
                onChange={classFormik.handleChange}
                InputProps={{ 
                  startAdornment: '$',
                  inputProps: { min: 0, step: 1000 } 
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="settings.lockupPeriod"
                label="Lockup Period (months)"
                value={classFormik.values.settings.lockupPeriod}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 120 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="settings.redemptionNotice"
                label="Redemption Notice (days)"
                value={classFormik.values.settings.redemptionNotice}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 365 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Investor Restrictions
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Allowed Investor Types</InputLabel>
                <Select
                  name="restrictions.investorTypes"
                  multiple
                  value={classFormik.values.restrictions.investorTypes}
                  onChange={classFormik.handleChange}
                  label="Allowed Investor Types"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {investorTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="restrictions.maxInvestors"
                label="Maximum Number of Investors (Optional)"
                value={classFormik.values.restrictions.maxInvestors || ''}
                onChange={classFormik.handleChange}
                InputProps={{ inputProps: { min: 1, max: 10000 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="restrictions.transferRestrictions"
                    checked={classFormik.values.restrictions.transferRestrictions}
                    onChange={classFormik.handleChange}
                  />
                }
                label="Transfer Restrictions Apply"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setClassDialogOpen(false);
            setEditingClass(null);
            classFormik.resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={classFormik.handleSubmit as any}
            disabled={!classFormik.isValid}
          >
            {editingClass ? 'Update Class' : 'Add Class'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Waterfall Configuration Dialog */}
      <Dialog
        open={waterfallDialogOpen}
        onClose={() => setWaterfallDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Configure Waterfall Structure</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Advanced waterfall tier configuration interface would be implemented here,
            allowing drag-and-drop editing of distribution tiers with real-time calculations.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaterfallDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rules Configuration Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Class Rules</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Investment class rules configuration interface would allow users to define
            complex eligibility criteria and automated actions.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassConfiguration;