import { Request, Response } from 'express';
import InvestorTransferService from '../services/InvestorTransferService';

class InvestorTransferController {
  private investorTransferService: InvestorTransferService;

  constructor() {
    this.investorTransferService = new InvestorTransferService();
  }

  /**
   * Initialize a new investor transfer workflow
   */
  initializeTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { commitmentId, transferorId } = req.params;
      const userId = (req as any).user?.id;
      const initialData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const transfer = await this.investorTransferService.initializeTransfer(
        parseInt(commitmentId),
        parseInt(transferorId),
        userId,
        initialData
      );

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Investor transfer workflow initialized successfully',
      });
    } catch (error) {
      console.error('Error initializing transfer:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize transfer',
      });
    }
  };

  /**
   * Update transfer step
   */
  updateTransferStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId, stepNumber } = req.params;
      const userId = (req as any).user?.id;
      const stepData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const transfer = await this.investorTransferService.updateTransferStep(
        parseInt(transferId),
        parseInt(stepNumber),
        stepData,
        userId
      );

      res.json({
        success: true,
        data: transfer,
        message: `Transfer step ${stepNumber} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating transfer step:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transfer step',
      });
    }
  };

  /**
   * Get transfer summary
   */
  getTransferSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId } = req.params;

      const summary = await this.investorTransferService.getTransferSummary(parseInt(transferId));

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Error getting transfer summary:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transfer summary',
      });
    }
  };

  /**
   * Submit transfer for review
   */
  submitTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const transfer = await this.investorTransferService.submitTransfer(
        parseInt(transferId),
        userId
      );

      res.json({
        success: true,
        data: transfer,
        message: 'Transfer submitted for review successfully',
      });
    } catch (error) {
      console.error('Error submitting transfer:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit transfer',
      });
    }
  };

  /**
   * Cancel transfer
   */
  cancelTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Cancellation reason is required',
        });
        return;
      }

      const transfer = await this.investorTransferService.cancelTransfer(
        parseInt(transferId),
        userId,
        reason
      );

      res.json({
        success: true,
        data: transfer,
        message: 'Transfer cancelled successfully',
      });
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel transfer',
      });
    }
  };

  /**
   * Validate transfer for completion
   */
  validateTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId } = req.params;

      const validation = await this.investorTransferService.validateTransferCompletion(parseInt(transferId));

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      console.error('Error validating transfer:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate transfer',
      });
    }
  };

  /**
   * Get transfers for fund
   */
  getTransfersForFund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { 
        status, 
        transferType, 
        transferorId, 
        transfereeId, 
        dateFrom, 
        dateTo,
        page = '1',
        limit = '20'
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (transferType) filters.transferType = transferType as string;
      if (transferorId) filters.transferorId = parseInt(transferorId as string);
      if (transfereeId) filters.transfereeId = parseInt(transfereeId as string);
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const transfers = await this.investorTransferService.getTransfersForFund(
        parseInt(fundId),
        filters
      );

      // Apply pagination
      const pageNum = parseInt(page as string);
      const pageSize = parseInt(limit as string);
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedTransfers = transfers.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          transfers: paginatedTransfers,
          pagination: {
            page: pageNum,
            limit: pageSize,
            total: transfers.length,
            totalPages: Math.ceil(transfers.length / pageSize),
          },
        },
      });
    } catch (error) {
      console.error('Error getting transfers for fund:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transfers',
      });
    }
  };

  /**
   * Get transfers by investor
   */
  getTransfersByInvestor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investorId } = req.params;
      const { status, transferType, dateFrom, dateTo } = req.query;

      const filters: any = {
        transferorId: parseInt(investorId),
      };
      
      if (status) filters.status = status as string;
      if (transferType) filters.transferType = transferType as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      // Get transfers where investor is transferor or transferee
      const transferorTransfers = await this.investorTransferService.getTransfersForFund(
        0, // Will be filtered by investor
        { ...filters, transferorId: parseInt(investorId) }
      );

      const transfereeTransfers = await this.investorTransferService.getTransfersForFund(
        0, // Will be filtered by investor
        { ...filters, transfereeId: parseInt(investorId) }
      );

      // Combine and deduplicate
      const allTransfers = [...transferorTransfers, ...transfereeTransfers];
      const uniqueTransfers = allTransfers.filter((transfer, index, self) =>
        index === self.findIndex(t => t.id === transfer.id)
      );

      // Sort by date
      uniqueTransfers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({
        success: true,
        data: uniqueTransfers,
      });
    } catch (error) {
      console.error('Error getting transfers by investor:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transfers by investor',
      });
    }
  };

  /**
   * Get transfer statistics
   */
  getTransferStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fundId } = req.params;
      const { dateFrom, dateTo } = req.query;

      const filters: any = {};
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const transfers = await this.investorTransferService.getTransfersForFund(
        parseInt(fundId),
        filters
      );

      // Calculate statistics
      const stats = {
        total: transfers.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        totalTransferValue: 0,
        averageTransferValue: 0,
        completedTransfers: 0,
        pendingTransfers: 0,
        rejectedTransfers: 0,
        averageCompletionTime: 0, // in days
      };

      let totalValue = 0;
      const completionTimes: number[] = [];

      transfers.forEach(transfer => {
        // Count by status
        stats.byStatus[transfer.status] = (stats.byStatus[transfer.status] || 0) + 1;
        
        // Count by type
        stats.byType[transfer.transferType] = (stats.byType[transfer.transferType] || 0) + 1;

        // Calculate values for completed transfers
        if (transfer.status === 'completed' && transfer.totalConsideration) {
          totalValue += parseFloat(transfer.totalConsideration);
          stats.completedTransfers++;

          // Calculate completion time
          if (transfer.completedAt && transfer.createdAt) {
            const completionTime = Math.ceil(
              (new Date(transfer.completedAt).getTime() - new Date(transfer.createdAt).getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            completionTimes.push(completionTime);
          }
        }

        if (transfer.status === 'rejected') {
          stats.rejectedTransfers++;
        }

        if (['draft', 'submitted', 'under_review', 'approved'].includes(transfer.status)) {
          stats.pendingTransfers++;
        }
      });

      stats.totalTransferValue = totalValue;
      stats.averageTransferValue = stats.completedTransfers > 0 ? 
        totalValue / stats.completedTransfers : 0;
      
      stats.averageCompletionTime = completionTimes.length > 0 ?
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting transfer statistics:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transfer statistics',
      });
    }
  };

  /**
   * Get transfer by ID
   */
  getTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferId } = req.params;

      const summary = await this.investorTransferService.getTransferSummary(parseInt(transferId));

      res.json({
        success: true,
        data: summary.transfer,
      });
    } catch (error) {
      console.error('Error getting transfer:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Transfer not found',
      });
    }
  };

  /**
   * Get pending approvals for user
   */
  getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { fundId } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get all pending transfers that require approval
      const filters: any = {
        status: 'under_review',
      };

      if (fundId) {
        filters.fundId = parseInt(fundId as string);
      }

      // This would typically check user roles and permissions
      // For now, return all pending transfers
      const pendingTransfers = await this.investorTransferService.getTransfersForFund(
        fundId ? parseInt(fundId as string) : 0,
        { status: 'under_review' }
      );

      res.json({
        success: true,
        data: pendingTransfers,
      });
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pending approvals',
      });
    }
  };

  /**
   * Bulk approve transfers
   */
  bulkApproveTransfers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transferIds, comments } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!Array.isArray(transferIds) || transferIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Transfer IDs array is required',
        });
        return;
      }

      const results = [];

      for (const transferId of transferIds) {
        try {
          const transfer = await this.investorTransferService.updateTransferStep(
            parseInt(transferId),
            4, // Review & Approval step
            {
              internalApproval: true,
              gpConsent: true,
              reviewNotes: comments,
            },
            userId
          );
          
          results.push({
            transferId: parseInt(transferId),
            success: true,
            data: transfer,
          });
        } catch (error) {
          results.push({
            transferId: parseInt(transferId),
            success: false,
            error: error instanceof Error ? error.message : 'Failed to approve transfer',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        message: `Bulk approval completed: ${successCount} approved, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: transferIds.length,
            approved: successCount,
            failed: failureCount,
          },
        },
      });
    } catch (error) {
      console.error('Error in bulk approve transfers:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk approve transfers',
      });
    }
  };
}

export default InvestorTransferController;