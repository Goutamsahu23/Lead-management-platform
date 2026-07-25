const request = require('supertest');
const { createApp } = require('../src/app');
const { createUser, authHeaderFor } = require('./helpers');
const Lead = require('../src/models/Lead');

const app = createApp();

describe('Auth rules', () => {
  test('login succeeds with valid credentials and fails with invalid', async () => {
    await createUser({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin123!',
      role: 'admin',
    });

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' });

    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();
    expect(ok.body.user.role).toBe('admin');

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' });

    expect(bad.status).toBe(401);
    expect(bad.body.message).toMatch(/invalid/i);
  });

  test('unauthenticated requests to protected routes return 401', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  test('member cannot assign or delete leads; admin can', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      role: 'admin',
      password: 'Admin123!',
    });
    const member = await createUser({
      email: 'member@test.com',
      role: 'member',
      password: 'Member123!',
    });

    const lead = await Lead.create({
      name: 'Prospect',
      email: 'prospect@example.com',
      status: 'new',
      assignedTo: member._id,
    });

    const memberAuth = await authHeaderFor(member);
    const adminAuth = await authHeaderFor(admin);

    const assignDenied = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', memberAuth)
      .send({ assignedTo: admin._id.toString() });

    expect(assignDenied.status).toBe(403);

    const deleteDenied = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', memberAuth);

    expect(deleteDenied.status).toBe(403);

    const assignOk = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', adminAuth)
      .send({ assignedTo: admin._id.toString() });

    expect(assignOk.status).toBe(200);
    expect(assignOk.body.data.assignedTo._id || assignOk.body.data.assignedTo.id).toBeDefined();

    const otherLead = await Lead.create({
      name: 'Other',
      email: 'other@example.com',
    });

    const deleteOk = await request(app)
      .delete(`/api/leads/${otherLead._id}`)
      .set('Authorization', adminAuth);

    expect(deleteOk.status).toBe(200);
  });

  test('member cannot access unassigned lead; admin can', async () => {
    const admin = await createUser({
      email: 'admin2@test.com',
      role: 'admin',
      password: 'Admin123!',
    });
    const member = await createUser({
      email: 'member2@test.com',
      role: 'member',
      password: 'Member123!',
    });

    const lead = await Lead.create({
      name: 'Open Lead',
      email: 'open@example.com',
      assignedTo: null,
    });

    const memberAuth = await authHeaderFor(member);
    const adminAuth = await authHeaderFor(admin);

    const memberRes = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', memberAuth);

    expect(memberRes.status).toBe(403);

    const adminRes = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', adminAuth);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.email).toBe('open@example.com');
  });

  test('member can update their own profile name and password', async () => {
    const member = await createUser({
      email: 'profile@test.com',
      role: 'member',
      password: 'Member123!',
      name: 'Old Name',
    });
    const memberAuth = await authHeaderFor(member);

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', memberAuth)
      .send({
        name: 'New Name',
        currentPassword: 'Member123!',
        password: 'Member456!',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
    expect(res.body.user.role).toBe('member');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile@test.com', password: 'Member456!' });

    expect(login.status).toBe(200);
  });
});
