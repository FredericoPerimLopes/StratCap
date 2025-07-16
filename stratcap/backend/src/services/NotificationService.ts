import CapitalActivity from '../models/CapitalActivity';
import CapitalAllocation from '../models/CapitalAllocation';
import DistributionAllocation from '../models/DistributionAllocation';
import NotificationTemplate from '../models/NotificationTemplate';
import InvestorEntity from '../models/InvestorEntity';
import Fund from '../models/Fund';

export interface NotificationRecipient {
  email: string;
  name: string;
  type: 'primary' | 'secondary' | 'cc' | 'bcc';
}

export interface NotificationData {
  subject: string;
  body: string;
  recipients: NotificationRecipient[];
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  metadata: Record<string, any>;
}

export interface TemplateVariables {
  fund: {
    name: string;
    code: string;
    currency: string;
  };
  investor: {
    name: string;
    legalName: string;
    primaryContact?: string;
    primaryEmail?: string;
  };
  capitalActivity: {
    eventType: string;
    eventNumber: string;
    eventDate: string;
    dueDate?: string;
    description: string;
    totalAmount: string;
  };
  allocation: {
    amount: string;
    percentageOfCommitment: string;
    percentageOfTotal: string;
    dueDate?: string;
  };
  commitment: {
    commitmentAmount: string;
    capitalCalled: string;
    capitalReturned: string;
    unfundedCommitment: string;
  };
}

class NotificationService {
  /**
   * Send capital call notification to investor
   */
  async sendCapitalCallNotification(
    allocation: CapitalAllocation,
    capitalActivity: CapitalActivity
  ): Promise<void> {
    // Get the default capital call template
    const template = await NotificationTemplate.findOne({
      where: {
        type: 'capital_call',
        isActive: true,
      },
      order: [['version', 'DESC']],
    });

    if (!template) {
      throw new Error('No active capital call notification template found');
    }

    // Load related data
    const [fund, investorEntity, commitment] = await Promise.all([
      Fund.findByPk(allocation.fundId),
      InvestorEntity.findByPk(allocation.investorEntityId),
      require('../models/Commitment').default.findByPk(allocation.commitmentId),
    ]);

    if (!fund || !investorEntity || !commitment) {
      throw new Error('Required data not found for notification');
    }

    // Prepare template variables
    const variables = this.prepareTemplateVariables(
      fund,
      investorEntity,
      capitalActivity,
      commitment,
      {
        amount: allocation.allocationAmount,
        percentageOfCommitment: allocation.percentageOfCommitment,
        percentageOfTotal: allocation.percentageOfTotal,
        dueDate: allocation.dueDate?.toISOString().split('T')[0],
      }
    );

    // Generate notification content
    const notificationData = await this.generateNotificationContent(
      template,
      variables,
      investorEntity
    );

    // Send notification (implementation would integrate with email service)
    await this.sendNotification(notificationData);

    // Log notification in allocation
    const notificationLog = {
      sentAt: new Date().toISOString(),
      templateId: template.id,
      templateVersion: template.version,
      recipient: investorEntity.primaryEmail,
      subject: notificationData.subject,
      type: 'capital_call',
    };

    const notifications = allocation.notificationsSent || {};
    notifications[`capital_call_${Date.now()}`] = notificationLog;

    await allocation.update({
      notificationsSent: notifications,
    });
  }

