import { Decimal } from 'decimal.js';
import { Op } from 'sequelize';
import FeeOffset from '../models/FeeOffset';
import FeeCalculation from '../models/FeeCalculation';
import Fund from '../models/Fund';
import Transaction from '../models/Transaction';

interface CreateOffsetParams {
  feeCalculationId: number;
  offsetType: 'transaction_fee' | 'monitoring_fee' | 'consulting_fee' | 'expense_reimbursement' | 'other';
  offsetAmount: string;
  description: string;
  sourceReference?: string;
  offsetDate?: Date;
  metadata?: Record<string, any>;
}

interface OffsetCalculationResult {
  totalOffsets: Decimal;
  appliedOffsets: FeeOffset[];
  remainingFeeAmount: Decimal;
}

class FeeOffsetService {
  /**
   * Create a new fee offset
   */
  async createOffset(params: CreateOffsetParams): Promise<FeeOffset> {
    const {
      feeCalculationId,
      offsetType,
      offsetAmount,
      description,
      sourceReference,
      offsetDate = new Date(),
      metadata = {},
    } = params;

    // Validate fee calculation exists
    const feeCalculation = await FeeCalculation.findByPk(feeCalculationId);
    if (!feeCalculation) {
      throw new Error('Fee calculation not found');
    }

    // Validate offset amount doesn't exceed gross fee amount
    const offsetDecimal = new Decimal(offsetAmount);
    const grossFeeAmount = feeCalculation.grossFeeAmountDecimal;
    
    if (offsetDecimal.greaterThan(grossFeeAmount)) {
      throw new Error('Offset amount cannot exceed gross fee amount');
    }

    // Create the offset record
    const offset = await FeeOffset.create({
      feeCalculationId,
      offsetType,
      offsetAmount,
      offsetDate,
      description,
      sourceReference,
      isApproved: false, // Requires approval
      metadata,
    });

    return offset;
  }

  /**
   * Create transaction fee offset automatically
   */
  async createTransactionFeeOffset(
    feeCalculationId: number,
    transactionId: number,
    transactionFeeAmount: string
  ): Promise<FeeOffset> {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return await this.createOffset({
      feeCalculationId,
      offsetType: 'transaction_fee',
      offsetAmount: transactionFeeAmount,
      description: `Transaction fee offset for ${transaction.description || 'transaction'}`,
      sourceReference: `transaction_${transactionId}`,
      offsetDate: transaction.transactionDate,
      metadata: {
        transactionId,
        transactionType: transaction.type,
        automaticallyCreated: true,
      },
    });
  }

  /**
   * Create monitoring fee offset
   */
  async createMonitoringFeeOffset(
    feeCalculationId: number,
    portfolioCompany: string,
    monitoringFeeAmount: string,
    period: string
  ): Promise<FeeOffset> {
    return await this.createOffset({
      feeCalculationId,
      offsetType: 'monitoring_fee',
      offsetAmount: monitoringFeeAmount,
      description: `Monitoring fee offset from ${portfolioCompany} for ${period}`,
      sourceReference: `monitoring_${portfolioCompany}_${period}`,
      metadata: {
        portfolioCompany,
        period,
        offsetCategory: 'portfolio_services',
      },
    });
  }

  /**
   * Apply offsets to fee calculation
   */
  async applyOffsetsToCalculation(feeCalculationId: number): Promise<OffsetCalculationResult> {
    const feeCalculation = await FeeCalculation.findByPk(feeCalculationId);
    if (!feeCalculation) {
      throw new Error('Fee calculation not found');
    }

    // Get all approved offsets for this calculation
    const appliedOffsets = await FeeOffset.findAll({
      where: {
        feeCalculationId,
        isApproved: true,
      },
      order: [['offset_date', 'ASC']],
    });

    // Calculate total offset amount
    const totalOffsets = appliedOffsets.reduce(
      (sum, offset) => sum.plus(offset.offsetAmountDecimal),
      new Decimal(0)
    );

    // Calculate remaining fee amount after offsets
    const grossFeeAmount = feeCalculation.grossFeeAmountDecimal;
    const remainingFeeAmount = grossFeeAmount.minus(totalOffsets);

    // Update the fee calculation with net amount
    const netAmount = remainingFeeAmount.isPositive() ? remainingFeeAmount : new Decimal(0);
    await feeCalculation.update({
      netFeeAmount: netAmount.toString(),
      metadata: {
        ...feeCalculation.metadata,
        totalOffsets: totalOffsets.toString(),
        offsetsApplied: appliedOffsets.length,
        lastOffsetApplication: new Date().toISOString(),
      },
    });

    return {
      totalOffsets,
      appliedOffsets,
      remainingFeeAmount: netAmount,
    };
  }

  /**
   * Approve fee offset
   */
  async approveOffset(offsetId: number, approvedBy: number): Promise<FeeOffset> {
    const offset = await FeeOffset.findByPk(offsetId);
    if (!offset) {
      throw new Error('Fee offset not found');
    }

    if (offset.isApproved) {
      throw new Error('Fee offset is already approved');
    }

    offset.approve(approvedBy);
    await offset.save();

    // Reapply offsets to the calculation
    await this.applyOffsetsToCalculation(offset.feeCalculationId);

    return offset;
  }

