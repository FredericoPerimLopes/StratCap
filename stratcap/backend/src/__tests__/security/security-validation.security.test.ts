import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, teardownTestDatabase } from '../setup/database';

describe('Security Validation Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login endpoint', async () => {
      const sqlInjectionPayloads = [
        "admin'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM users --",
        "'; SELECT * FROM users WHERE 'a'='a",
        "admin' OR 1=1 /*"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'password'
          });

        // Should not return 200 or leak database information
        expect(response.status).not.toBe(200);
        expect(response.body).not.toHaveProperty('users');
        expect(response.body).not.toHaveProperty('password');
      }
    });

    it('should prevent SQL injection in search endpoints', async () => {
      const token = await getAuthToken();
      
      const sqlInjectionPayloads = [
        "'; DROP TABLE funds; --",
        "test' OR 1=1 --",
        "test' UNION SELECT password FROM users --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/funds/search')
          .query({ q: payload })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBeLessThan(500);
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('users');
      }
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS payloads in fund creation', async () => {
      const token = await getAuthToken();
      
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/funds')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: payload,
            fundType: 'Private Equity',
            targetSize: 100000000,
            vintage: 2024
          });

        if (response.status === 201) {
          // If fund was created, name should be sanitized
          expect(response.body.name).not.toContain('<script>');
          expect(response.body.name).not.toContain('javascript:');
          expect(response.body.name).not.toContain('onerror');
          expect(response.body.name).not.toContain('onload');
        }
      }
    });

    it('should prevent XSS in investor comments', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .post('/api/investors/1/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          note: '<script>alert("xss")</script>Legitimate note content'
        });

      if (response.status === 201) {
        expect(response.body.note).not.toContain('<script>');
        expect(response.body.note).toContain('Legitimate note content');
      }
    });
  });

  describe('Authentication Security', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const attempts = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(attempts);
      
      // Last few requests should be rate limited
      const rateLimitedResponses = responses.slice(-3);
      expect(rateLimitedResponses.some(r => r.status === 429)).toBe(true);
    });

    it('should prevent timing attacks on login', async () => {
      const startTime1 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        });
      const endTime1 = Date.now();
      const duration1 = endTime1 - startTime1;

      const startTime2 = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@stratcap.com',
          password: 'wrongpassword'
        });
      const endTime2 = Date.now();
      const duration2 = endTime2 - startTime2;

      // Timing difference should be minimal (< 100ms)
      expect(Math.abs(duration1 - duration2)).toBeLessThan(100);
    });

    it('should invalidate tokens on logout', async () => {
      const token = await getAuthToken();
      
      // Use token for authenticated request
      let response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use same token
      response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(401);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent privilege escalation', async () => {
      const userToken = await getAuthToken('user@example.com', 'password');
      
      // Try to access admin-only endpoint
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should prevent horizontal privilege escalation', async () => {
      const user1Token = await getAuthToken('user1@example.com', 'password');
      
      // Try to access another user's data
      const response = await request(app)
        .get('/api/investors/999') // Assuming this belongs to another user
        .set('Authorization', `Bearer ${user1Token}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should validate resource ownership', async () => {
      const token = await getAuthToken();
      
      // Create a fund
      const createResponse = await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Fund',
          fundType: 'Private Equity',
          targetSize: 100000000,
          vintage: 2024
        });

      const fundId = createResponse.body.id;

      // Try to access with different user token
      const otherToken = await getAuthToken('other@example.com', 'password');
      
      const response = await request(app)
        .put(`/api/funds/${fundId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Hacked Fund Name'
        });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Input Validation Security', () => {
    it('should validate file upload types', async () => {
      const token = await getAuthToken();
      
      // Try to upload executable file
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('#!/bin/bash\necho "hack"'), {
          filename: 'malicious.sh',
          contentType: 'application/x-sh'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('file type');
    });

    it('should enforce file size limits', async () => {
      const token = await getAuthToken();
      
      // Create large file (> 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', largeBuffer, {
          filename: 'large.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('file size');
    });

    it('should validate financial amounts', async () => {
      const token = await getAuthToken();
      
      const maliciousAmounts = [
        'Infinity',
        'NaN',
        '1e+308',
        '-1e+308',
        '../../etc/passwd',
        '<script>alert("xss")</script>'
      ];

      for (const amount of maliciousAmounts) {
        const response = await request(app)
          .post('/api/funds')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Fund',
            fundType: 'Private Equity',
            targetSize: amount,
            vintage: 2024
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid|amount|number/i);
      }
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should prevent MIME sniffing', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      const token = await getAuthToken();
      
      // Try POST without CSRF token
      const response = await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Fund',
          fundType: 'Private Equity',
          targetSize: 100000000,
          vintage: 2024
        });

      // Should reject without CSRF token
      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });

    it('should accept valid CSRF token', async () => {
      const token = await getAuthToken();
      
      // Get CSRF token
      const csrfResponse = await request(app)
        .get('/api/auth/csrf-token')
        .set('Authorization', `Bearer ${token}`);
      
      const csrfToken = csrfResponse.body.csrfToken;

      // Use CSRF token in request
      const response = await request(app)
        .post('/api/funds')
        .set('Authorization', `Bearer ${token}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Test Fund',
          fundType: 'Private Equity',
          targetSize: 100000000,
          vintage: 2024
        });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Sensitive Data Exposure', () => {
    it('should not expose passwords in responses', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200) {
        const users = response.body;
        users.forEach((user: any) => {
          expect(user).not.toHaveProperty('password');
          expect(user).not.toHaveProperty('passwordHash');
        });
      }
    });

    it('should not expose sensitive investor data to unauthorized users', async () => {
      const userToken = await getAuthToken('user@example.com', 'password');
      
      const response = await request(app)
        .get('/api/investors/1')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.status === 200) {
        expect(response.body).not.toHaveProperty('taxId');
        expect(response.body).not.toHaveProperty('ssn');
        expect(response.body).not.toHaveProperty('bankAccount');
      }
    });
  });

  describe('API Security', () => {
    it('should validate API version', async () => {
      const response = await request(app)
        .get('/api/v999/funds'); // Invalid version

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": '); // Malformed JSON

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid json|parse error/i);
    });

    it('should prevent XXE attacks', async () => {
      const xmlPayload = `<?xml version="1.0" encoding="ISO-8859-1"?>
        <!DOCTYPE foo [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <fund>
          <name>&xxe;</name>
        </fund>`;

      const response = await request(app)
        .post('/api/funds/import')
        .set('Content-Type', 'application/xml')
        .send(xmlPayload);

      expect(response.status).toBe(400);
      // Should not contain file contents
      expect(response.body).not.toMatch(/root:|bin:|daemon:/);
    });
  });

  // Helper function to get authentication token
  async function getAuthToken(email = 'admin@stratcap.com', password = 'AdminPassword123!'): Promise<string> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Failed to get auth token: ${response.status} ${response.text}`);
    }

    return response.body.token;
  }
});