  /**
   * Send distribution notification to investor
   */
  async sendDistributionNotification(
    allocation: DistributionAllocation,
    capitalActivity: CapitalActivity
  ): Promise<void> {
    // Get the default distribution template
    const template = await NotificationTemplate.findOne({
      where: {
        type: 'distribution',
        isActive: true,
      },
      order: [['version', 'DESC']],
    });

    if (!template) {
      throw new Error('No active distribution notification template found');
    }

    // Load related data
    const [fund, investorEntity, commitment] = await Promise.all([
      Fund.findByPk(allocation.fundId),
      InvestorEntity.findByPk(allocation.investorEntityId),
      require('../models/Commitment').default.findByPk(allocation.commitmentId),
    ]);

    if (!fund || !investorEntity || !commitment) {
      throw new Error('Required data not found for notification');
    }

    // Prepare template variables with distribution-specific data
    const variables = this.prepareTemplateVariables(
      fund,
      investorEntity,
      capitalActivity,
      commitment,
      {
        amount: allocation.totalDistribution,
        returnOfCapital: allocation.returnOfCapital,
        gain: allocation.gain,
        carriedInterest: allocation.carriedInterest,
        managementFees: allocation.managementFees,
        expenses: allocation.expenses,
        netDistribution: allocation.netDistribution,
        percentageOfTotal: allocation.percentageOfTotal,
      }
    );

    // Generate notification content
    const notificationData = await this.generateNotificationContent(
      template,
      variables,
      investorEntity
    );

    // Send notification
    await this.sendNotification(notificationData);

    // Log notification in allocation
    const notificationLog = {
      sentAt: new Date().toISOString(),
      templateId: template.id,
      templateVersion: template.version,
      recipient: investorEntity.primaryEmail,
      subject: notificationData.subject,
      type: 'distribution',
    };

    const notifications = allocation.notificationsSent || {};
    notifications[`distribution_${Date.now()}`] = notificationLog;

    await allocation.update({
      notificationsSent: notifications,
    });
  }

  /**
   * Send reminder notification for overdue capital calls
   */
  async sendCapitalCallReminder(allocationId: number): Promise<void> {
    const allocation = await CapitalAllocation.findByPk(allocationId, {
      include: [
        { model: CapitalActivity, as: 'capitalActivity' },
        { model: InvestorEntity, as: 'investorEntity' },
        { model: Fund, as: 'fund' },
      ],
    });

    if (!allocation) {
      throw new Error('Capital allocation not found');
    }

    if (allocation.status === 'paid') {
      throw new Error('Cannot send reminder for paid allocation');
    }

    // Check if due date has passed
    if (!allocation.dueDate || allocation.dueDate > new Date()) {
      throw new Error('Capital call is not overdue');
    }

    const template = await NotificationTemplate.findOne({
      where: {
        type: 'reminder',
        isActive: true,
      },
    });

    if (!template) {
      throw new Error('No active reminder template found');
    }

    // Generate and send reminder notification
    // Implementation similar to capital call notification
    // but with reminder-specific template and urgency
  }

  /**
   * Prepare template variables from models
   */
  private prepareTemplateVariables(
    fund: Fund,
    investorEntity: InvestorEntity,
    capitalActivity: CapitalActivity,
    commitment: any,
    allocationData: Record<string, any>
  ): TemplateVariables {
    return {
      fund: {
        name: fund.name,
        code: fund.code,
        currency: fund.currency,
      },
      investor: {
        name: investorEntity.name,
        legalName: investorEntity.legalName,
        primaryContact: investorEntity.primaryContact,
        primaryEmail: investorEntity.primaryEmail,
      },
      capitalActivity: {
        eventType: capitalActivity.eventType,
        eventNumber: capitalActivity.eventNumber,
        eventDate: capitalActivity.eventDate.toISOString().split('T')[0],
        dueDate: capitalActivity.dueDate?.toISOString().split('T')[0],
        description: capitalActivity.description,
        totalAmount: capitalActivity.totalAmount,
      },
      allocation: allocationData,
      commitment: {
        commitmentAmount: commitment.commitmentAmount,
        capitalCalled: commitment.capitalCalled,
        capitalReturned: commitment.capitalReturned,
        unfundedCommitment: commitment.unfundedCommitment,
      },
    };
  }

