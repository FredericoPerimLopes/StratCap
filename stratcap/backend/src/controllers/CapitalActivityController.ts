import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import CapitalActivity from '../models/CapitalActivity';
import CapitalAllocation from '../models/CapitalAllocation';
import DistributionAllocation from '../models/DistributionAllocation';
import Fund from '../models/Fund';
import InvestorEntity from '../models/InvestorEntity';
import InvestorClass from '../models/InvestorClass';
import Commitment from '../models/Commitment';
import CapitalCallService from '../services/CapitalCallService';
import DistributionService from '../services/DistributionService';
import AllocationService from '../services/AllocationService';
import NotificationService from '../services/NotificationService';

class CapitalActivityController {
  private capitalCallService: CapitalCallService;
  private distributionService: DistributionService;
  private allocationService: AllocationService;
  private notificationService: NotificationService;

  constructor() {
    this.capitalCallService = new CapitalCallService();
    this.distributionService = new DistributionService();
    this.allocationService = new AllocationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Get all capital activities for a fund
   */
  async getCapitalActivities(req: Request, res: Response) {
    try {
      const { fundId } = req.params;
      const { eventType, status, page = 1, limit = 20 } = req.query;

      const whereClause: any = { fundId: parseInt(fundId) };
      
      if (eventType) {
        whereClause.eventType = eventType;
      }
      
      if (status) {
        whereClause.status = status;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { rows: activities, count } = await CapitalActivity.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Fund,
            as: 'fund',
          },
        ],
        order: [['eventDate', 'DESC']],
        limit: parseInt(limit as string),
        offset,
      });

      res.json({
        activities,
        pagination: {
          total: count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(count / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error('Error fetching capital activities:', error);
      res.status(500).json({ error: 'Failed to fetch capital activities' });
    }
  }

  /**
   * Get specific capital activity with allocations
   */
  async getCapitalActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const activity = await CapitalActivity.findByPk(parseInt(id), {
        include: [
          {
            model: Fund,
            as: 'fund',
          },
        ],
      });

      if (!activity) {
        return res.status(404).json({ error: 'Capital activity not found' });
      }

      // Get allocations based on activity type
      let allocations;
      if (activity.eventType === 'capital_call') {
        allocations = await CapitalAllocation.findAll({
          where: { capitalActivityId: activity.id },
          include: [
            {
              model: InvestorEntity,
              as: 'investorEntity',
            },
            {
              model: InvestorClass,
              as: 'investorClass',
            },
            {
              model: Commitment,
              as: 'commitment',
            },
          ],
        });
      } else if (activity.eventType === 'distribution') {
        allocations = await DistributionAllocation.findAll({
          where: { capitalActivityId: activity.id },
          include: [
            {
              model: InvestorEntity,
              as: 'investorEntity',
            },
            {
              model: InvestorClass,
              as: 'investorClass',
            },
            {
              model: Commitment,
              as: 'commitment',
            },
          ],
        });
      }

      return res.json({
        activity,
        allocations: allocations || [],
      });
    } catch (error) {
      console.error('Error fetching capital activity:', error);
      return res.status(500).json({ error: 'Failed to fetch capital activity' });
    }
  }

