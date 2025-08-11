import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/database';
import { encryptedField } from '../utils/encryption';

export interface DocumentAttributes {
  id: string;
  fileName: string;
  originalName: string;
  category: 'kyc' | 'aml' | 'legal' | 'closing' | 'transfer' | 'compliance' | 'financial' | 'other';
  entityType: 'fund' | 'investor' | 'commitment' | 'closing' | 'transfer' | 'transaction';
  entityId: number;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  uploadedBy: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'archived';
  version: number;
  parentDocumentId?: string;
  requiresApproval: boolean;
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'status' | 'requiresApproval'> {}

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public fileName!: string;
  public originalName!: string;
  public category!: 'kyc' | 'aml' | 'legal' | 'closing' | 'transfer' | 'compliance' | 'financial' | 'other';
  public entityType!: 'fund' | 'investor' | 'commitment' | 'closing' | 'transfer' | 'transaction';
  public entityId!: number;
  public fileSize!: number;
  public mimeType!: string;
  public storagePath!: string;
  public accessLevel!: 'public' | 'internal' | 'confidential' | 'restricted';
  public uploadedBy!: number;
  public status!: 'pending' | 'processing' | 'approved' | 'rejected' | 'archived';
  public version!: number;
  public parentDocumentId?: string;
  public requiresApproval!: boolean;
  public approvedBy?: number;
  public approvedAt?: Date;
  public rejectionReason?: string;
  public tags?: string[];
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    Document.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
    
    Document.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });

    Document.belongsTo(models.Document, {
      foreignKey: 'parentDocumentId',
      as: 'parentDocument'
    });

    Document.hasMany(models.Document, {
      foreignKey: 'parentDocumentId',
      as: 'versions'
    });

    // Dynamic associations based on entityType
    Document.belongsTo(models.Fund, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'fund'
    });

    Document.belongsTo(models.InvestorEntity, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'investor'
    });

    Document.belongsTo(models.Commitment, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'commitment'
    });

    Document.belongsTo(models.Transaction, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'transaction'
    });
  }
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    category: {
      type: DataTypes.ENUM('kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other'),
      allowNull: false,
      validate: {
        isIn: [['kyc', 'aml', 'legal', 'closing', 'transfer', 'compliance', 'financial', 'other']],
      },
    },
    entityType: {
      type: DataTypes.ENUM('fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction'),
      allowNull: false,
      validate: {
        isIn: [['fund', 'investor', 'commitment', 'closing', 'transfer', 'transaction']],
      },
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100 * 1024 * 1024, // 100MB max
      },
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    storagePath: encryptedField('storagePath'),
    accessLevel: {
      type: DataTypes.ENUM('public', 'internal', 'confidential', 'restricted'),
      allowNull: false,
      defaultValue: 'internal',
      validate: {
        isIn: [['public', 'internal', 'confidential', 'restricted']],
      },
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'approved', 'rejected', 'archived'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'approved', 'rejected', 'archived']],
      },
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    parentDocumentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Documents',
        key: 'id',
      },
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    modelName: 'Document',
    tableName: 'Documents',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
      },
      {
        fields: ['entity_type', 'entity_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['uploaded_by'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['approved_by'],
      },
      {
        fields: ['parent_document_id'],
      },
    ],
    hooks: {
      beforeCreate: async (document: Document) => {
        // Auto-set version for new documents
        if (!document.parentDocumentId) {
          document.version = 1;
        } else {
          // Get the latest version of the parent document
          const latestVersion = await Document.findOne({
            where: {
              parentDocumentId: document.parentDocumentId,
            },
            order: [['version', 'DESC']],
          });
          document.version = latestVersion ? latestVersion.version + 1 : 1;
        }
      },
      beforeUpdate: async (document: Document) => {
        // Update approval timestamp when status changes to approved
        if (document.changed('status') && document.status === 'approved' && !document.approvedAt) {
          document.approvedAt = new Date();
        }
      },
    },
  }
);

export default Document;