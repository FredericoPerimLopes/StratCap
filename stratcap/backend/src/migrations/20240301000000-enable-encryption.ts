import { QueryInterface, DataTypes } from 'sequelize';
import { Op } from 'sequelize';

/**
 * Migration to enable database encryption features
 * 
 * This migration:
 * 1. Adds hash columns for searchable encrypted fields
 * 2. Creates indexes for performance
 * 3. Sets up encryption configuration
 */

export = {
  up: async (queryInterface: QueryInterface) => {
    // Add hash columns to investor_entities for searchable encrypted fields
    await queryInterface.addColumn('investor_entities', 'tax_id_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('investor_entities', 'registration_number_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('investor_entities', 'bank_account_number_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    });

    // Add indexes for hash columns
    await queryInterface.addIndex('investor_entities', ['tax_id_hash'], {
      name: 'idx_investor_entities_tax_id_hash',
      where: {
        tax_id_hash: { [Op.ne]: null }
      }
    });

    await queryInterface.addIndex('investor_entities', ['registration_number_hash'], {
      name: 'idx_investor_entities_registration_number_hash',
      where: {
        registration_number_hash: { [Op.ne]: null }
      }
    });

    await queryInterface.addIndex('investor_entities', ['bank_account_number_hash'], {
      name: 'idx_investor_entities_bank_account_number_hash',
      where: {
        bank_account_number_hash: { [Op.ne]: null }
      }
    });

    // Create audit table for encryption operations
    await queryInterface.createTable('encryption_audit_logs', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      operation: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      table_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      record_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      field_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      access_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add index for audit log queries
    await queryInterface.addIndex('encryption_audit_logs', ['user_id', 'created_at'], {
      name: 'idx_encryption_audit_logs_user_date',
    });

    await queryInterface.addIndex('encryption_audit_logs', ['table_name', 'record_id'], {
      name: 'idx_encryption_audit_logs_table_record',
    });

    // Create key rotation tracking table
    await queryInterface.createTable('encryption_key_rotations', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      key_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      rotated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      next_rotation_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      rotation_interval_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // PostgreSQL specific: Enable encryption extensions if available
    try {
      await queryInterface.sequelize.query(`
        -- Enable pgcrypto extension for encryption functions
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        
        -- Create a function to check if TDE is available (PostgreSQL 15+)
        CREATE OR REPLACE FUNCTION check_tde_status()
        RETURNS TABLE(tde_enabled boolean, message text)
        LANGUAGE plpgsql
        AS $$
        BEGIN
          -- Check PostgreSQL version
          IF current_setting('server_version_num')::integer >= 150000 THEN
            RETURN QUERY SELECT true, 'PostgreSQL 15+ detected. TDE can be configured at cluster level.';
          ELSE
            RETURN QUERY SELECT false, 'TDE requires PostgreSQL 15+. Using application-level encryption.';
          END IF;
        END;
        $$;
        
        -- Log TDE status
        SELECT * FROM check_tde_status();
      `);
    } catch (error) {
      console.log('pgcrypto extension setup skipped:', error);
    }

    // Add comment explaining encryption
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE investor_entities IS 
      'Contains investor information with field-level encryption for sensitive data (tax_id, registration_number, address, phone, bank_account_number)';
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove indexes
    await queryInterface.removeIndex('investor_entities', 'idx_investor_entities_tax_id_hash');
    await queryInterface.removeIndex('investor_entities', 'idx_investor_entities_registration_number_hash');
    await queryInterface.removeIndex('investor_entities', 'idx_investor_entities_bank_account_number_hash');

    // Remove columns
    await queryInterface.removeColumn('investor_entities', 'tax_id_hash');
    await queryInterface.removeColumn('investor_entities', 'registration_number_hash');
    await queryInterface.removeColumn('investor_entities', 'bank_account_number_hash');

    // Drop audit tables
    await queryInterface.dropTable('encryption_audit_logs');
    await queryInterface.dropTable('encryption_key_rotations');

    // Drop functions
    try {
      await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS check_tde_status();');
    } catch (error) {
      console.log('Function cleanup skipped:', error);
    }
  }
};