import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../db/database';

export interface GlobalEntityAttributes {
  id: number;
  entityType: 'fund' | 'investor' | 'fund_family' | 'investment' | 'transaction';
  entityId: number;
  name: string;
  description?: string;
  tags: string[];
  relationships: Array<{
    entityType: string;
    entityId: number;
    relationshipType: string;
    strength: number;
  }>;
  metrics: Record<string, any>;
  performanceData: Array<{
    date: Date;
    metric: string;
    value: number;
    benchmark?: number;
  }>;
  riskProfile: {
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    factors: string[];
    lastAssessed: Date;
  };
  compliance: {
    status: 'compliant' | 'non_compliant' | 'under_review';
    lastChecked: Date;
    issues: string[];
  };
  searchVector?: string;
  isActive: boolean;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlobalEntityCreationAttributes extends Optional<GlobalEntityAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastSyncAt'> {}

class GlobalEntity extends Model<GlobalEntityAttributes, GlobalEntityCreationAttributes> implements GlobalEntityAttributes {
  public id!: number;
  public entityType!: 'fund' | 'investor' | 'fund_family' | 'investment' | 'transaction';
  public entityId!: number;
  public name!: string;
  public description?: string;
  public tags!: string[];
  public relationships!: Array<{
    entityType: string;
    entityId: number;
    relationshipType: string;
    strength: number;
  }>;
  public metrics!: Record<string, any>;
  public performanceData!: Array<{
    date: Date;
    metric: string;
    value: number;
    benchmark?: number;
  }>;
  public riskProfile!: {
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    factors: string[];
    lastAssessed: Date;
  };
  public compliance!: {
    status: 'compliant' | 'non_compliant' | 'under_review';
    lastChecked: Date;
    issues: string[];
  };
  public searchVector?: string;
  public isActive!: boolean;
  public lastSyncAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public calculateRelationshipStrength(targetEntity: GlobalEntity): number {
    const relationship = this.relationships.find(
      rel => rel.entityType === targetEntity.entityType && rel.entityId === targetEntity.entityId
    );
    return relationship ? relationship.strength : 0;
  }

  public updateMetrics(newMetrics: Record<string, any>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
    this.lastSyncAt = new Date();
  }

  public addPerformanceData(metric: string, value: number, benchmark?: number): void {
    this.performanceData.push({
      date: new Date(),
      metric,
      value,
      benchmark
    });
  }

  public updateRiskProfile(riskLevel: 'low' | 'medium' | 'high' | 'very_high', factors: string[]): void {
    this.riskProfile = {
      riskLevel,
      factors,
      lastAssessed: new Date()
    };
  }

  public updateComplianceStatus(status: 'compliant' | 'non_compliant' | 'under_review', issues: string[] = []): void {
    this.compliance = {
      status,
      lastChecked: new Date(),
      issues
    };
  }

  // Static methods
  public static async findByEntityReference(entityType: string, entityId: number): Promise<GlobalEntity | null> {
    return this.findOne({
      where: {
        entityType,
        entityId
      }
    });
  }

  public static async searchEntities(query: string, filters?: {
    entityType?: string;
    riskLevel?: string;
    complianceStatus?: string;
    tags?: string[];
  }): Promise<GlobalEntity[]> {
    const whereClause: any = {
      isActive: true
    };

    if (filters?.entityType) {
      whereClause.entityType = filters.entityType;
    }

    if (filters?.riskLevel) {
      whereClause['riskProfile.riskLevel'] = filters.riskLevel;
    }

    if (filters?.complianceStatus) {
      whereClause['compliance.status'] = filters.complianceStatus;
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereClause.tags = {
        [Op.overlap]: filters.tags
      };
    }

    // Add text search if query provided
    if (query) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } }
      ];
    }

    return this.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
  }

  public static async getRelationshipMap(entityType: string, entityId: number, depth: number = 2): Promise<any> {
    const entity = await this.findByEntityReference(entityType, entityId);
    if (!entity) return null;

    const relationshipMap = {
      entity: entity.toJSON(),
      relationships: [] as any[]
    };

    if (depth > 0) {
      for (const rel of entity.relationships) {
        const relatedEntity = await this.findByEntityReference(rel.entityType, rel.entityId);
        if (relatedEntity) {
          const nestedMap = await this.getRelationshipMap(rel.entityType, rel.entityId, depth - 1);
          relationshipMap.relationships.push({
            ...rel,
            entity: relatedEntity.toJSON(),
            nested: nestedMap?.relationships || []
          });
        }
      }
    }

    return relationshipMap;
  }

  // Associations
  public static associate(models: any) {
    // Dynamic associations based on entityType
    GlobalEntity.belongsTo(models.Fund, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'fund'
    });

    GlobalEntity.belongsTo(models.InvestorEntity, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'investor'
    });

    GlobalEntity.belongsTo(models.FundFamily, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'fundFamily'
    });

    GlobalEntity.belongsTo(models.Investment, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'investment'
    });

    GlobalEntity.belongsTo(models.Transaction, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'transaction'
    });
  }
}

