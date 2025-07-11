import { Op } from 'sequelize';
import User from '../models/User';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  category: 'kyc' | 'aml' | 'legal' | 'closing' | 'transfer' | 'compliance' | 'financial' | 'other';
  size: number;
  mimeType: string;
  uploadDate: Date;
  uploadedBy: number;
  entityType: 'fund' | 'investor' | 'commitment' | 'closing' | 'transfer' | 'transaction';
  entityId: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'archived';
  version: number;
  parentDocumentId?: string;
  
  // File storage information
  storageProvider: 'local' | 'aws_s3' | 'azure_blob' | 'google_cloud';
  storagePath: string;
  storageMetadata?: Record<string, any>;
  
  // Security and access
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  encryptionKey?: string;
  checksum: string;
  
  // Workflow and approval
  requiresApproval: boolean;
  approvalWorkflow?: {
    steps: Array<{
      stepNumber: number;
      approverRole: string;
      approvedBy?: number;
      approvedAt?: Date;
      status: 'pending' | 'approved' | 'rejected';
      comments?: string;
    }>;
    currentStep: number;
    finalStatus?: 'approved' | 'rejected';
  };
  
  // Compliance and retention
  retentionPeriod?: number; // days
  expiryDate?: Date;
  complianceFlags?: string[];
  auditTrail: Array<{
    action: string;
    performedBy: number;
    timestamp: Date;
    details?: Record<string, any>;
  }>;
  
  // OCR and content analysis
  extractedText?: string;
  extractedData?: Record<string, any>;
  contentAnalysis?: {
    documentType: string;
    confidence: number;
    keyFields: Record<string, any>;
    validationErrors?: string[];
  };
  
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploadRequest {
  file: Buffer | string; // File content or file path
  name: string;
  category: Document['category'];
  entityType: Document['entityType'];
  entityId: number;
  uploadedBy: number;
  accessLevel?: Document['accessLevel'];
  requiresApproval?: boolean;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSearchFilters {
  category?: string;
  entityType?: string;
  entityId?: number;
  status?: string;
  uploadedBy?: number;
  uploadDateFrom?: Date;
  uploadDateTo?: Date;
  tags?: string[];
  textSearch?: string;
}

export interface DocumentApprovalRequest {
  documentId: string;
  approvedBy: number;
  decision: 'approve' | 'reject';
  comments?: string;
}

export interface DocumentVersionInfo {
  documentId: string;
  versions: Array<{
    version: number;
    uploadDate: Date;
    uploadedBy: number;
    size: number;
    changes: string;
    isCurrentVersion: boolean;
  }>;
}

class DocumentService {
  private readonly SUPPORTED_MIME_TYPES = [
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

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly STORAGE_PROVIDER = process.env.DOCUMENT_STORAGE_PROVIDER || 'local';
  private readonly STORAGE_PATH = process.env.DOCUMENT_STORAGE_PATH || './uploads/documents';

  /**
   * Upload a new document
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<Document> {
    // Validate file
    await this.validateFile(request);

    // Generate document ID
    const documentId = this.generateDocumentId();

    // Determine file info
    const fileInfo = await this.getFileInfo(request.file, request.name);

    // Store file
    const storageInfo = await this.storeFile(documentId, request.file, fileInfo);

    // Create document record
    const document: Document = {
      id: documentId,
      name: request.name,
      originalName: fileInfo.originalName,
      type: fileInfo.extension,
      category: request.category,
      size: fileInfo.size,
      mimeType: fileInfo.mimeType,
      uploadDate: new Date(),
      uploadedBy: request.uploadedBy,
      entityType: request.entityType,
      entityId: request.entityId,
      status: request.requiresApproval ? 'pending' : 'approved',
      version: 1,
      storageProvider: this.STORAGE_PROVIDER as Document['storageProvider'],
      storagePath: storageInfo.path,
      storageMetadata: storageInfo.metadata,
      accessLevel: request.accessLevel || 'internal',
      checksum: storageInfo.checksum,
      requiresApproval: request.requiresApproval || false,
      auditTrail: [{
        action: 'document_uploaded',
        performedBy: request.uploadedBy,
        timestamp: new Date(),
        details: {
          originalName: fileInfo.originalName,
          size: fileInfo.size,
          category: request.category,
        },
      }],
      tags: request.tags || [],
      notes: request.notes,
      metadata: request.metadata || {},
    };

    // Set up approval workflow if required
    if (request.requiresApproval) {
      document.approvalWorkflow = await this.createApprovalWorkflow(document);
    }

    // Extract content for searchability
    try {
      const extractedContent = await this.extractDocumentContent(storageInfo.path, fileInfo.mimeType);
      document.extractedText = extractedContent.text;
      document.extractedData = extractedContent.data;
      document.contentAnalysis = extractedContent.analysis;
    } catch (error) {
      console.warn('Failed to extract document content:', error);
    }

    // Save document metadata (in a real implementation, this would save to database)
    await this.saveDocumentMetadata(document);

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId?: number): Promise<Document | null> {
    const document = await this.loadDocumentMetadata(documentId);
    
    if (!document) {
      return null;
    }

    // Check access permissions
    if (userId && !await this.checkDocumentAccess(document, userId)) {
      throw new Error('Access denied');
    }

    return document;
  }

  /**
   * Download document content
   */
  async downloadDocument(documentId: string, userId: number): Promise<{ content: Buffer; document: Document }> {
    const document = await this.getDocument(documentId, userId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    if (!await this.checkDocumentAccess(document, userId)) {
      throw new Error('Access denied');
    }

    const content = await this.retrieveFileContent(document.storagePath);

    // Log access
    await this.logDocumentAccess(documentId, userId, 'download');

    return { content, document };
  }

  /**
   * Update document version
   */
  async updateDocumentVersion(
    documentId: string,
    file: Buffer | string,
    updatedBy: number,
    changes: string
  ): Promise<Document> {
    const existingDocument = await this.getDocument(documentId);
    
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    // Validate file
    const fileInfo = await this.getFileInfo(file, existingDocument.name);
    await this.validateFile({
      file,
      name: existingDocument.name,
      category: existingDocument.category,
      entityType: existingDocument.entityType,
      entityId: existingDocument.entityId,
      uploadedBy: updatedBy,
    });

    // Store new version
    const newVersion = existingDocument.version + 1;
    const versionedDocumentId = `${documentId}_v${newVersion}`;
    const storageInfo = await this.storeFile(versionedDocumentId, file, fileInfo);

    // Update document
    const updatedDocument: Document = {
      ...existingDocument,
      version: newVersion,
      size: fileInfo.size,
      uploadDate: new Date(),
      uploadedBy: updatedBy,
      storagePath: storageInfo.path,
      checksum: storageInfo.checksum,
      status: existingDocument.requiresApproval ? 'pending' : 'approved',
      parentDocumentId: documentId,
      auditTrail: [
        ...existingDocument.auditTrail,
        {
          action: 'document_version_updated',
          performedBy: updatedBy,
          timestamp: new Date(),
          details: {
            newVersion,
            changes,
            size: fileInfo.size,
          },
        },
      ],
    };

    // Extract content for new version
    try {
      const extractedContent = await this.extractDocumentContent(storageInfo.path, fileInfo.mimeType);
      updatedDocument.extractedText = extractedContent.text;
      updatedDocument.extractedData = extractedContent.data;
      updatedDocument.contentAnalysis = extractedContent.analysis;
    } catch (error) {
      console.warn('Failed to extract document content for new version:', error);
    }

    await this.saveDocumentMetadata(updatedDocument);

    return updatedDocument;
  }

  /**
   * Approve or reject document
   */
  async approveDocument(request: DocumentApprovalRequest): Promise<Document> {
    const document = await this.getDocument(request.documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.requiresApproval) {
      throw new Error('Document does not require approval');
    }

    if (!document.approvalWorkflow) {
      throw new Error('No approval workflow found');
    }

    const currentStep = document.approvalWorkflow.currentStep;
    const workflow = document.approvalWorkflow;

    // Update current step
    const stepIndex = workflow.steps.findIndex(s => s.stepNumber === currentStep);
    if (stepIndex === -1) {
      throw new Error('Invalid workflow step');
    }

    workflow.steps[stepIndex] = {
      ...workflow.steps[stepIndex],
      approvedBy: request.approvedBy,
      approvedAt: new Date(),
      status: request.decision === 'approve' ? 'approved' : 'rejected',
      comments: request.comments,
    };

    // Determine next step or final status
    if (request.decision === 'reject') {
      workflow.finalStatus = 'rejected';
      document.status = 'rejected';
    } else if (currentStep === workflow.steps.length) {
      // Last step approved
      workflow.finalStatus = 'approved';
      document.status = 'approved';
    } else {
      // Move to next step
      workflow.currentStep = currentStep + 1;
    }

    document.approvalWorkflow = workflow;
    document.auditTrail.push({
      action: request.decision === 'approve' ? 'document_approved' : 'document_rejected',
      performedBy: request.approvedBy,
      timestamp: new Date(),
      details: {
        step: currentStep,
        comments: request.comments,
      },
    });

    await this.saveDocumentMetadata(document);

    return document;
  }

  /**
   * Search documents
   */
  async searchDocuments(
    filters: DocumentSearchFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ documents: Document[]; total: number }> {
    // In a real implementation, this would query the database
    // For now, we'll return a placeholder implementation
    
    const allDocuments = await this.getAllDocuments();
    let filteredDocuments = allDocuments;

    // Apply filters
    if (filters.category) {
      filteredDocuments = filteredDocuments.filter(d => d.category === filters.category);
    }

    if (filters.entityType) {
      filteredDocuments = filteredDocuments.filter(d => d.entityType === filters.entityType);
    }

    if (filters.entityId) {
      filteredDocuments = filteredDocuments.filter(d => d.entityId === filters.entityId);
    }

    if (filters.status) {
      filteredDocuments = filteredDocuments.filter(d => d.status === filters.status);
    }

    if (filters.uploadedBy) {
      filteredDocuments = filteredDocuments.filter(d => d.uploadedBy === filters.uploadedBy);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredDocuments = filteredDocuments.filter(d => 
        filters.tags!.some(tag => d.tags?.includes(tag))
      );
    }

    if (filters.textSearch) {
      const searchTerm = filters.textSearch.toLowerCase();
      filteredDocuments = filteredDocuments.filter(d => 
        d.name.toLowerCase().includes(searchTerm) ||
        d.extractedText?.toLowerCase().includes(searchTerm) ||
        d.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply date filters
    if (filters.uploadDateFrom) {
      filteredDocuments = filteredDocuments.filter(d => d.uploadDate >= filters.uploadDateFrom!);
    }

    if (filters.uploadDateTo) {
      filteredDocuments = filteredDocuments.filter(d => d.uploadDate <= filters.uploadDateTo!);
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    // Apply pagination
    const total = filteredDocuments.length;
    const documents = filteredDocuments.slice(offset, offset + limit);

    return { documents, total };
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, deletedBy: number, reason?: string): Promise<void> {
    const document = await this.getDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user can delete
    if (!await this.checkDocumentDeletePermission(document, deletedBy)) {
      throw new Error('Permission denied');
    }

    // Soft delete by archiving
    document.status = 'archived';
    document.auditTrail.push({
      action: 'document_deleted',
      performedBy: deletedBy,
      timestamp: new Date(),
      details: { reason },
    });

    await this.saveDocumentMetadata(document);

    // Optionally, move file to archive storage
    await this.archiveFile(document.storagePath);
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string): Promise<DocumentVersionInfo> {
    const documents = await this.getDocumentHistory(documentId);
    
    const versions = documents.map(doc => ({
      version: doc.version,
      uploadDate: doc.uploadDate,
      uploadedBy: doc.uploadedBy,
      size: doc.size,
      changes: doc.metadata?.changes || 'No changes specified',
      isCurrentVersion: doc.version === Math.max(...documents.map(d => d.version)),
    }));

    return {
      documentId,
      versions: versions.sort((a, b) => b.version - a.version),
    };
  }

  /**
   * Validate file before upload
   */
  private async validateFile(request: DocumentUploadRequest): Promise<void> {
    const fileInfo = await this.getFileInfo(request.file, request.name);

    // Check file size
    if (fileInfo.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.SUPPORTED_MIME_TYPES.includes(fileInfo.mimeType)) {
      throw new Error(`Unsupported file type: ${fileInfo.mimeType}`);
    }

    // Check for malicious content (basic validation)
    if (await this.containsMaliciousContent(request.file)) {
      throw new Error('File contains potentially malicious content');
    }
  }

  /**
   * Get file information
   */
  private async getFileInfo(file: Buffer | string, name: string): Promise<{
    originalName: string;
    extension: string;
    size: number;
    mimeType: string;
  }> {
    const originalName = name;
    const extension = name.split('.').pop()?.toLowerCase() || '';
    
    let size: number;
    let mimeType: string;

    if (Buffer.isBuffer(file)) {
      size = file.length;
      mimeType = this.getMimeTypeFromExtension(extension);
    } else {
      // File path
      const fs = require('fs').promises;
      const stats = await fs.stat(file);
      size = stats.size;
      mimeType = this.getMimeTypeFromExtension(extension);
    }

    return { originalName, extension, size, mimeType };
  }

  /**
   * Store file to storage provider
   */
  private async storeFile(
    documentId: string,
    file: Buffer | string,
    fileInfo: any
  ): Promise<{ path: string; checksum: string; metadata?: Record<string, any> }> {
    const crypto = require('crypto');
    
    let content: Buffer;
    if (Buffer.isBuffer(file)) {
      content = file;
    } else {
      const fs = require('fs').promises;
      content = await fs.readFile(file);
    }

    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const path = `${this.STORAGE_PATH}/${documentId}.${fileInfo.extension}`;

    // Store file based on provider
    switch (this.STORAGE_PROVIDER) {
      case 'local':
        await this.storeFileLocally(path, content);
        break;
      case 'aws_s3':
        await this.storeFileS3(path, content);
        break;
      default:
        throw new Error(`Unsupported storage provider: ${this.STORAGE_PROVIDER}`);
    }

    return {
      path,
      checksum,
      metadata: {
        storageProvider: this.STORAGE_PROVIDER,
        storedAt: new Date(),
      },
    };
  }

  /**
   * Store file locally
   */
  private async storeFileLocally(path: string, content: Buffer): Promise<void> {
    const fs = require('fs').promises;
    const nodePath = require('path');
    
    // Ensure directory exists
    await fs.mkdir(nodePath.dirname(path), { recursive: true });
    
    // Write file
    await fs.writeFile(path, content);
  }

  /**
   * Store file in AWS S3 (placeholder implementation)
   */
  private async storeFileS3(path: string, content: Buffer): Promise<void> {
    // This would use AWS SDK to store in S3
    throw new Error('S3 storage not implemented in this example');
  }

  /**
   * Extract document content for searchability
   */
  private async extractDocumentContent(
    filePath: string,
    mimeType: string
  ): Promise<{ text: string; data: Record<string, any>; analysis: any }> {
    // This would use OCR and document parsing libraries
    // For now, return placeholder data
    
    return {
      text: 'Sample extracted text content',
      data: {
        documentType: 'unknown',
        extractedFields: {},
      },
      analysis: {
        documentType: 'unknown',
        confidence: 0.5,
        keyFields: {},
      },
    };
  }

  /**
   * Create approval workflow
   */
  private async createApprovalWorkflow(document: Document): Promise<Document['approvalWorkflow']> {
    // Define workflow based on document category and access level
    const steps = [];

    if (document.category === 'legal' || document.accessLevel === 'restricted') {
      steps.push({
        stepNumber: 1,
        approverRole: 'legal_counsel',
        status: 'pending' as const,
      });
    }

    steps.push({
      stepNumber: steps.length + 1,
      approverRole: 'fund_manager',
      status: 'pending' as const,
    });

    return {
      steps,
      currentStep: 1,
    };
  }

  /**
   * Check document access permissions
   */
  private async checkDocumentAccess(document: Document, userId: number): Promise<boolean> {
    // In a real implementation, this would check user roles and permissions
    // For now, return true for internal and public documents
    return ['public', 'internal'].includes(document.accessLevel);
  }

  /**
   * Check document delete permissions
   */
  private async checkDocumentDeletePermission(document: Document, userId: number): Promise<boolean> {
    // Only allow deletion by uploader or admins
    return document.uploadedBy === userId; // Simplified check
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      tiff: 'image/tiff',
      txt: 'text/plain',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Check for malicious content (basic implementation)
   */
  private async containsMaliciousContent(file: Buffer | string): Promise<boolean> {
    // Basic check for potentially dangerous patterns
    // In production, this would use proper security scanning
    return false;
  }

  /**
   * Retrieve file content from storage
   */
  private async retrieveFileContent(storagePath: string): Promise<Buffer> {
    const fs = require('fs').promises;
    return await fs.readFile(storagePath);
  }

  /**
   * Log document access
   */
  private async logDocumentAccess(documentId: string, userId: number, action: string): Promise<void> {
    // This would log to audit trail or analytics system
    console.log(`Document ${documentId} accessed by user ${userId} - action: ${action}`);
  }

  /**
   * Archive file
   */
  private async archiveFile(storagePath: string): Promise<void> {
    // Move file to archive location or mark for deletion
    console.log(`Archiving file: ${storagePath}`);
  }

  // Placeholder methods for database operations
  private async saveDocumentMetadata(document: Document): Promise<void> {
    // Save to database
    console.log(`Saving document metadata: ${document.id}`);
  }

  private async loadDocumentMetadata(documentId: string): Promise<Document | null> {
    // Load from database
    console.log(`Loading document metadata: ${documentId}`);
    return null; // Placeholder
  }

  private async getAllDocuments(): Promise<Document[]> {
    // Load all documents from database
    return []; // Placeholder
  }

  private async getDocumentHistory(documentId: string): Promise<Document[]> {
    // Get all versions of a document
    return []; // Placeholder
  }
}

export default DocumentService;