  /**
   * Create a new capital call
   */
  async createCapitalCall(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const capitalCallRequest = {
        ...req.body,
        createdBy: userId,
      };

      const result = await this.capitalCallService.createCapitalCall(capitalCallRequest);

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating capital call:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create capital call' 
      });
    }
  }

  /**
   * Create a new distribution
   */
  async createDistribution(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const distributionRequest = {
        ...req.body,
        createdBy: userId,
      };

      const result = await this.distributionService.createDistribution(distributionRequest);

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating distribution:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create distribution' 
      });
    }
  }

  /**
   * Approve a capital activity
   */
  async approveCapitalActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const activity = await CapitalActivity.findByPk(parseInt(id));
      if (!activity) {
        return res.status(404).json({ error: 'Capital activity not found' });
      }

      if (activity.eventType === 'capital_call') {
        await this.capitalCallService.approveCapitalCall(activity.id, userId);
      } else if (activity.eventType === 'distribution') {
        await this.distributionService.approveDistribution(activity.id, userId);
      } else {
        return res.status(400).json({ error: 'Invalid activity type for approval' });
      }

      return res.json({ message: 'Capital activity approved successfully' });
    } catch (error) {
      console.error('Error approving capital activity:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to approve capital activity' 
      });
    }
  }

  /**
   * Update capital allocation payment
   */
  async updateCapitalAllocationPayment(req: Request, res: Response) {
    try {
      const { allocationId } = req.params;
      const { paidAmount, paidDate, notes } = req.body;

      await this.allocationService.updateCapitalAllocationPayment(
        parseInt(allocationId),
        paidAmount,
        new Date(paidDate),
        notes
      );

      return res.json({ message: 'Capital allocation payment updated successfully' });
    } catch (error) {
      console.error('Error updating capital allocation payment:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update payment' 
      });
    }
  }

  /**
   * Update distribution allocation payment
   */
  async updateDistributionAllocationPayment(req: Request, res: Response) {
    try {
      const { allocationId } = req.params;
      const { paymentDate, notes } = req.body;

      await this.allocationService.updateDistributionAllocationPayment(
        parseInt(allocationId),
        new Date(paymentDate),
        notes
      );

      return res.json({ message: 'Distribution allocation payment updated successfully' });
    } catch (error) {
      console.error('Error updating distribution allocation payment:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update payment' 
      });
    }
  }

  /**
   * Get capital call summary
   */
  async getCapitalCallSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await this.capitalCallService.getCapitalCallSummary(parseInt(id));
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching capital call summary:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch summary' 
      });
    }
  }

  /**
   * Get distribution summary
   */
  async getDistributionSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await this.distributionService.getDistributionSummary(parseInt(id));
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching distribution summary:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch summary' 
      });
    }
  }

  /**
   * Get allocation history for an investor
   */
  async getInvestorAllocationHistory(req: Request, res: Response) {
    try {
      const { investorId } = req.params;
      const { fundId } = req.query;

      const history = await this.allocationService.getInvestorAllocationHistory(
        parseInt(investorId),
        fundId ? parseInt(fundId as string) : undefined
      );

      return res.json(history);
    } catch (error) {
      console.error('Error fetching investor allocation history:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch allocation history' 
      });
    }
  }

  /**
   * Get fund allocation metrics
   */
  async getFundAllocationMetrics(req: Request, res: Response) {
    try {
      const { fundId } = req.params;
      const metrics = await this.allocationService.getFundAllocationMetrics(parseInt(fundId));
      return res.json(metrics);
    } catch (error) {
      console.error('Error fetching fund allocation metrics:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch metrics' 
      });
    }
  }

  /**
   * Send capital call reminder
   */
  async sendCapitalCallReminder(req: Request, res: Response) {
    try {
      const { allocationId } = req.params;
      
      await this.notificationService.sendCapitalCallReminder(parseInt(allocationId));
      
      return res.json({ message: 'Reminder sent successfully' });
    } catch (error) {
      console.error('Error sending reminder:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to send reminder' 
      });
    }
  }

  /**
   * Get notification history for an allocation
   */
  async getNotificationHistory(req: Request, res: Response) {
    try {
      const { allocationId, type } = req.params;
      
      const history = await this.notificationService.getNotificationHistory(
        parseInt(allocationId),
        type as 'capital' | 'distribution'
      );
      
      return res.json(history);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notification history' 
      });
    }
  }

  /**
   * Validate allocation amounts
   */
  async validateAllocations(req: Request, res: Response) {
    try {
      const { allocations } = req.body;
      
      const validationResults = await this.allocationService.validateAllocations(allocations);
      
      return res.json(validationResults);
    } catch (error) {
      console.error('Error validating allocations:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to validate allocations' 
      });
    }
  }

  /**
   * Process distribution payments
   */
  async processDistributionPayments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { paymentDate } = req.body;

      await this.distributionService.processDistributionPayments(
        parseInt(id),
        new Date(paymentDate)
      );

      return res.json({ message: 'Distribution payments processed successfully' });
    } catch (error) {
      console.error('Error processing distribution payments:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to process payments' 
      });
    }
  }

  /**
   * Cancel a capital activity
   */
  async cancelCapitalActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const activity = await CapitalActivity.findByPk(parseInt(id));
      if (!activity) {
        return res.status(404).json({ error: 'Capital activity not found' });
      }

      if (activity.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed activity' });
      }

      await activity.update({
        status: 'cancelled',
        notes: reason || 'Activity cancelled',
      });

      // Update related allocations
      if (activity.eventType === 'capital_call') {
        await CapitalAllocation.update(
          { status: 'cancelled' as any },
          { where: { capitalActivityId: activity.id } }
        );
      } else if (activity.eventType === 'distribution') {
        await DistributionAllocation.update(
          { status: 'cancelled' },
          { where: { capitalActivityId: activity.id } }
        );
      }

      return res.json({ message: 'Capital activity cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling capital activity:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to cancel activity' 
      });
    }
  }

  /**
   * Update capital activity
   */
  async updateCapitalActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const activity = await CapitalActivity.findByPk(parseInt(id));
      if (!activity) {
        return res.status(404).json({ error: 'Capital activity not found' });
      }

      if (activity.status === 'completed') {
        return res.status(400).json({ error: 'Cannot update completed activity' });
      }

      await activity.update(updates);

      return res.json(activity);
    } catch (error) {
      console.error('Error updating capital activity:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update activity' 
      });
    }
  }
}

export default CapitalActivityController;