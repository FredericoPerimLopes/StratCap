import CapitalActivity from '../models/CapitalActivity';
import User from '../models/User';

export interface ApprovalRule {
  minAmount?: string;
  maxAmount?: string;
  eventType?: string[];
  requiredApprovers: number;
  approverRoles: string[];
  conditions?: Record<string, any>;
}

export interface ApprovalRequest {
  capitalActivityId: number;
  requestedBy: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalDecision {
  approvalId: number;
  capitalActivityId: number;
  approvedBy: number;
  decision: 'approved' | 'rejected';
  reason?: string;
  approvedAt: Date;
}

class ApprovalWorkflowService {
  private defaultApprovalRules: ApprovalRule[] = [
    {
      maxAmount: '1000000',
      eventType: ['capital_call', 'distribution'],
      requiredApprovers: 1,
      approverRoles: ['fund_manager', 'admin'],
    },
    {
      minAmount: '1000000',
      maxAmount: '10000000',
      eventType: ['capital_call', 'distribution'],
      requiredApprovers: 2,
      approverRoles: ['fund_manager', 'admin', 'gp'],
    },
    {
      minAmount: '10000000',
      eventType: ['capital_call', 'distribution'],
      requiredApprovers: 3,
      approverRoles: ['gp', 'admin'],
    },
  ];

  /**
   * Check if a capital activity requires approval
   */
  async requiresApproval(capitalActivityId: number): Promise<boolean> {
    const activity = await CapitalActivity.findByPk(capitalActivityId);
    if (!activity) {
      throw new Error('Capital activity not found');
    }

    // Always require approval for capital activities
    return true;
  }

  /**
   * Get applicable approval rules for a capital activity
   */
  async getApprovalRules(capitalActivityId: number): Promise<ApprovalRule[]> {
    const activity = await CapitalActivity.findByPk(capitalActivityId);
    if (!activity) {
      throw new Error('Capital activity not found');
    }

    const applicableRules = this.defaultApprovalRules.filter(rule => {
      // Check event type
      if (rule.eventType && !rule.eventType.includes(activity.eventType)) {
        return false;
      }

      // Check amount range
      const activityAmount = parseFloat(activity.totalAmount);
      
      if (rule.minAmount && activityAmount < parseFloat(rule.minAmount)) {
        return false;
      }
      
      if (rule.maxAmount && activityAmount > parseFloat(rule.maxAmount)) {
        return false;
      }

      return true;
    });

    return applicableRules.length > 0 ? applicableRules : [this.defaultApprovalRules[0]];
  }

  /**
   * Request approval for a capital activity
   */
  async requestApproval(request: ApprovalRequest): Promise<void> {
    const activity = await CapitalActivity.findByPk(request.capitalActivityId);
    if (!activity) {
      throw new Error('Capital activity not found');
    }

    if (activity.status !== 'draft') {
      throw new Error('Only draft activities can be submitted for approval');
    }

    // Update activity status to pending approval
    await activity.update({
      status: 'pending',
      metadata: {
        ...activity.metadata,
        approvalRequest: {
          requestedBy: request.requestedBy,
          requestedAt: new Date().toISOString(),
          reason: request.reason,
          ...request.metadata,
        },
      },
    });
  }

  /**
   * Check if user can approve a capital activity
   */
  async canUserApprove(capitalActivityId: number, userId: number): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      return false;
    }

    const rules = await this.getApprovalRules(capitalActivityId);
    const userRole = (user as any).role; // Assuming role field exists