  /**
   * Reject fee offset
   */
  async rejectOffset(offsetId: number, reason: string): Promise<FeeOffset> {
    const offset = await FeeOffset.findByPk(offsetId);
    if (!offset) {
      throw new Error('Fee offset not found');
    }

    offset.reject();
    await offset.update({
      metadata: {
        ...offset.metadata,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      },
    });

    return offset;
  }

  /**
   * Get pending offsets for approval
   */
  async getPendingOffsets(fundId?: number): Promise<FeeOffset[]> {
    const whereClause: any = {
      isApproved: false,
    };

    if (fundId) {
      const feeCalculationIds = await FeeCalculation.findAll({
        where: { fundId },
        attributes: ['id'],
      }).then(calculations => calculations.map(calc => calc.id));

      whereClause.feeCalculationId = {
        [Op.in]: feeCalculationIds,
      };
    }

    return await FeeOffset.findAll({
      where: whereClause,
      include: [
        {
          model: FeeCalculation,
          as: 'feeCalculation',
          include: [
            {
              model: Fund,
              as: 'fund',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
      order: [['offset_date', 'DESC']],
    });
  }

  /**
   * Get offset summary for a fund
   */
  async getOffsetSummary(fundId: number, year?: number): Promise<{
    totalOffsets: Decimal;
    offsetsByType: Record<string, Decimal>;
    offsetsByMonth: Record<string, Decimal>;
    offsetCount: number;
  }> {
    const whereClause: any = {
      isApproved: true,
    };

    // Filter by year if provided
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      whereClause.offsetDate = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    // Get fee calculation IDs for the fund
    const feeCalculationIds = await FeeCalculation.findAll({
      where: { fundId },
      attributes: ['id'],
    }).then(calculations => calculations.map(calc => calc.id));

    whereClause.feeCalculationId = {
      [Op.in]: feeCalculationIds,
    };

    const offsets = await FeeOffset.findAll({
      where: whereClause,
      order: [['offset_date', 'ASC']],
    });

    let totalOffsets = new Decimal(0);
    const offsetsByType: Record<string, Decimal> = {};
    const offsetsByMonth: Record<string, Decimal> = {};

    for (const offset of offsets) {
      const amount = offset.offsetAmountDecimal;
      totalOffsets = totalOffsets.plus(amount);

      // Group by type
      if (!offsetsByType[offset.offsetType]) {
        offsetsByType[offset.offsetType] = new Decimal(0);
      }
      offsetsByType[offset.offsetType] = offsetsByType[offset.offsetType].plus(amount);

      // Group by month
      const monthKey = offset.offsetDate.toISOString().substring(0, 7); // YYYY-MM
      if (!offsetsByMonth[monthKey]) {
        offsetsByMonth[monthKey] = new Decimal(0);
      }
      offsetsByMonth[monthKey] = offsetsByMonth[monthKey].plus(amount);
    }

    return {
      totalOffsets,
      offsetsByType,
      offsetsByMonth,
      offsetCount: offsets.length,
    };
  }

  /**
   * Bulk approve offsets
   */
  async bulkApproveOffsets(offsetIds: number[], approvedBy: number): Promise<FeeOffset[]> {
    const offsets = await FeeOffset.findAll({
      where: {
        id: { [Op.in]: offsetIds },
        isApproved: false,
      },
    });

    const approvedOffsets: FeeOffset[] = [];
    const affectedCalculationIds = new Set<number>();

    for (const offset of offsets) {
      offset.approve(approvedBy);
      await offset.save();
      approvedOffsets.push(offset);
      affectedCalculationIds.add(offset.feeCalculationId);
    }

    // Reapply offsets to all affected calculations
    for (const calculationId of affectedCalculationIds) {
      await this.applyOffsetsToCalculation(calculationId);
    }

    return approvedOffsets;
  }

  /**
   * Delete offset (only if not approved)
   */
  async deleteOffset(offsetId: number): Promise<void> {
    const offset = await FeeOffset.findByPk(offsetId);
    if (!offset) {
      throw new Error('Fee offset not found');
    }

    if (offset.isApproved) {
      throw new Error('Cannot delete approved offset');
    }

    await offset.destroy();
  }

  /**
   * Update offset amount (only if not approved)
   */
  async updateOffset(
    offsetId: number,
    updates: Partial<CreateOffsetParams>
  ): Promise<FeeOffset> {
    const offset = await FeeOffset.findByPk(offsetId);
    if (!offset) {
      throw new Error('Fee offset not found');
    }

    if (offset.isApproved) {
      throw new Error('Cannot update approved offset');
    }

    // Validate new offset amount if provided
    if (updates.offsetAmount) {
      const feeCalculation = await FeeCalculation.findByPk(offset.feeCalculationId);
      const newOffsetAmount = new Decimal(updates.offsetAmount);
      
      if (newOffsetAmount.greaterThan(feeCalculation!.grossFeeAmountDecimal)) {
        throw new Error('Offset amount cannot exceed gross fee amount');
      }
    }

    await offset.update(updates);
    return offset;
  }
}

export default FeeOffsetService;