GlobalEntity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.ENUM('fund', 'investor', 'fund_family', 'investment', 'transaction'),
      allowNull: false,
      validate: {
        isIn: [['fund', 'investor', 'fund_family', 'investment', 'transaction']],
      },
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    relationships: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidRelationships(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Relationships must be an array');
          }
          for (const rel of value) {
            if (!rel.entityType || !rel.entityId || !rel.relationshipType || typeof rel.strength !== 'number') {
              throw new Error('Invalid relationship structure');
            }
            if (rel.strength < 0 || rel.strength > 1) {
              throw new Error('Relationship strength must be between 0 and 1');
            }
          }
        }
      }
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    performanceData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidPerformanceData(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Performance data must be an array');
          }
          for (const data of value) {
            if (!data.date || !data.metric || typeof data.value !== 'number') {
              throw new Error('Invalid performance data structure');
            }
          }
        }
      }
    },
    riskProfile: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        riskLevel: 'medium',
        factors: [],
        lastAssessed: new Date()
      },
      validate: {
        isValidRiskProfile(value: any) {
          const validRiskLevels = ['low', 'medium', 'high', 'very_high'];
          if (!value.riskLevel || !validRiskLevels.includes(value.riskLevel)) {
            throw new Error('Invalid risk level');
          }
          if (!Array.isArray(value.factors)) {
            throw new Error('Risk factors must be an array');
          }
          if (!value.lastAssessed) {
            throw new Error('Last assessed date is required');
          }
        }
      }
    },
    compliance: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        status: 'under_review',
        lastChecked: new Date(),
        issues: []
      },
      validate: {
        isValidCompliance(value: any) {
          const validStatuses = ['compliant', 'non_compliant', 'under_review'];
          if (!value.status || !validStatuses.includes(value.status)) {
            throw new Error('Invalid compliance status');
          }
          if (!Array.isArray(value.issues)) {
            throw new Error('Compliance issues must be an array');
          }
          if (!value.lastChecked) {
            throw new Error('Last checked date is required');
          }
        }
      }
    },
    searchVector: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GlobalEntity',
    tableName: 'GlobalEntities',
    timestamps: true,
    indexes: [
      {
        fields: ['entityType', 'entityId'],
        unique: true,
      },
      {
        fields: ['name'],
      },
      {
        fields: ['tags'],
        using: 'gin',
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['lastSyncAt'],
      },
      {
        fields: ['relationships'],
        using: 'gin',
      },
      {
        fields: ['metrics'],
        using: 'gin',
      },
      {
        name: 'global_entities_risk_level_idx',
        fields: [sequelize.literal("(risk_profile->>'riskLevel')")],
      },
      {
        name: 'global_entities_compliance_status_idx',
        fields: [sequelize.literal("(compliance->>'status')")],
      },
    ],
    hooks: {
      beforeSave: async (globalEntity: GlobalEntity) => {
        // Update search vector for full-text search
        const searchTerms = [
          globalEntity.name,
          globalEntity.description || '',
          ...globalEntity.tags
        ].join(' ');
        
        globalEntity.searchVector = searchTerms.toLowerCase();
        globalEntity.lastSyncAt = new Date();
      },
    },
  }
);

export default GlobalEntity;