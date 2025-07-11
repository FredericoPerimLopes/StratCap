import request from 'supertest';
import app from '../src/app';
import { User, FundFamily } from '../src/models';

describe('Fund Family Endpoints', () => {
  let authToken: string;
  let user: User;

  beforeEach(async () => {
    // Clean up tables
    await FundFamily.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create and authenticate a user
    user = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/fund-families', () => {
    const validFundFamilyData = {
      name: 'Test Fund Family',
      code: 'TFF',
      managementCompany: 'Test Management Co',
      primaryCurrency: 'USD',
      fiscalYearEnd: '12-31',
    };

    it('should create a new fund family successfully', async () => {
      const response = await request(app)
        .post('/api/fund-families')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validFundFamilyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validFundFamilyData.name);
      expect(response.body.data.code).toBe(validFundFamilyData.code);
      expect(response.body.data.managementCompany).toBe(validFundFamilyData.managementCompany);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = { name: 'Test Fund Family' };

      const response = await request(app)
        .post('/api/fund-families')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/fund-families')
        .send(validFundFamilyData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized role', async () => {
      // Create a viewer user
      const viewerUser = await User.create({
        email: 'viewer@example.com',
        password: 'password123',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'viewer',
      });

      const viewerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'viewer@example.com',
          password: 'password123',
        });

      const viewerToken = viewerLoginResponse.body.data.token;

      const response = await request(app)
        .post('/api/fund-families')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validFundFamilyData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });
  });

  describe('GET /api/fund-families', () => {
    beforeEach(async () => {
      // Create test fund families
      await FundFamily.bulkCreate([
        {
          name: 'Fund Family 1',
          code: 'FF1',
          managementCompany: 'Management Co 1',
          primaryCurrency: 'USD',
          fiscalYearEnd: '12-31',
        },
        {
          name: 'Fund Family 2',
          code: 'FF2',
          managementCompany: 'Management Co 2',
          primaryCurrency: 'EUR',
          fiscalYearEnd: '12-31',
        },
      ]);
    });

    it('should return list of fund families', async () => {
      const response = await request(app)
        .get('/api/fund-families')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter fund families by search term', async () => {
      const response = await request(app)
        .get('/api/fund-families?search=Family 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Fund Family 1');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/fund-families?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/fund-families/:id', () => {
    let fundFamily: FundFamily;

    beforeEach(async () => {
      fundFamily = await FundFamily.create({
        name: 'Test Fund Family',
        code: 'TFF',
        managementCompany: 'Test Management Co',
        primaryCurrency: 'USD',
        fiscalYearEnd: '12-31',
      });
    });

    it('should return fund family by id', async () => {
      const response = await request(app)
        .get(`/api/fund-families/${fundFamily.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(fundFamily.id);
      expect(response.body.data.name).toBe(fundFamily.name);
    });

    it('should return 404 for non-existent fund family', async () => {
      const response = await request(app)
        .get('/api/fund-families/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/fund-families/:id', () => {
    let fundFamily: FundFamily;

    beforeEach(async () => {
      fundFamily = await FundFamily.create({
        name: 'Test Fund Family',
        code: 'TFF',
        managementCompany: 'Test Management Co',
        primaryCurrency: 'USD',
        fiscalYearEnd: '12-31',
      });
    });

    it('should update fund family successfully', async () => {
      const updateData = {
        name: 'Updated Fund Family',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/fund-families/${fundFamily.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent fund family', async () => {
      const response = await request(app)
        .patch('/api/fund-families/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/fund-families/:id', () => {
    let fundFamily: FundFamily;

    beforeEach(async () => {
      fundFamily = await FundFamily.create({
        name: 'Test Fund Family',
        code: 'TFF',
        managementCompany: 'Test Management Co',
        primaryCurrency: 'USD',
        fiscalYearEnd: '12-31',
      });
    });

    it('should delete fund family successfully', async () => {
      const response = await request(app)
        .delete(`/api/fund-families/${fundFamily.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const deletedFundFamily = await FundFamily.findByPk(fundFamily.id);
      expect(deletedFundFamily).toBeNull();
    });

    it('should return 404 for non-existent fund family', async () => {
      const response = await request(app)
        .delete('/api/fund-families/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      // Create a manager user
      const managerUser = await User.create({
        email: 'manager@example.com',
        password: 'password123',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager',
      });

      const managerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@example.com',
          password: 'password123',
        });

      const managerToken = managerLoginResponse.body.data.token;

      const response = await request(app)
        .delete(`/api/fund-families/${fundFamily.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });
  });
});