    // Check if user's role is in any applicable rule
    return rules.some(rule => rule.approverRoles.includes(userRole));
  }

  /**
   * Approve a capital activity
   */
  async approveCapitalActivity(
    capitalActivityId: number,
    approvedBy: number,
    reason?: string
  ): Promise<void> {
    const activity = await CapitalActivity.findByPk(capitalActivityId);
    if (!activity) {
      throw new Error('Capital activity not found');
    }

    if (activity.status !== 'pending') {
      throw new Error('Capital activity is not pending approval');
    }

    // Check if user can approve
    const canApprove = await this.canUserApprove(capitalActivityId, approvedBy);
    if (!canApprove) {
      throw new Error('User is not authorized to approve this activity');
    }

    // Update activity status
    await activity.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      metadata: {
        ...activity.metadata,
        approval: {
          approvedBy,
          approvedAt: new Date().toISOString(),
          reason,
        },
      },
    });
  }

  /**
   * Reject a capital activity
   */
  async rejectCapitalActivity(
    capitalActivityId: number,
    rejectedBy: number,
    reason: string
  ): Promise<void> {
    const activity = await CapitalActivity.findByPk(capitalActivityId);
    if (!activity) {
      throw new Error('Capital activity not found');
    }

    if (activity.status !== 'pending') {
      throw new Error('Capital activity is not pending approval');
    }

    // Check if user can approve (same permissions for rejection)
    const canApprove = await this.canUserApprove(capitalActivityId, rejectedBy);
    if (!canApprove) {
      throw new Error('User is not authorized to reject this activity');
    }

    // Update activity status back to draft with rejection reason
    await activity.update({
      status: 'draft',
      metadata: {
        ...activity.metadata,
        rejection: {
          rejectedBy,
          rejectedAt: new Date().toISOString(),
          reason,
        },
      },
    });
  }

  /**
   * Get approval history for a capital activity
   */
  async getApprovalHistory(capitalActivityId: number) {
    const activity = await CapitalActivity.findByPk(capitalActivityId, {
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!activity) {
      throw new Error('Capital activity not found');
    }

    const history = [];
    const metadata = activity.metadata || {};

    // Add approval request
    if (metadata.approvalRequest) {
      const requestUser = await User.findByPk(metadata.approvalRequest.requestedBy);
      history.push({
        action: 'requested',
        timestamp: metadata.approvalRequest.requestedAt,
        user: requestUser ? {
          id: requestUser.id,
          name: (requestUser as any).name,
          email: (requestUser as any).email,
        } : null,
        reason: metadata.approvalRequest.reason,
      });
    }

    // Add approval
    if (metadata.approval) {
      const approvalUser = await User.findByPk(metadata.approval.approvedBy);
      history.push({
        action: 'approved',
        timestamp: metadata.approval.approvedAt,
        user: approvalUser ? {
          id: approvalUser.id,
          name: (approvalUser as any).name,
          email: (approvalUser as any).email,
        } : null,
        reason: metadata.approval.reason,
      });
    }

    // Add rejection
    if (metadata.rejection) {
      const rejectionUser = await User.findByPk(metadata.rejection.rejectedBy);
      history.push({
        action: 'rejected',
        timestamp: metadata.rejection.rejectedAt,
        user: rejectionUser ? {
          id: rejectionUser.id,
          name: (rejectionUser as any).name,
          email: (rejectionUser as any).email,
        } : null,
        reason: metadata.rejection.reason,
      });
    }

    return {
      activity,
      history: history.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    };
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userRole = (user as any).role;

    // Get all pending activities
    const pendingActivities = await CapitalActivity.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'approver',
          required: false,
        },
      ],
    });

    // Filter activities the user can approve
    const userApprovals = [];
    
    for (const activity of pendingActivities) {
      const rules = await this.getApprovalRules(activity.id);
      const canApprove = rules.some(rule => rule.approverRoles.includes(userRole));
      
      if (canApprove) {
        userApprovals.push(activity);
      }
    }

    return userApprovals;
  }

  /**
   * Update approval rules (admin function)
   */
  updateApprovalRules(newRules: ApprovalRule[]): void {
    // Validate rules
    for (const rule of newRules) {
      if (rule.requiredApprovers < 1) {
        throw new Error('Required approvers must be at least 1');
      }
      if (!rule.approverRoles || rule.approverRoles.length === 0) {
        throw new Error('Approver roles must be specified');
      }
    }

    this.defaultApprovalRules = newRules;
  }

  /**
   * Get current approval rules
   */
  getApprovalRulesConfig(): ApprovalRule[] {
    return [...this.defaultApprovalRules];
  }
}

export default ApprovalWorkflowService;