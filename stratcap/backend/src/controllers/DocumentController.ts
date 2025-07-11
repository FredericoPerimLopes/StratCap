import { Request, Response } from 'express';
import multer from 'multer';
import { DocumentService } from '../services/DocumentService';

class DocumentController {
  private documentService: DocumentService;
  private upload: multer.Multer;

  constructor() {
    this.documentService = new DocumentService();
    
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/tiff',
          'text/plain',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    });
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload.single('document');
  }

  /**
   * Upload a new document
   */
  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const file = req.file;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      const {
        category,
        entityType,
        entityId,
        accessLevel,
        requiresApproval,
        tags,
        notes,
        metadata,
      } = req.body;

      if (!category || !entityType || !entityId) {
        res.status(400).json({
          success: false,
          error: 'Category, entityType, and entityId are required',
        });
        return;
      }

      const uploadRequest = {
        file: file.buffer,
        name: file.originalname,
        category,
        entityType,
        entityId: parseInt(entityId),
        uploadedBy: userId,
        accessLevel,
        requiresApproval: requiresApproval === 'true',
        tags: tags ? JSON.parse(tags) : undefined,
        notes,
        metadata: metadata ? JSON.parse(metadata) : undefined,
      };

      const document = await this.documentService.uploadDocument(uploadRequest);

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document',
      });
    }
  };

  /**
   * Get document by ID
   */
  getDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const userId = (req as any).user?.id;

      const document = await this.documentService.getDocument(documentId, userId);

      if (!document) {
        res.status(404).json({
          success: false,
          error: 'Document not found',
        });
        return;
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error('Error getting document:', error);
      if (error instanceof Error && error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get document',
        });
      }
    }
  };

  /**
   * Download document content
   */
  downloadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { content, document } = await this.documentService.downloadDocument(documentId, userId);

      // Set appropriate headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', content.length);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);

      res.send(content);
    } catch (error) {
      console.error('Error downloading document:', error);
      if (error instanceof Error && error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to download document',
        });
      }
    }
  };

  /**
   * Update document version
   */
  updateDocumentVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const userId = (req as any).user?.id;
      const file = req.file;
      const { changes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      if (!changes) {
        res.status(400).json({
          success: false,
          error: 'Changes description is required',
        });
        return;
      }

      const updatedDocument = await this.documentService.updateDocumentVersion(
        documentId,
        file.buffer,
        userId,
        changes
      );

      res.json({
        success: true,
        data: updatedDocument,
        message: 'Document version updated successfully',
      });
    } catch (error) {
      console.error('Error updating document version:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document version',
      });
    }
  };

  /**
   * Approve or reject document
   */
  approveDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const { decision, comments } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!decision || !['approve', 'reject'].includes(decision)) {
        res.status(400).json({
          success: false,
          error: 'Decision must be either "approve" or "reject"',
        });
        return;
      }

      const approvalRequest = {
        documentId,
        approvedBy: userId,
        decision,
        comments,
      };

      const document = await this.documentService.approveDocument(approvalRequest);

      res.json({
        success: true,
        data: document,
        message: `Document ${decision}d successfully`,
      });
    } catch (error) {
      console.error('Error approving document:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : `Failed to ${req.body.decision} document`,
      });
    }
  };

  /**
   * Search documents
   */
  searchDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        category,
        entityType,
        entityId,
        status,
        uploadedBy,
        uploadDateFrom,
        uploadDateTo,
        tags,
        textSearch,
        page = '1',
        limit = '20',
      } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (entityType) filters.entityType = entityType as string;
      if (entityId) filters.entityId = parseInt(entityId as string);
      if (status) filters.status = status as string;
      if (uploadedBy) filters.uploadedBy = parseInt(uploadedBy as string);
      if (uploadDateFrom) filters.uploadDateFrom = new Date(uploadDateFrom as string);
      if (uploadDateTo) filters.uploadDateTo = new Date(uploadDateTo as string);
      if (tags) filters.tags = (tags as string).split(',');
      if (textSearch) filters.textSearch = textSearch as string;

      const pageNum = parseInt(page as string);
      const pageSize = parseInt(limit as string);
      const offset = (pageNum - 1) * pageSize;

      const result = await this.documentService.searchDocuments(filters, pageSize, offset);

      res.json({
        success: true,
        data: {
          documents: result.documents,
          pagination: {
            page: pageNum,
            limit: pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / pageSize),
          },
        },
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search documents',
      });
    }
  };

  /**
   * Delete document
   */
  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.documentService.deleteDocument(documentId, userId, reason);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      if (error instanceof Error && error.message === 'Permission denied') {
        res.status(403).json({
          success: false,
          error: 'Permission denied',
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete document',
        });
      }
    }
  };

  /**
   * Get document versions
   */
  getDocumentVersions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;

      const versions = await this.documentService.getDocumentVersions(documentId);

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      console.error('Error getting document versions:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document versions',
      });
    }
  };

  /**
   * Get documents by entity
   */
  getDocumentsByEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const { category, status } = req.query;

      const filters: any = {
        entityType,
        entityId: parseInt(entityId),
      };

      if (category) filters.category = category as string;
      if (status) filters.status = status as string;

      const result = await this.documentService.searchDocuments(filters);

      res.json({
        success: true,
        data: result.documents,
      });
    } catch (error) {
      console.error('Error getting documents by entity:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents by entity',
      });
    }
  };

  /**
   * Get pending approvals
   */
  getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { category, entityType } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const filters: any = {
        status: 'pending',
      };

      if (category) filters.category = category as string;
      if (entityType) filters.entityType = entityType as string;

      const result = await this.documentService.searchDocuments(filters);

      // Filter documents that require approval from this user
      // In a real implementation, this would check user roles and approval workflows
      const pendingDocuments = result.documents.filter(doc => 
        doc.requiresApproval && doc.status === 'pending'
      );

      res.json({
        success: true,
        data: pendingDocuments,
      });
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pending approvals',
      });
    }
  };

  /**
   * Bulk approve documents
   */
  bulkApproveDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentIds, decision, comments } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Document IDs array is required',
        });
        return;
      }

      if (!decision || !['approve', 'reject'].includes(decision)) {
        res.status(400).json({
          success: false,
          error: 'Decision must be either "approve" or "reject"',
        });
        return;
      }

      const results = [];

      for (const documentId of documentIds) {
        try {
          const document = await this.documentService.approveDocument({
            documentId,
            approvedBy: userId,
            decision,
            comments,
          });
          
          results.push({
            documentId,
            success: true,
            data: document,
          });
        } catch (error) {
          results.push({
            documentId,
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process document',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        message: `Bulk ${decision} completed: ${successCount} processed, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: documentIds.length,
            processed: successCount,
            failed: failureCount,
          },
        },
      });
    } catch (error) {
      console.error('Error in bulk approve documents:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk process documents',
      });
    }
  };

  /**
   * Get document statistics
   */
  getDocumentStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entityType, entityId, dateFrom, dateTo } = req.query;

      const filters: any = {};
      if (entityType) filters.entityType = entityType as string;
      if (entityId) filters.entityId = parseInt(entityId as string);
      if (dateFrom) filters.uploadDateFrom = new Date(dateFrom as string);
      if (dateTo) filters.uploadDateTo = new Date(dateTo as string);

      const result = await this.documentService.searchDocuments(filters, 1000); // Get more documents for stats

      const stats = {
        total: result.total,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byAccessLevel: {} as Record<string, number>,
        totalSize: 0,
        averageSize: 0,
        pendingApprovals: 0,
        recentUploads: 0, // Last 7 days
      };

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      result.documents.forEach(doc => {
        // Count by category
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
        
        // Count by status
        stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        
        // Count by access level
        stats.byAccessLevel[doc.accessLevel] = (stats.byAccessLevel[doc.accessLevel] || 0) + 1;

        // Sum sizes
        stats.totalSize += doc.size;

        // Count pending approvals
        if (doc.status === 'pending') {
          stats.pendingApprovals++;
        }

        // Count recent uploads
        if (doc.uploadDate > sevenDaysAgo) {
          stats.recentUploads++;
        }
      });

      stats.averageSize = result.total > 0 ? stats.totalSize / result.total : 0;

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting document statistics:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document statistics',
      });
    }
  };
}

export default DocumentController;