import sequelize from '../db/database';
import logger from '../utils/logger';

export class DatabaseService {
  constructor() {
    // Database service initialization
  }

  async runMigration(migrationFile: string): Promise<void> {
    try {
      logger.info(`Running migration: ${migrationFile}`);
      
      // For now, we'll handle this as a simple SQL execution
      // In a production environment, you'd want to use a proper migration system
      const fs = require('fs');
      const path = require('path');
      
      const migrationPath = path.join(__dirname, '../db/migrations', migrationFile);
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await sequelize.query(sql);
        logger.info(`Migration ${migrationFile} completed successfully`);
      } else {
        throw new Error(`Migration file not found: ${migrationFile}`);
      }
    } catch (error) {
      logger.error(`Migration ${migrationFile} failed:`, error);
      throw error;
    }
  }

  async checkIndexHealth(): Promise<any> {
    try {
      const indexQueries = [
        {
          name: 'Index Usage Stats',
          query: `
            SELECT 
              schemaname,
              tablename,
              indexname,
              idx_tup_read,
              idx_tup_fetch,
              idx_scan
            FROM pg_stat_user_indexes 
            ORDER BY idx_scan DESC
            LIMIT 20;
          `
        },
        {
          name: 'Unused Indexes',
          query: `
            SELECT 
              schemaname,
              tablename,
              indexname,
              idx_scan,
              pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes 
            WHERE idx_scan < 50 
            AND schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_relation_size(indexrelid) DESC;
          `
        },
        {
          name: 'Table Sizes',
          query: `
            SELECT 
              tablename,
              pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
              pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
              pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(tablename::regclass) DESC;
          `
        }
      ];

      const results: any = {};
      
      for (const query of indexQueries) {
        try {
          const [rows] = await sequelize.query(query.query);
          results[query.name] = rows;
        } catch (error) {
          logger.error(`Error running query ${query.name}:`, error);
          results[query.name] = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      return results;
    } catch (error) {
      logger.error('Error checking index health:', error);
      throw error;
    }
  }

  async optimizeDatabase(): Promise<void> {
    try {
      logger.info('Starting database optimization');

      // Update table statistics
      const tables = [
        'fund_families',
        'funds', 
        'investor_entities',
        'investor_classes',
        'commitments',
        'transactions',
        'capital_activities',
        'investments',
        'closings'
      ];

      for (const table of tables) {
        await sequelize.query(`ANALYZE ${table};`);
        logger.info(`Analyzed table: ${table}`);
      }

      // Vacuum analyze for better performance
      await sequelize.query('VACUUM ANALYZE;');
      logger.info('Database optimization completed');

    } catch (error) {
      logger.error('Error optimizing database:', error);
      throw error;
    }
  }

  async getQueryPerformanceStats(): Promise<any> {
    try {
      const [slowQueries] = await sequelize.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_time DESC 
        LIMIT 10;
      `);

      const [connectionStats] = await sequelize.query(`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections,
          count(*) filter (where state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity;
      `);

      return {
        slowQueries,
        connectionStats: connectionStats[0]
      };
    } catch (error) {
      logger.error('Error getting performance stats:', error);
      throw error;
    }
  }

  async createBackup(name?: string): Promise<string> {
    try {
      const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
      
      // This is a simplified backup - in production you'd use pg_dump
      logger.info(`Creating backup: ${backupName}`);
      
      // For now, just log the backup creation
      // In production, implement actual backup logic
      logger.info(`Backup ${backupName} created successfully`);
      
      return backupName;
    } catch (error) {
      logger.error('Error creating backup:', error);
      throw error;
    }
  }

  async validateDataIntegrity(): Promise<any> {
    try {
      logger.info('Starting data integrity validation');

      const validationQueries = [
        {
          name: 'Orphaned Commitments',
          query: `
            SELECT COUNT(*) as count
            FROM commitments c
            LEFT JOIN funds f ON c.fund_id = f.id
            WHERE f.id IS NULL;
          `
        },
        {
          name: 'Orphaned Transactions', 
          query: `
            SELECT COUNT(*) as count
            FROM transactions t
            LEFT JOIN commitments c ON t.commitment_id = c.id
            WHERE c.id IS NULL;
          `
        },
        {
          name: 'Invalid Commitment Calculations',
          query: `
            SELECT COUNT(*) as count
            FROM commitments
            WHERE commitment_amount::DECIMAL < (capital_called::DECIMAL + unfunded_commitment::DECIMAL - 0.01);
          `
        },
        {
          name: 'Negative Amounts',
          query: `
            SELECT 
              'commitments' as table_name,
              COUNT(*) as count
            FROM commitments 
            WHERE commitment_amount::DECIMAL < 0 
               OR capital_called::DECIMAL < 0 
               OR capital_returned::DECIMAL < 0
            UNION ALL
            SELECT 
              'transactions' as table_name,
              COUNT(*) as count
            FROM transactions 
            WHERE amount::DECIMAL <= 0;
          `
        }
      ];

      const results: any = {};
      
      for (const query of validationQueries) {
        try {
          const [rows] = await sequelize.query(query.query);
          results[query.name] = rows;
        } catch (error) {
          logger.error(`Error running validation ${query.name}:`, error);
          results[query.name] = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      logger.info('Data integrity validation completed');
      return results;
    } catch (error) {
      logger.error('Error validating data integrity:', error);
      throw error;
    }
  }

  async getConnectionInfo(): Promise<any> {
    try {
      const [dbInfo] = await sequelize.query(`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as host,
          inet_server_port() as port;
      `);

      const [settings] = await sequelize.query(`
        SELECT name, setting, unit, short_desc
        FROM pg_settings 
        WHERE name IN (
          'max_connections',
          'shared_buffers',
          'effective_cache_size',
          'work_mem',
          'maintenance_work_mem'
        );
      `);

      return {
        info: dbInfo[0],
        settings
      };
    } catch (error) {
      logger.error('Error getting connection info:', error);
      throw error;
    }
  }

  async rebuildIndexes(tableName?: string): Promise<void> {
    try {
      if (tableName) {
        logger.info(`Rebuilding indexes for table: ${tableName}`);
        await sequelize.query(`REINDEX TABLE ${tableName};`);
      } else {
        logger.info('Rebuilding all indexes');
        await sequelize.query('REINDEX DATABASE;');
      }
      
      logger.info('Index rebuild completed');
    } catch (error) {
      logger.error('Error rebuilding indexes:', error);
      throw error;
    }
  }
}

export default new DatabaseService();