import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../stratcap/backend/src/app';
import { sequelize } from '../../stratcap/backend/src/models';
import { createTestUser } from '../helpers/testData';

describe('Document Management API Endpoints', () => {
  let authToken: string;
  let testDocumentId: number;
  let testFolderId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    const testUser = await createTestUser();
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!'
      });
    authToken = authResponse.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Document Upload and Management', () => {
    describe('POST /api/documents/upload', () => {
      it('should upload a document successfully', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, '../fixtures/test-document.pdf');
        const testContent = Buffer.from('Test PDF content');
        fs.writeFileSync(testFilePath, testContent);

        const response = await request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
          .field('name', 'Test Document')
          .field('description', 'A test document for API testing')
          .field('category', 'legal')
          .field('entityType', 'fund')
          .field('entityId', '1')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Document');
        expect(response.body.data.category).toBe('legal');
        expect(response.body.data.fileSize).toBeGreaterThan(0);
        testDocumentId = response.body.data.id;

        // Cleanup
        fs.unlinkSync(testFilePath);
      });

      it('should validate file type restrictions', async () => {
        const testFilePath = path.join(__dirname, '../fixtures/test-executable.exe');
        fs.writeFileSync(testFilePath, Buffer.from('Invalid file type'));

        const response = await request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
          .field('name', 'Invalid File')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('file type');

        fs.unlinkSync(testFilePath);
      });

      it('should validate file size limits', async () => {
        const testFilePath = path.join(__dirname, '../fixtures/large-file.pdf');
        const largeContent = Buffer.alloc(20 * 1024 * 1024, 'x'); // 20MB
        fs.writeFileSync(testFilePath, largeContent);

        const response = await request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
          .field('name', 'Large File')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('file size');

        fs.unlinkSync(testFilePath);
      });
    });

    describe('GET /api/documents', () => {
      it('should return paginated documents', async () => {
        const response = await request(app)
          .get('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter documents by category', async () => {
        const response = await request(app)
          .get('/api/documents?category=legal')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((doc: any) => {
          expect(doc.category).toBe('legal');
        });
      });

      it('should search documents by name', async () => {
        const response = await request(app)
          .get('/api/documents?search=Test')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((doc: any) => {
          expect(doc.name.toLowerCase()).toContain('test');
        });
      });
    });

    describe('GET /api/documents/:id', () => {
      it('should return specific document details', async () => {
        const response = await request(app)
          .get(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testDocumentId);
        expect(response.body.data.name).toBe('Test Document');
      });

      it('should return 404 for non-existent document', async () => {
        const response = await request(app)
          .get('/api/documents/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/documents/:id', () => {
      it('should update document metadata', async () => {
        const updateData = {
          name: 'Updated Test Document',
          description: 'Updated description',
          tags: ['updated', 'test']
        };

        const response = await request(app)
          .patch(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.tags).toEqual(updateData.tags);
      });
    });

    describe('GET /api/documents/:id/download', () => {
      it('should download document file', async () => {
        const response = await request(app)
          .get(`/api/documents/${testDocumentId}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toContain('attachment');
      });
    });
  });

  describe('Folder Management', () => {
    describe('POST /api/documents/folders', () => {
      it('should create a new folder', async () => {
        const folderData = {
          name: 'Legal Documents',
          description: 'Folder for legal documentation'
        };

        const response = await request(app)
          .post('/api/documents/folders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(folderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(folderData.name);
        testFolderId = response.body.data.id;
      });

      it('should create nested folders', async () => {
        const nestedFolderData = {
          name: 'Contracts',
          description: 'Contract documents',
          parentId: testFolderId
        };

        const response = await request(app)
          .post('/api/documents/folders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(nestedFolderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.parentId).toBe(testFolderId);
      });
    });

    describe('GET /api/documents/folders', () => {
      it('should return root folders', async () => {
        const response = await request(app)
          .get('/api/documents/folders')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should return child folders', async () => {
        const response = await request(app)
          .get(`/api/documents/folders?parentId=${testFolderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((folder: any) => {
          expect(folder.parentId).toBe(testFolderId);
        });
      });
    });

    describe('PATCH /api/documents/:id/move', () => {
      it('should move document to folder', async () => {
        const response = await request(app)
          .patch(`/api/documents/${testDocumentId}/move`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ folderId: testFolderId })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Document Sharing and Permissions', () => {
    describe('POST /api/documents/:id/share', () => {
      it('should share document with users', async () => {
        const shareData = {
          recipientEmails: ['user1@example.com', 'user2@example.com'],
          permissions: ['read', 'download'],
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post(`/api/documents/${testDocumentId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(shareData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.recipients).toEqual(shareData.recipientEmails);
      });
    });

    describe('GET /api/documents/shared', () => {
      it('should return documents shared with user', async () => {
        const response = await request(app)
          .get('/api/documents/shared')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('Document Versioning', () => {
    let testVersionId: number;

    describe('POST /api/documents/:id/versions', () => {
      it('should create a new document version', async () => {
        const testFilePath = path.join(__dirname, '../fixtures/test-document-v2.pdf');
        const testContent = Buffer.from('Updated PDF content');
        fs.writeFileSync(testFilePath, testContent);

        const response = await request(app)
          .post(`/api/documents/${testDocumentId}/versions`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.version).toBeGreaterThan(1);
        testVersionId = response.body.data.id;

        fs.unlinkSync(testFilePath);
      });
    });

    describe('GET /api/documents/:id/versions', () => {
      it('should return document version history', async () => {
        const response = await request(app)
          .get(`/api/documents/${testDocumentId}/versions`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Document Search', () => {
    describe('GET /api/documents/search', () => {
      it('should search documents by content', async () => {
        const response = await request(app)
          .get('/api/documents/search?query=test')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should filter search results', async () => {
        const response = await request(app)
          .get('/api/documents/search')
          .query({
            query: 'document',
            category: 'legal',
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Metadata Extraction', () => {
    describe('POST /api/documents/:id/extract-metadata', () => {
      it('should extract document metadata', async () => {
        const response = await request(app)
          .post(`/api/documents/${testDocumentId}/extract-metadata`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.metadata).toBeDefined();
      });
    });
  });

  describe('Error Handling and Security', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent path traversal attacks', async () => {
      const response = await request(app)
        .get('/api/documents/../../etc/passwd')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate file upload permissions', async () => {
      // Test with restricted file type
      const testFilePath = path.join(__dirname, '../fixtures/malicious.js');
      fs.writeFileSync(testFilePath, 'console.log("malicious code");');

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .field('name', 'Malicious File')
        .expect(400);

      expect(response.body.success).toBe(false);
      fs.unlinkSync(testFilePath);
    });

    it('should prevent unauthorized access to documents', async () => {
      // Create a second user
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const authResponse2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: user2.email,
          password: 'TestPassword123!'
        });
      const user2Token = authResponse2.body.data.token;

      // Try to access first user's document
      const response = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance and Limits', () => {
    it('should handle concurrent uploads', async () => {
      const uploadPromises = Array.from({ length: 5 }, (_, i) => {
        const testFilePath = path.join(__dirname, `../fixtures/concurrent-test-${i}.pdf`);
        fs.writeFileSync(testFilePath, Buffer.from(`Test content ${i}`));

        return request(app)
          .post('/api/documents/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFilePath)
          .field('name', `Concurrent Test ${i}`)
          .then(response => {
            fs.unlinkSync(testFilePath);
            return response;
          });
      });

      const responses = await Promise.all(uploadPromises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should respect rate limiting', async () => {
      // Make rapid requests to test rate limiting
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Operations', () => {
    describe('DELETE /api/documents/:id', () => {
      it('should soft delete document', async () => {
        const response = await request(app)
          .delete(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify document is marked as deleted but still accessible for recovery
        const deletedDoc = await request(app)
          .get(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(deletedDoc.body.data.isDeleted).toBe(true);
      });
    });
  });
});