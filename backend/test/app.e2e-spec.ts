import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * E2E test covering full flow with Admin and Participant roles.
 * Requires a test MongoDB instance. Provide MONGODB_URI in env.
 */
describe('App E2E (full scenario)', () => {
  let app: INestApplication;
  let connection: Connection;

  let adminToken: string;
  let participantToken: string;
  let eventId: string;
  let reservationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    connection = moduleFixture.get(getConnectionToken());
    // Clear all collections
    const collections = connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('Admin registers', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'admin@e2e.test', name: 'Admin', password: 'adminpass', role: 'ADMIN' })
      .expect(201);
    expect(res.body.access_token).toBeDefined();
    adminToken = res.body.access_token;
  });

  it('Participant registers', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'user@e2e.test', name: 'Participant', password: 'userpass' })
      .expect(201);
    expect(res.body.access_token).toBeDefined();
    participantToken = res.body.access_token;
  });

  it('Admin creates event (DRAFT)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Event',
        description: 'Testing',
        dateTime: '2026-05-01T10:00:00Z',
        location: 'Test Room',
        capacity: 5,
      })
      .expect(201);
    expect(res.body.status).toBe('DRAFT');
    eventId = res.body.id;
  });

  it('Participant cannot see DRAFT event in public list', async () => {
    const res = await request(app.getHttpServer()).get('/api/events').expect(200);
    const ids = res.body.map((e: any) => e.id);
    expect(ids).not.toContain(eventId);
  });

  it('Admin publishes event', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(res.body.status).toBe('PUBLISHED');
  });

  it('Participant sees published event', async () => {
    const res = await request(app.getHttpServer()).get('/api/events').expect(200);
    const ids = res.body.map((e: any) => e.id);
    expect(ids).toContain(eventId);
  });

  it('Participant creates reservation (PENDING)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ eventId })
      .expect(201);
    expect(res.body.status).toBe('PENDING');
    reservationId = res.body.id;
  });

  it('Participant cannot duplicate reservation', async () => {
    await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ eventId })
      .expect(400);
  });

  it('Admin confirms reservation', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/reservations/${reservationId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  it('Participant downloads ticket PDF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/reservations/${reservationId}/ticket`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('Participant cancels reservation', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200);
    expect(res.body.status).toBe('CANCELED');
  });

  it('Admin cancels event', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.status).toBe('CANCELED');
  });
});
