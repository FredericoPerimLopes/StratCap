import { useState, useCallback, useEffect } from 'react';
import { Decimal } from 'decimal.js';
import {
  CapitalCall,
  Distribution,
  WaterfallCalculation,
  Equalization,
  CapitalCallCreationRequest,
  CalculationRequest,
  CalculationResult,
  Investor
} from '../../types/capital-activity';
import {
  calculateProportionalAllocation,
  calculateAmericanWaterfall,
  calculateEuropeanWaterfall,
  validateCalculationInputs
} from '../../utils/financial/calculations';

interface UseCapitalActivityReturn {
  // Data
  capitalCalls: CapitalCall[];
  distributions: Distribution[];
  waterfallCalculations: WaterfallCalculation[];
  equalizations: Equalization[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCapitalCalls: (fundId: string) => Promise<void>;
  createCapitalCall: (request: CapitalCallCreationRequest) => Promise<CapitalCall>;
  updateCapitalCall: (id: string, updates: Partial<CapitalCall>) => Promise<CapitalCall>;
  approveCapitalCall: (id: string) => Promise<void>;
  
  fetchDistributions: (fundId: string) => Promise<void>;
  createDistribution: (distribution: Partial<Distribution>) => Promise<Distribution>;
  calculateWaterfall: (distributionId: string, waterfallStructureId: string) => Promise<WaterfallCalculation>;
  
  createEqualization: (equalization: Partial<Equalization>) => Promise<Equalization>;
  
  // Calculations
  calculateAllocation: (investors: Investor[], totalAmount: Decimal, method: 'proportional' | 'equal') => any[];
  validateCalculation: (data: Record<string, any>) => { isValid: boolean; errors: string[] };
}

export const useCapitalActivity = (): UseCapitalActivityReturn => {
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [waterfallCalculations, setWaterfallCalculations] = useState<WaterfallCalculation[]>([]);
  const [equalizations, setEqualizations] = useState<Equalization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capital Calls
  const fetchCapitalCalls = useCallback(async (fundId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/capital-activity/calls?fund_id=${fundId}`);
      if (!response.ok) throw new Error('Failed to fetch capital calls');
      const data = await response.json();
      setCapitalCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCapitalCall = useCallback(async (request: CapitalCallCreationRequest): Promise<CapitalCall> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/capital-activity/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          total_call_amount: request.total_call_amount.toString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to create capital call');
      const capitalCall = await response.json();
      setCapitalCalls(prev => [...prev, capitalCall]);
      return capitalCall;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create capital call');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCapitalCall = useCallback(async (id: string, updates: Partial<CapitalCall>): Promise<CapitalCall> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/capital-activity/calls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update capital call');
      const updatedCall = await response.json();
      setCapitalCalls(prev => prev.map(call => call.id === id ? updatedCall : call));
      return updatedCall;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update capital call');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveCapitalCall = useCallback(async (id: string) => {
    await updateCapitalCall(id, { status: 'approved', approved_at: new Date().toISOString() });
  }, [updateCapitalCall]);

  // Distributions
  const fetchDistributions = useCallback(async (fundId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/capital-activity/distributions?fund_id=${fundId}`);
      if (!response.ok) throw new Error('Failed to fetch distributions');
      const data = await response.json();
      setDistributions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDistribution = useCallback(async (distribution: Partial<Distribution>): Promise<Distribution> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/capital-activity/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(distribution)
      });
      
      if (!response.ok) throw new Error('Failed to create distribution');
      const newDistribution = await response.json();
      setDistributions(prev => [...prev, newDistribution]);
      return newDistribution;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create distribution');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateWaterfall = useCallback(async (
    distributionId: string,
    waterfallStructureId: string
  ): Promise<WaterfallCalculation> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/capital-activity/waterfall/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distribution_id: distributionId,
          waterfall_structure_id: waterfallStructureId
        })
      });
      
      if (!response.ok) throw new Error('Failed to calculate waterfall');
      const calculation = await response.json();
      setWaterfallCalculations(prev => [...prev, calculation]);
      return calculation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate waterfall');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Equalizations
  const createEqualization = useCallback(async (equalization: Partial<Equalization>): Promise<Equalization> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/capital-activity/equalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equalization)
      });
      
      if (!response.ok) throw new Error('Failed to create equalization');
      const newEqualization = await response.json();
      setEqualizations(prev => [...prev, newEqualization]);
      return newEqualization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create equalization');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculation utilities
  const calculateAllocation = useCallback((
    investors: Investor[],
    totalAmount: Decimal,
    method: 'proportional' | 'equal'
  ) => {
    if (method === 'proportional') {
      return calculateProportionalAllocation(investors, totalAmount);
    } else {
      const equalAmount = totalAmount.dividedBy(investors.length);
      return investors.map(investor => ({
        investorId: investor.id,
        amount: equalAmount,
        percentage: new Decimal(100).dividedBy(investors.length)
      }));
    }
  }, []);

  const validateCalculation = useCallback((data: Record<string, any>) => {
    return validateCalculationInputs(data);
  }, []);

  return {
    // Data
    capitalCalls,
    distributions,
    waterfallCalculations,
    equalizations,
    loading,
    error,
    
    // Actions
    fetchCapitalCalls,
    createCapitalCall,
    updateCapitalCall,
    approveCapitalCall,
    
    fetchDistributions,
    createDistribution,
    calculateWaterfall,
    
    createEqualization,
    
    // Calculations
    calculateAllocation,
    validateCalculation
  };
};

// Specialized hook for wizard state management
export const useWizardState = <T extends Record<string, any>>(initialData: T) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
    setIsValid(false);
    setIsSubmitting(false);
  }, [initialData]);

  return {
    currentStep,
    data,
    isValid,
    isSubmitting,
    setIsValid,
    setIsSubmitting,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    reset
  };
};
