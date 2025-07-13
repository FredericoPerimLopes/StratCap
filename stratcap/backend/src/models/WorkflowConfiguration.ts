import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/database';

export interface WorkflowConfigurationAttributes {
  id: string;
  workflowName: string;
  workflowType: 'approval' | 'notification' | 'automation' | 'validation' | 'escalation';
  module: string;
  triggerEvent: string;
  conditions?: Record<string, any>;
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  fundId?: string;
  createdBy: string;
  lastModifiedBy?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowAction {
  id: string;
  actionType: 'approve' | 'notify' | 'email' | 'webhook' | 'delay' | 'validate' | 'escalate' | 'transform';
  actionConfig: Record<string, any>;
  order: number;
  conditions?: Record<string, any>;
  isRequired: boolean;
}

interface WorkflowConfigurationCreationAttributes extends Optional<WorkflowConfigurationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class WorkflowConfiguration extends Model<WorkflowConfigurationAttributes, WorkflowConfigurationCreationAttributes> implements WorkflowConfigurationAttributes {
  public id!: string;
  public workflowName!: string;
  public workflowType!: 'approval' | 'notification' | 'automation' | 'validation' | 'escalation';
  public module!: string;
  public triggerEvent!: string;
  public conditions?: Record<string, any>;
  public actions!: WorkflowAction[];
  public isActive!: boolean;
  public priority!: number;
  public fundId?: string;
  public createdBy!: string;
  public lastModifiedBy?: string;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public fund?: any;
  public creator?: any;

  /**
   * Check if workflow conditions are met
   */
  public evaluateConditions(context: Record<string, any>): boolean {
    if (!this.conditions) {
      return true;
    }

    return this.evaluateConditionGroup(this.conditions, context);
  }

  /**
   * Get actions that should be executed for the given context
   */
  public getExecutableActions(context: Record<string, any>): WorkflowAction[] {
    if (!this.isActive) {
      return [];
    }

    if (!this.evaluateConditions(context)) {
      return [];
    }

    return this.actions
      .filter(action => this.evaluateActionConditions(action, context))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Validate workflow configuration
   */
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!this.workflowName || this.workflowName.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (!this.module || this.module.trim() === '') {
      errors.push('Module is required');
    }

    if (!this.triggerEvent || this.triggerEvent.trim() === '') {
      errors.push('Trigger event is required');
    }

    // Validate actions
    if (!this.actions || this.actions.length === 0) {
      errors.push('At least one action is required');
    } else {
      // Check for duplicate action IDs
      const actionIds = this.actions.map(action => action.id);
      const uniqueActionIds = new Set(actionIds);
      if (actionIds.length !== uniqueActionIds.size) {
        errors.push('Duplicate action IDs found');
      }

      // Check action order
      const orders = this.actions.map(action => action.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      if (JSON.stringify(orders.sort((a, b) => a - b)) !== JSON.stringify(sortedOrders)) {
        errors.push('Action orders must be sequential');
      }

      // Validate individual actions
      this.actions.forEach((action, index) => {
        if (!action.actionType) {
          errors.push(`Action ${index + 1}: Action type is required`);
        }

        if (!action.actionConfig) {
          errors.push(`Action ${index + 1}: Action configuration is required`);
        }

        if (action.order < 0) {
          errors.push(`Action ${index + 1}: Order must be non-negative`);
        }
      });
    }

    // Validate priority
    if (this.priority < 0 || this.priority > 999) {
      errors.push('Priority must be between 0 and 999');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone workflow with new name
   */
  public cloneWorkflow(newName: string, createdBy: string): Partial<WorkflowConfigurationAttributes> {
    return {
      workflowName: newName,
      workflowType: this.workflowType,
      module: this.module,
      triggerEvent: this.triggerEvent,
      conditions: this.conditions ? JSON.parse(JSON.stringify(this.conditions)) : undefined,
      actions: this.actions.map(action => ({
        ...action,
        id: `${action.id}_clone_${Date.now()}`,
      })),
      isActive: false, // Start as inactive
      priority: this.priority,
      fundId: this.fundId,
      createdBy,
      metadata: {
        ...this.metadata,
        clonedFrom: this.id,
        clonedAt: new Date(),
      },
    };
  }

  private evaluateConditionGroup(conditionGroup: any, context: Record<string, any>): boolean {
    if (conditionGroup.operator === 'AND') {
      return conditionGroup.conditions.every((condition: any) => 
        this.evaluateSingleCondition(condition, context)
      );
    } else if (conditionGroup.operator === 'OR') {
      return conditionGroup.conditions.some((condition: any) => 
        this.evaluateSingleCondition(condition, context)
      );
    } else {
      return this.evaluateSingleCondition(conditionGroup, context);
    }
  }

  private evaluateSingleCondition(condition: any, context: Record<string, any>): boolean {
    const { field, operator, value } = condition;
    const contextValue = this.getNestedValue(context, field);

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'not_equals':
        return contextValue !== value;
      case 'greater_than':
        return contextValue > value;
      case 'less_than':
        return contextValue < value;
      case 'greater_than_or_equal':
        return contextValue >= value;
      case 'less_than_or_equal':
        return contextValue <= value;
      case 'contains':
        return Array.isArray(contextValue) ? contextValue.includes(value) : 
               String(contextValue).includes(String(value));
      case 'in':
        return Array.isArray(value) && value.includes(contextValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(contextValue);
      case 'is_null':
        return contextValue === null || contextValue === undefined;
      case 'is_not_null':
        return contextValue !== null && contextValue !== undefined;
      case 'regex':
        return new RegExp(value).test(String(contextValue));
      default:
        console.warn(`Unknown condition operator: ${operator}`);
        return false;
    }
  }

  private evaluateActionConditions(action: WorkflowAction, context: Record<string, any>): boolean {
    if (!action.conditions) {
      return true;
    }

    return this.evaluateConditionGroup(action.conditions, context);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

WorkflowConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workflowName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    workflowType: {
      type: DataTypes.ENUM('approval', 'notification', 'automation', 'validation', 'escalation'),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    triggerEvent: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    actions: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidActions(value: any) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Actions must be a non-empty array');
          }
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 999,
      },
    },
    fundId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Funds',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    lastModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'WorkflowConfigurations',
    timestamps: true,
    indexes: [
      {
        fields: ['workflowName'],
        unique: true,
      },
      {
        fields: ['module', 'triggerEvent'],
      },
      {
        fields: ['workflowType'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['fundId'],
      },
    ],
  }
);

export default WorkflowConfiguration;