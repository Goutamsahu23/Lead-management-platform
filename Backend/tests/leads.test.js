const request = require('supertest');
const { createApp } = require('../src/app');
const { createUser, authHeaderFor } = require('./helpers');
const Activity = require('../src/models/Activity');

const app = createApp();

describe('Core lead flows', () => {
  test('public create lead sets status new and records created activity', async () => {
    const res = await request(app).post('/api/public/leads').send({
      name: 'Jane Doe',
      email: 'jane@acme.com',
      phone: '555-0100',
      company: 'Acme',
      source: 'website',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('new');
    expect(res.body.data.email).toBe('jane@acme.com');

    const activities = await Activity.find({ leadId: res.body.data._id });
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('created');
    expect(activities[0].actorId).toBeNull();
  });

  test('member-created leads are auto-assigned and visible to that member', async () => {
    const member = await createUser({
      email: 'creator@flow.com',
      role: 'member',
      password: 'Member123!',
    });
    const memberAuth = await authHeaderFor(member);

    const created = await request(app)
      .post('/api/leads')
      .set('Authorization', memberAuth)
      .send({ name: 'Self Lead', email: 'self@lead.com' });

    expect(created.status).toBe(201);
    expect(String(created.body.data.assignedTo._id || created.body.data.assignedTo.id)).toBe(
      String(member._id)
    );

    const list = await request(app).get('/api/leads').set('Authorization', memberAuth);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].name).toBe('Self Lead');
  });

  test('admin assigns lead; member updates status and adds note; activities and filters work', async () => {
    const admin = await createUser({
      email: 'admin@flow.com',
      role: 'admin',
      password: 'Admin123!',
    });
    const member = await createUser({
      email: 'member@flow.com',
      role: 'member',
      password: 'Member123!',
    });

    const adminAuth = await authHeaderFor(admin);
    const memberAuth = await authHeaderFor(member);

    const created = await request(app)
      .post('/api/leads')
      .set('Authorization', adminAuth)
      .send({
        name: 'Bob Buyer',
        email: 'bob@buyer.com',
        company: 'Buyer Co',
      });

    expect(created.status).toBe(201);
    const leadId = created.body.data._id;

    const assigned = await request(app)
      .patch(`/api/leads/${leadId}`)
      .set('Authorization', adminAuth)
      .send({ assignedTo: member._id.toString() });

    expect(assigned.status).toBe(200);
    expect(String(assigned.body.data.assignedTo._id)).toBe(String(member._id));

    const statusUpdate = await request(app)
      .patch(`/api/leads/${leadId}`)
      .set('Authorization', memberAuth)
      .send({ status: 'contacted' });

    expect(statusUpdate.status).toBe(200);
    expect(statusUpdate.body.data.status).toBe('contacted');

    const noteRes = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', memberAuth)
      .send({ body: 'Called and left voicemail' });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.data.body).toMatch(/voicemail/);

    const activities = await request(app)
      .get(`/api/leads/${leadId}/activities`)
      .set('Authorization', memberAuth);

    expect(activities.status).toBe(200);
    const types = activities.body.data.map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(['created', 'assigned', 'status_changed', 'note_added'])
    );

    await request(app)
      .post('/api/leads')
      .set('Authorization', adminAuth)
      .send({ name: 'Other', email: 'other@x.com' });

    const filtered = await request(app)
      .get('/api/leads')
      .query({ status: 'contacted', page: 1, limit: 10, q: 'Bob' })
      .set('Authorization', adminAuth);

    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.data[0].name).toBe('Bob Buyer');
    expect(filtered.body.page).toBe(1);
    expect(filtered.body.limit).toBe(10);

    const memberList = await request(app)
      .get('/api/leads')
      .set('Authorization', memberAuth);

    expect(memberList.status).toBe(200);
    expect(memberList.body.total).toBe(1);
    expect(memberList.body.data[0]._id).toBe(leadId);
  });
});
