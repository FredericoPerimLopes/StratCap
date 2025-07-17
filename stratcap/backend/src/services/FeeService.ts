import ManagementFeeService from './ManagementFeeService';
import CarriedInterestFeeService from './CarriedInterestFeeService';
import FeeOffsetService from './FeeOffsetService';

/**
 * Unified Fee Service
 * 
 * This service provides a centralized interface for all fee-related operations
 * and coordinates between different fee calculation services.
 */
class FeeService {
  private managementFeeService: ManagementFeeService;
  private carriedInterestService: CarriedInterestFeeService;
  private offsetService: FeeOffsetService;

  constructor() {
    this.managementFeeService = new ManagementFeeService();
    this.carriedInterestService = new CarriedInterestFeeService();
    this.offsetService = new FeeOffsetService();
  }

  /**
   * Get management fee service
   */
  getManagementFeeService(): ManagementFeeService {
    return this.managementFeeService;
  }

  /**
   * Get carried interest service
   */
  getCarriedInterestService(): CarriedInterestFeeService {
    return this.carriedInterestService;
  }

  /**
   * Get fee offset service
   */
  getFeeOffsetService(): FeeOffsetService {
    return this.offsetService;
  }

  /**
   * Create a new fee entry
   */
  async createFee(feeData: {
    entityType: string;
    entityId: string;
    feeType: string;
    amount: string;
    description?: string;
    dueDate?: Date;
    status?: string;
    calculationBasis?: {
      rate?: string;
      principal?: string;
      period?: string;
      [key: string]: any;
    };
    metadata?: Record<string, any>;
  }, transaction?: any): Promise<void> {
    // This would typically create a fee entry in the database
    // For now, we'll log the fee creation
    console.log('Creating fee entry:', {
      entityType: feeData.entityType,
      entityId: feeData.entityId,
      feeType: feeData.feeType,
      amount: feeData.amount,
      description: feeData.description,
      dueDate: feeData.dueDate,
      status: feeData.status || 'pending',
      calculationBasis: feeData.calculationBasis,
      metadata: feeData.metadata,
      transaction: transaction ? 'provided' : 'none',
    });

    // In a real implementation, this would:
    // 1. Validate the fee data
    // 2. Create a fee record in the database (using the transaction if provided)
    // 3. Potentially trigger accounting entries
    // 4. Send notifications if required
  }

  /**
   * Health check for all fee services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    try {
      // Basic checks for each service
      const managementHealthy = !!this.managementFeeService;
      const carriedInterestHealthy = !!this.carriedInterestService;
      const offsetHealthy = !!this.offsetService;

      const allHealthy = managementHealthy && carriedInterestHealthy && offsetHealthy;

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        services: {
          managementFee: managementHealthy,
          carriedInterest: carriedInterestHealthy,
          feeOffset: offsetHealthy,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          managementFee: false,
          carriedInterest: false,
          feeOffset: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default FeeService;