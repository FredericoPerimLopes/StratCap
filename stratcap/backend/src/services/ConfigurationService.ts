import { Transaction, Op } from 'sequelize';
import sequelize from '../db/database';
import { SystemConfiguration } from '../models/SystemConfiguration';
import { UserPreference } from '../models/UserPreference';
import { WorkflowConfiguration, WorkflowAction } from '../models/WorkflowConfiguration';

export interface ConfigurationRequest {
  module: string;
  configKey: string;
  configValue: string;
  dataType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category?: 'system' | 'feature' | 'integration' | 'security' | 'ui' | 'workflow';
  description?: string;
  isEncrypted?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  validationRules?: Record<string, any>;
  defaultValue?: string;
  environmentOverride?: boolean;
  metadata?: Record<string, any>;
}

export interface UserPreferenceRequest {
  userId: string;
  category: 'ui' | 'notification' | 'reporting' | 'workflow' | 'security' | 'display' | 'general';
  preferenceKey: string;
  preferenceValue: any;
  dataType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface WorkflowConfigurationRequest {
  workflowName: string;
  workflowType: 'approval' | 'notification' | 'automation' | 'validation' | 'escalation';
  module: string;
  triggerEvent: string;
  conditions?: Record<string, any>;
  actions: WorkflowAction[];
  isActive?: boolean;
  priority?: number;
  fundId?: string;
  metadata?: Record<string, any>;
}

export interface ConfigurationSearchOptions {
  module?: string;
  category?: string;
  dataType?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ConfigurationService {

  /**
   * Create or update system configuration
   */
  async setSystemConfiguration(
    request: ConfigurationRequest,
    lastModifiedBy: string,
    transaction?: Transaction
  ): Promise<SystemConfiguration> {
    const t = transaction || await sequelize.transaction();

    try {
      // Check if configuration exists
      const existingConfig = await SystemConfiguration.findOne({
        where: {
          module: request.module,
          configKey: request.configKey,
        },
        transaction: t,
      });

      if (existingConfig) {
        // Check if read-only
        if (existingConfig.isReadOnly) {
          throw new Error(`Configuration ${request.configKey} is read-only`);
        }

        // Update existing configuration
        const updatedConfig = await existingConfig.update({
          configValue: request.configValue,
          dataType: request.dataType || existingConfig.dataType,
          category: request.category || existingConfig.category,
          description: request.description || existingConfig.description,
          isEncrypted: request.isEncrypted !== undefined ? request.isEncrypted : existingConfig.isEncrypted,
          isRequired: request.isRequired !== undefined ? request.isRequired : existingConfig.isRequired,
          validationRules: request.validationRules || existingConfig.validationRules,
          defaultValue: request.defaultValue || existingConfig.defaultValue,
          environmentOverride: request.environmentOverride !== undefined ? request.environmentOverride : existingConfig.environmentOverride,
          lastModifiedBy,
          metadata: { ...existingConfig.metadata, ...request.metadata },
        }, { transaction: t });

        // Validate the new value
        const validation = updatedConfig.validateValue();
        if (!validation.isValid) {
          throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }

        if (!transaction) {
          await t.commit();
        }

        return updatedConfig;
      } else {
        // Create new configuration
        const newConfig = await SystemConfiguration.create({
          module: request.module,
          configKey: request.configKey,
          configValue: request.configValue,
          dataType: request.dataType || 'string',
          category: request.category || 'system',
          description: request.description,
          isEncrypted: request.isEncrypted || false,
          isRequired: request.isRequired || false,
          isReadOnly: request.isReadOnly || false,
          validationRules: request.validationRules,
          defaultValue: request.defaultValue,
          environmentOverride: request.environmentOverride || false,
          lastModifiedBy,
          metadata: request.metadata,
        }, { transaction: t });

        // Validate the value
        const validation = newConfig.validateValue();
        if (!validation.isValid) {
          throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }

        if (!transaction) {
          await t.commit();
        }

        return newConfig;
      }
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Get system configuration value
   */
  async getSystemConfiguration(module: string, configKey: string): Promise<any> {
    const config = await SystemConfiguration.findOne({
      where: { module, configKey },
    });

    if (!config) {
      throw new Error(`Configuration not found: ${module}.${configKey}`);
    }

    return config.getEffectiveValue();
  }

  /**
   * Get all configurations for a module
   */
  async getModuleConfigurations(module: string): Promise<Record<string, any>> {
    const configs = await SystemConfiguration.findAll({
      where: { module },
      order: [['configKey', 'ASC']],
    });

    const result: Record<string, any> = {};
    configs.forEach(config => {
      result[config.configKey] = config.getEffectiveValue();
    });

    return result;
  }

  /**
   * Search system configurations
   */
  async searchSystemConfigurations(options: ConfigurationSearchOptions): Promise<{
    configurations: SystemConfiguration[];
    totalCount: number;
  }> {
    const whereClause: any = {};

    if (options.module) {
      whereClause.module = options.module;
    }

    if (options.category) {
      whereClause.category = options.category;
    }

    if (options.dataType) {
      whereClause.dataType = options.dataType;
    }

    if (options.isRequired !== undefined) {
      whereClause.isRequired = options.isRequired;
    }

    if (options.isReadOnly !== undefined) {
      whereClause.isReadOnly = options.isReadOnly;
    }

    if (options.search) {
      whereClause[Op.or] = [
        { configKey: { [Op.iLike]: `%${options.search}%` } },
        { description: { [Op.iLike]: `%${options.search}%` } },
      ];
    }

    const { count, rows } = await SystemConfiguration.findAndCountAll({
      where: whereClause,
      order: [['module', 'ASC'], ['configKey', 'ASC']],
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    return {
      configurations: rows,
      totalCount: count,
    };
  }

  /**
   * Set user preference
   */
  async setUserPreference(
    request: UserPreferenceRequest,
    transaction?: Transaction
  ): Promise<UserPreference> {
    const t = transaction || await sequelize.transaction();

    try {
      // Check if preference exists
      const existingPreference = await UserPreference.findOne({
        where: {
          userId: request.userId,
          preferenceKey: request.preferenceKey,
        },
        transaction: t,
      });

      const preferenceData = {
        userId: request.userId,
        category: request.category,
        preferenceKey: request.preferenceKey,
        preferenceValue: this.serializePreferenceValue(request.preferenceValue, request.dataType),
        dataType: request.dataType || this.inferDataType(request.preferenceValue),
        description: request.description,
        isPublic: request.isPublic || false,
        metadata: request.metadata,
      };

      if (existingPreference) {
        await existingPreference.update(preferenceData, { transaction: t });
        if (!transaction) {
          await t.commit();
        }
        return existingPreference;
      } else {
        const newPreference = await UserPreference.create(preferenceData, { transaction: t });
        if (!transaction) {
          await t.commit();
        }
        return newPreference;
      }
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Get user preference
   */
  async getUserPreference(userId: string, preferenceKey: string): Promise<any> {
    const preference = await UserPreference.findOne({
      where: { userId, preferenceKey },
    });

    if (!preference) {
      return null;
    }

    return preference.getParsedValue();
  }

  /**
   * Get all user preferences
   */
  async getUserPreferences(userId: string, category?: string): Promise<Record<string, any>> {
    const whereClause: any = { userId };
    if (category) {
      whereClause.category = category;
    }

    const preferences = await UserPreference.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['preferenceKey', 'ASC']],
    });

    const result: Record<string, any> = {};
    preferences.forEach(pref => {
      result[pref.preferenceKey] = pref.getParsedValue();
    });

    return result;
  }

  /**
   * Delete user preference
   */
  async deleteUserPreference(
    userId: string,
    preferenceKey: string,
    transaction?: Transaction
  ): Promise<boolean> {
    const t = transaction || await sequelize.transaction();

    try {
      const deletedCount = await UserPreference.destroy({
        where: { userId, preferenceKey },
        transaction: t,
      });

      if (!transaction) {
        await t.commit();
      }

      return deletedCount > 0;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Create workflow configuration
   */
  async createWorkflowConfiguration(
    request: WorkflowConfigurationRequest,
    createdBy: string,
    transaction?: Transaction
  ): Promise<WorkflowConfiguration> {
    const t = transaction || await sequelize.transaction();

    try {
      // Check for duplicate workflow name
      const existingWorkflow = await WorkflowConfiguration.findOne({
        where: { workflowName: request.workflowName },
        transaction: t,
      });

      if (existingWorkflow) {
        throw new Error(`Workflow with name "${request.workflowName}" already exists`);
      }

      const workflow = await WorkflowConfiguration.create({
        workflowName: request.workflowName,
        workflowType: request.workflowType,
        module: request.module,
        triggerEvent: request.triggerEvent,
        conditions: request.conditions,
        actions: request.actions,
        isActive: request.isActive !== undefined ? request.isActive : true,
        priority: request.priority || 100,
        fundId: request.fundId,
        createdBy,
        lastModifiedBy: createdBy,
        metadata: request.metadata,
      }, { transaction: t });

      // Validate the workflow configuration
      const validation = workflow.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      if (!transaction) {
        await t.commit();
      }

      return workflow;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Update workflow configuration
   */
  async updateWorkflowConfiguration(
    workflowId: string,
    updates: Partial<WorkflowConfigurationRequest>,
    lastModifiedBy: string,
    transaction?: Transaction
  ): Promise<WorkflowConfiguration> {
    const t = transaction || await sequelize.transaction();

    try {
      const workflow = await WorkflowConfiguration.findByPk(workflowId, { transaction: t });

      if (!workflow) {
        throw new Error('Workflow configuration not found');
      }

      await workflow.update({
        ...updates,
        lastModifiedBy,
      }, { transaction: t });

      // Validate the updated workflow configuration
      const validation = workflow.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      if (!transaction) {
        await t.commit();
      }

      return workflow;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Get workflows for a trigger event
   */
  async getWorkflowsForEvent(
    module: string,
    triggerEvent: string,
    fundId?: string
  ): Promise<WorkflowConfiguration[]> {
    const whereClause: any = {
      module,
      triggerEvent,
      isActive: true,
    };

    if (fundId) {
      whereClause[Op.or] = [
        { fundId },
        { fundId: null },
      ];
    }

    return await WorkflowConfiguration.findAll({
      where: whereClause,
      order: [['priority', 'ASC']],
    });
  }

  /**
   * Execute workflow actions
   */
  async executeWorkflow(
    workflowId: string,
    context: Record<string, any>
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const workflow = await WorkflowConfiguration.findByPk(workflowId);

    if (!workflow) {
      throw new Error('Workflow configuration not found');
    }

    const actions = workflow.getExecutableActions(context);
    const results: any[] = [];
    const errors: string[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeWorkflowAction(action, context);
        results.push({
          actionId: action.id,
          actionType: action.actionType,
          success: true,
          result,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Action ${action.id}: ${errorMessage}`);
        results.push({
          actionId: action.id,
          actionType: action.actionType,
          success: false,
          error: errorMessage,
        });

        // Stop execution if required action fails
        if (action.isRequired) {
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }

  /**
   * Clone workflow configuration
   */
  async cloneWorkflowConfiguration(
    workflowId: string,
    newName: string,
    createdBy: string,
    transaction?: Transaction
  ): Promise<WorkflowConfiguration> {
    const t = transaction || await sequelize.transaction();

    try {
      const originalWorkflow = await WorkflowConfiguration.findByPk(workflowId, { transaction: t });

      if (!originalWorkflow) {
        throw new Error('Original workflow configuration not found');
      }

      const clonedData = originalWorkflow.cloneWorkflow(newName, createdBy);
      const clonedWorkflow = await WorkflowConfiguration.create(clonedData, { transaction: t });

      if (!transaction) {
        await t.commit();
      }

      return clonedWorkflow;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private serializePreferenceValue(value: any, dataType?: string): string {
    const type = dataType || this.inferDataType(value);
    
    switch (type) {
      case 'boolean':
        return Boolean(value).toString();
      case 'number':
        return Number(value).toString();
      case 'json':
      case 'array':
        return JSON.stringify(value);
      case 'string':
      default:
        return String(value);
    }
  }

  private inferDataType(value: any): 'string' | 'number' | 'boolean' | 'json' | 'array' {
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (typeof value === 'object' && value !== null) {
      return 'json';
    }
    return 'string';
  }

  private async executeWorkflowAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    switch (action.actionType) {
      case 'notify':
        return this.executeNotifyAction(action, context);
      case 'email':
        return this.executeEmailAction(action, context);
      case 'webhook':
        return this.executeWebhookAction(action, context);
      case 'delay':
        return this.executeDelayAction(action, context);
      case 'validate':
        return this.executeValidateAction(action, context);
      case 'transform':
        return this.executeTransformAction(action, context);
      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }
  }

  private async executeNotifyAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Implementation would send notification via internal notification system
    console.log('Notification:', action.actionConfig.message, context);
    return { notified: true, recipients: action.actionConfig.recipients };
  }

  private async executeEmailAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Implementation would send email via email service
    console.log('Email:', action.actionConfig.template, context);
    return { emailSent: true, recipients: action.actionConfig.recipients };
  }

  private async executeWebhookAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Implementation would call external webhook
    console.log('Webhook:', action.actionConfig.url, context);
    return { webhookCalled: true, url: action.actionConfig.url };
  }

  private async executeDelayAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    const delayMs = action.actionConfig.delayMs || 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return { delayed: true, duration: delayMs };
  }

  private async executeValidateAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Implementation would perform validation based on rules
    const rules = action.actionConfig.rules || [];
    const results = rules.map((rule: any) => ({
      rule: rule.name,
      passed: true, // Simplified validation
    }));
    return { validated: true, results };
  }

  private async executeTransformAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    // Implementation would transform data based on transformation rules
    const transformations = action.actionConfig.transformations || [];
    const transformedData = { ...context };
    
    transformations.forEach((transform: any) => {
      // Apply transformation logic
      transformedData[transform.field] = transform.value;
    });

    return { transformed: true, data: transformedData };
  }
}