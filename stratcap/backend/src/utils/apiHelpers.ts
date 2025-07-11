import { Request } from 'express';
import { Op } from 'sequelize';

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: string;
  order: 'ASC' | 'DESC';
}

export interface FilterOptions {
  [key: string]: any;
}

export class ApiHelpers {
  static parsePagination(req: Request): PaginationOptions {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  static parseSort(req: Request, defaultSort = 'createdAt'): SortOptions {
    const field = (req.query.sort as string) || defaultSort;
    const order = (req.query.order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    return { field, order };
  }

  static buildSearchFilter(searchTerm: string, fields: string[]): any {
    if (!searchTerm || fields.length === 0) {
      return {};
    }

    return {
      [Op.or]: fields.map(field => ({
        [field]: { [Op.iLike]: `%${searchTerm}%` }
      }))
    };
  }

  static buildDateRangeFilter(startDate?: string, endDate?: string): any {
    const filter: any = {};

    if (startDate && endDate) {
      filter[Op.between] = [new Date(startDate), new Date(endDate)];
    } else if (startDate) {
      filter[Op.gte] = new Date(startDate);
    } else if (endDate) {
      filter[Op.lte] = new Date(endDate);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  static buildPaginatedResponse<T>(
    data: T[],
    totalCount: number,
    pagination: PaginationOptions
  ) {
    return {
      success: true,
      data: {
        items: data,
        pagination: {
          currentPage: pagination.page,
          totalPages: Math.ceil(totalCount / pagination.limit),
          totalItems: totalCount,
          itemsPerPage: pagination.limit,
          hasNextPage: pagination.page < Math.ceil(totalCount / pagination.limit),
          hasPreviousPage: pagination.page > 1
        }
      }
    };
  }

  static validateIds(ids: any[]): number[] {
    return ids
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
  }

  static sanitizeFilters(filters: FilterOptions, allowedFields: string[]): FilterOptions {
    const sanitized: FilterOptions = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  static formatCurrency(amount: string | number, currency = 'USD'): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  }

  static formatPercentage(value: number, decimalPlaces = 2): string {
    return `${(value * 100).toFixed(decimalPlaces)}%`;
  }

  static calculateAgeInDays(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static generateReferenceNumber(prefix: string, id: number): string {
    const timestamp = Date.now().toString().slice(-8);
    const paddedId = id.toString().padStart(6, '0');
    return `${prefix}-${timestamp}-${paddedId}`;
  }

  static validateDecimalString(value: string): boolean {
    const decimalRegex = /^\d+(\.\d{1,2})?$/;
    return decimalRegex.test(value) && parseFloat(value) >= 0;
  }

  static roundToDecimal(value: number, places = 2): number {
    return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
  }

  static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return result;
  }

  static buildAuditLog(
    action: string,
    entityType: string,
    entityId: number,
    userId: number,
    changes?: any
  ) {
    return {
      action,
      entityType,
      entityId,
      userId,
      changes,
      timestamp: new Date(),
      ip: null, // Would be populated from request
      userAgent: null // Would be populated from request
    };
  }

  static extractFieldsFromRequest(req: Request, allowedFields: string[]): any {
    const extracted: any = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        extracted[field] = req.body[field];
      }
    }
    
    return extracted;
  }

  static generateQueryOptions(req: Request, options: {
    defaultSort?: string;
    searchFields?: string[];
    allowedFilters?: string[];
    defaultLimit?: number;
  } = {}) {
    const pagination = this.parsePagination(req);
    const sort = this.parseSort(req, options.defaultSort);
    
    const queryOptions: any = {
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[sort.field, sort.order]]
    };

    // Add search filter
    if (req.query.search && options.searchFields) {
      queryOptions.where = {
        ...queryOptions.where,
        ...this.buildSearchFilter(req.query.search as string, options.searchFields)
      };
    }

    // Add other filters
    if (options.allowedFilters) {
      const filters = this.sanitizeFilters(req.query, options.allowedFilters);
      queryOptions.where = { ...queryOptions.where, ...filters };
    }

    return { queryOptions, pagination };
  }
}

export default ApiHelpers;