  /**
   * Generate notification content from template
   */
  private async generateNotificationContent(
    template: NotificationTemplate,
    variables: TemplateVariables,
    investorEntity: InvestorEntity
  ): Promise<NotificationData> {
    // Simple template variable replacement (can be enhanced with proper templating engine)
    let subject = template.subject;
    let body = template.bodyTemplate;

    // Replace variables in subject and body
    const flatVariables = this.flattenVariables(variables);
    
    for (const [key, value] of Object.entries(flatVariables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value || ''));
      body = body.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    // Determine recipients
    const recipients: NotificationRecipient[] = [];
    
    if (investorEntity.primaryEmail) {
      recipients.push({
        email: investorEntity.primaryEmail,
        name: investorEntity.primaryContact || investorEntity.name,
        type: 'primary',
      });
    }

    // Add default recipients from template
    if (template.defaultRecipients) {
      const defaultRecipients = template.defaultRecipients as any;
      if (defaultRecipients.cc) {
        defaultRecipients.cc.forEach((email: string) => {
          recipients.push({ email, name: email, type: 'cc' });
        });
      }
      if (defaultRecipients.bcc) {
        defaultRecipients.bcc.forEach((email: string) => {
          recipients.push({ email, name: email, type: 'bcc' });
        });
      }
    }

    return {
      subject,
      body,
      recipients,
      metadata: {
        templateId: template.id,
        templateVersion: template.version,
        investorEntityId: investorEntity.id,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Flatten nested variables for template replacement
   */
  private flattenVariables(
    variables: TemplateVariables,
    prefix = ''
  ): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const [key, value] of Object.entries(variables)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenVariables(value, fullKey));
      } else {
        flattened[fullKey] = String(value || '');
      }
    }

    return flattened;
  }

  /**
   * Send notification (placeholder for actual email service integration)
   */
  private async sendNotification(notificationData: NotificationData): Promise<void> {
    // This would integrate with an actual email service like SendGrid, AWS SES, etc.
    console.log('Sending notification:', {
      to: notificationData.recipients.filter(r => r.type === 'primary').map(r => r.email),
      cc: notificationData.recipients.filter(r => r.type === 'cc').map(r => r.email),
      bcc: notificationData.recipients.filter(r => r.type === 'bcc').map(r => r.email),
      subject: notificationData.subject,
      bodyLength: notificationData.body.length,
      attachmentCount: notificationData.attachments?.length || 0,
    });

    // For now, just log that notification would be sent
    // In production, implement actual email sending logic
  }

  /**
   * Get notification history for an allocation
   */
  async getNotificationHistory(
    allocationId: number,
    allocationType: 'capital' | 'distribution'
  ) {
    let allocation;
    if (allocationType === 'capital') {
      allocation = await CapitalAllocation.findByPk(allocationId);
    } else {
      allocation = await DistributionAllocation.findByPk(allocationId);
    }

    if (!allocation) {
      throw new Error('Allocation not found');
    }

    return allocation.notificationsSent || {};
  }

  /**
   * Create or update notification template
   */
  async createNotificationTemplate(
    templateData: {
      name: string;
      type: 'capital_call' | 'distribution' | 'notice' | 'reminder' | 'confirmation';
      subject: string;
      bodyTemplate: string;
      variables: Record<string, any>;
      defaultRecipients?: Record<string, any>;
      settings?: Record<string, any>;
    },
    createdBy: number
  ): Promise<NotificationTemplate> {
    return NotificationTemplate.create({
      ...templateData,
      createdBy,
      version: 1,
      isActive: true,
    });
  }

  /**
   * Update existing notification template (creates new version)
   */
  async updateNotificationTemplate(
    templateId: number,
    updates: Partial<{
      subject: string;
      bodyTemplate: string;
      variables: Record<string, any>;
      defaultRecipients: Record<string, any>;
      settings: Record<string, any>;
    }>,
    lastModifiedBy: number
  ): Promise<NotificationTemplate> {
    const currentTemplate = await NotificationTemplate.findByPk(templateId);
    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    // Deactivate current version
    await currentTemplate.update({ isActive: false });

    // Create new version
    return NotificationTemplate.create({
      name: currentTemplate.name,
      type: currentTemplate.type,
      subject: updates.subject || currentTemplate.subject,
      bodyTemplate: updates.bodyTemplate || currentTemplate.bodyTemplate,
      variables: updates.variables || currentTemplate.variables,
      defaultRecipients: updates.defaultRecipients || currentTemplate.defaultRecipients,
      settings: updates.settings || currentTemplate.settings,
      createdBy: currentTemplate.createdBy,
      lastModifiedBy,
      version: currentTemplate.version + 1,
      isActive: true,
    });
  }
}

export default NotificationService;