import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import {
  Distribution,
  WaterfallStructure,
  WaterfallCalculation as WaterfallCalcType,
  WaterfallTierResult
} from '../../../types/capital-activity';
import {
  calculateAmericanWaterfall,
  calculateEuropeanWaterfall,
  formatCurrency,
  formatPercentage
} from '../../../utils/financial/calculations';
import { useCapitalActivity } from '../../../hooks/capital-activity/useCapitalActivity';

interface WaterfallCalculationProps {
  distribution: Distribution;
  waterfallStructures: WaterfallStructure[];
  onSave: (calculation: WaterfallCalcType) => void;
  onClose: () => void;
}

interface CalculationInputs {
  waterfallStructureId: string;
  totalContributions: string;
  previousDistributions: string;
  currentNAV: string;
  customParameters?: {
    preferredReturn: string;
    carryPercentage: string;
    catchUpPercentage: string;
  };
}

const WaterfallCalculation: React.FC<WaterfallCalculationProps> = ({
  distribution,
  waterfallStructures,
  onSave,
  onClose
}) => {
  const { calculateWaterfall, loading } = useCapitalActivity();
  const [inputs, setInputs] = useState<CalculationInputs>({
    waterfallStructureId: '',
    totalContributions: '',
    previousDistributions: '',
    currentNAV: '',
    customParameters: {
      preferredReturn: '8',
      carryPercentage: '20',
      catchUpPercentage: '100'
    }
  });
  const [calculation, setCalculation] = useState<WaterfallCalcType | null>(null);
  const [tierResults, setTierResults] = useState<WaterfallTierResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewDialog, setPreviewDialog] = useState(false);

  const selectedStructure = waterfallStructures.find(
    s => s.id === inputs.waterfallStructureId
  );

  const validateInputs = (): boolean => {
    const errors: string[] = [];
    
    if (!inputs.waterfallStructureId) {
      errors.push('Please select a waterfall structure');
    }
    
    try {
      const totalContribs = new Decimal(inputs.totalContributions || 0);
      if (totalContribs.lte(0)) {
        errors.push('Total contributions must be greater than 0');
      }
    } catch {
      errors.push('Invalid total contributions amount');
    }
    
    try {
      new Decimal(inputs.previousDistributions || 0);
    } catch {
      errors.push('Invalid previous distributions amount');
    }
    
    try {
      new Decimal(inputs.currentNAV || 0);
    } catch {
      errors.push('Invalid current NAV amount');
    }
    
    if (selectedStructure?.type === 'american' || selectedStructure?.type === 'hybrid') {
      try {
        const prefReturn = new Decimal(inputs.customParameters?.preferredReturn || 0);
        const carry = new Decimal(inputs.customParameters?.carryPercentage || 0);
        
        if (prefReturn.lt(0) || prefReturn.gt(50)) {
          errors.push('Preferred return must be between 0% and 50%');
        }
        
        if (carry.lt(0) || carry.gt(100)) {
          errors.push('Carry percentage must be between 0% and 100%');
        }
      } catch {
        errors.push('Invalid waterfall parameters');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;
    
    try {
      const totalContribs = new Decimal(inputs.totalContributions);
      const prevDistribs = new Decimal(inputs.previousDistributions || 0);
      const totalDistribution = distribution.total_distribution;
      
      let results: WaterfallTierResult[] = [];
      
      if (selectedStructure?.type === 'american' || selectedStructure?.type === 'hybrid') {
        const preferredReturn = new Decimal(inputs.customParameters?.preferredReturn || 8);
        const carryPercentage = new Decimal(inputs.customParameters?.carryPercentage || 20);
        const catchUpPercentage = new Decimal(inputs.customParameters?.catchUpPercentage || 100);
        
        results = calculateAmericanWaterfall(
          totalDistribution,
          totalContribs,
          prevDistribs,
          preferredReturn,
          carryPercentage,
          catchUpPercentage
        );
      } else if (selectedStructure?.type === 'european') {
        const preferredReturn = new Decimal(inputs.customParameters?.preferredReturn || 8);
        const carryPercentage = new Decimal(inputs.customParameters?.carryPercentage || 20);
        
        // For European waterfall, we need investment basis (simplified here)
        const investmentBasis = totalContribs;
        
        results = calculateEuropeanWaterfall(
          totalDistribution,
          investmentBasis,
          preferredReturn,
          carryPercentage
        );
      }
      
      setTierResults(results);
      
      // Create calculation summary
      const totalLP = results.reduce((sum, tier) => sum.plus(tier.lp_share), new Decimal(0));
      const totalGP = results.reduce((sum, tier) => sum.plus(tier.gp_share), new Decimal(0));
      
      const calc: WaterfallCalcType = {
        id: `calc-${Date.now()}`,
        distribution_id: distribution.id,
        waterfall_structure_id: inputs.waterfallStructureId,
        total_distributions: totalDistribution,
        total_contributions: totalContribs,
        current_nav: new Decimal(inputs.currentNAV || 0),
        irr: new Decimal(0), // Would be calculated separately
        multiple: totalContribs.gt(0) ? totalDistribution.plus(prevDistribs).dividedBy(totalContribs) : new Decimal(0),
        tier_results: results,
        lp_allocation: totalLP,
        gp_allocation: totalGP,
        carry_allocation: totalGP,
        calculated_at: new Date().toISOString()
      };
      
      setCalculation(calc);
    } catch (error) {
      console.error('Calculation error:', error);
      setValidationErrors(['Calculation failed. Please check your inputs.']);
    }
  };

  const handleSave = () => {
    if (calculation) {
      onSave(calculation);
    }
  };

  const getTierDescription = (tier: WaterfallTierResult): string => {
    switch (tier.tier_number) {
      case 1:
        return 'Return of Capital to LPs';
      case 2:
        return 'Preferred Return to LPs';
      case 3:
        return 'GP Catch-up';
      case 4:
        return 'Remaining Split';
      default:
        return tier.tier_description;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Waterfall Calculation
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Distribution #{distribution.distribution_number} - {formatCurrency(distribution.total_distribution)}
      </Typography>

      <Grid container spacing={3}>
        {/* Input Parameters */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Calculation Inputs
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  label="Waterfall Structure"
                  value={inputs.waterfallStructureId}
                  onChange={(e) => setInputs({
                    ...inputs,
                    waterfallStructureId: e.target.value
                  })}
                >
                  {waterfallStructures.map((structure) => (
                    <MenuItem key={structure.id} value={structure.id}>
                      {structure.name} ({structure.type})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Total Contributions"
                  value={inputs.totalContributions}
                  onChange={(e) => setInputs({
                    ...inputs,
                    totalContributions: e.target.value
                  })}
                  InputProps={{ startAdornment: '$' }}
                  placeholder="0.00"
                />
              </Grid>
              
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Previous Distributions"
                  value={inputs.previousDistributions}
                  onChange={(e) => setInputs({
                    ...inputs,
                    previousDistributions: e.target.value
                  })}
                  InputProps={{ startAdornment: '$' }}
                  placeholder="0.00"
                />
              </Grid>
              
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Current NAV"
                  value={inputs.currentNAV}
                  onChange={(e) => setInputs({
                    ...inputs,
                    currentNAV: e.target.value
                  })}
                  InputProps={{ startAdornment: '$' }}
                  placeholder="0.00"
                />
              </Grid>
            </Grid>
            
            {/* Waterfall Parameters */}
            {selectedStructure && (selectedStructure.type === 'american' || selectedStructure.type === 'hybrid') && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Waterfall Parameters</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={4}>
                      <TextField
                        fullWidth
                        label="Preferred Return (%)"
                        value={inputs.customParameters?.preferredReturn}
                        onChange={(e) => setInputs({
                          ...inputs,
                          customParameters: {
                            ...inputs.customParameters!,
                            preferredReturn: e.target.value
                          }
                        })}
                        size="small"
                      />
                    </Grid>
                    <Grid size={4}>
                      <TextField
                        fullWidth
                        label="Carry (%)"
                        value={inputs.customParameters?.carryPercentage}
                        onChange={(e) => setInputs({
                          ...inputs,
                          customParameters: {
                            ...inputs.customParameters!,
                            carryPercentage: e.target.value
                          }
                        })}
                        size="small"
                      />
                    </Grid>
                    <Grid size={4}>
                      <TextField
                        fullWidth
                        label="Catch-up (%)"
                        value={inputs.customParameters?.catchUpPercentage}
                        onChange={(e) => setInputs({
                          ...inputs,
                          customParameters: {
                            ...inputs.customParameters!,
                            catchUpPercentage: e.target.value
                          }
                        })}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            
            {/* Actions */}
            <Box mt={3} display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={loading}
              >
                Calculate
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setTierResults([]);
                  setCalculation(null);
                  setValidationErrors([]);
                }}
              >
                Reset
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, md: 6 }}>
          {calculation && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calculation Results
              </Typography>
              
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center">
                        <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            LP Share
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(calculation.lp_allocation)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center">
                        <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            GP Share
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(calculation.gp_allocation)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center">
                        <PieChartIcon color="info" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Multiple
                          </Typography>
                          <Typography variant="h6">
                            {calculation.multiple.toFixed(2)}x
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Tier Breakdown */}
              <Typography variant="subtitle1" gutterBottom>
                Waterfall Tiers
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tier</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">LP Share</TableCell>
                      <TableCell align="right">GP Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tierResults.map((tier) => (
                      <TableRow key={tier.tier_id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {tier.tier_number}. {getTierDescription(tier)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(tier.amount_allocated)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="primary">
                            {formatCurrency(tier.lp_share)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(tier.gp_share)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Actions */}
              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Calculation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={() => setPreviewDialog(true)}
                >
                  Preview Report
                </Button>
              </Box>
            </Paper>
          )}
          
          {!calculation && (
            <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <CalculateIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Run Calculation
              </Typography>
              <Typography variant="body2">
                Configure the inputs and click Calculate to see waterfall results
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Actions */}
      <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!calculation}
        >
          Save & Close
        </Button>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Waterfall Calculation Report</DialogTitle>
        <DialogContent>
          {calculation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Distribution #{distribution.distribution_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Calculated on {format(new Date(calculation.calculated_at), 'MMMM dd, yyyy HH:mm')}
              </Typography>
              
              {/* Would include detailed report content here */}
              <Alert severity="info">
                Full report preview would be implemented here with charts and detailed breakdowns.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          <Button variant="contained">Export PDF</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaterfallCalculation;
