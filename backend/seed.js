// backend/seed.js
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const config = require('./config');

const NUM_STUDENTS = 2000;
const NUM_COURSES = 50;
const QUOTA_PER_COURSE = 40;

async function seedPostgres() {
  const pool = new Pool(config.postgres);
  console.log('Seeding PostgreSQL...');

  // Hapus data lama
  await pool.query('TRUNCATE students, courses, enrollments RESTART IDENTITY CASCADE');

  // Seed Students
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const studentId = `502622${String(i).padStart(4, '0')}`;
    const name = faker.name.findName();
    const passwordHash = await bcrypt.hash('password123', 10);
    await pool.query('INSERT INTO students (student_id, name, password_hash) VALUES ($1, $2, $3)', [studentId, name, passwordHash]);
  }
  console.log(`${NUM_STUDENTS} students seeded.`);

  // Seed Courses
  for (let i = 1; i <= NUM_COURSES; i++) {
    const courseCode = `IF${String(1000 + i)}`;
    const name = faker.lorem.words(3);
    await pool.query('INSERT INTO courses (course_code, name, credits, quota) VALUES ($1, $2, $3, $4)', [courseCode, name, 3, QUOTA_PER_COURSE]);
  }
  console.log(`${NUM_COURSES} courses seeded.`);
  
  await pool.end();
  console.log('PostgreSQL seeding finished.');
}

async function seedMongo() {
  const client = new MongoClient(config.mongo.uri);
  await client.connect();
  const db = client.db('frs_db');
  console.log('Seeding MongoDB...');
  
  // Hapus data lama
  await db.collection('users').deleteMany({});
  await db.collection('courses').deleteMany({});
  await db.collection('enrollments').deleteMany({});
  
  // Seed Users (Students)
  const users = [];
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const studentId = `502622${String(i).padStart(4, '0')}`;
    const name = faker.name.findName();
    const passwordHash = await bcrypt.hash('password123', 10);
    users.push({ student_id: studentId, name, password_hash: passwordHash, type: 'student' });
  }
  await db.collection('users').insertMany(users);
  console.log(`${NUM_STUDENTS} users seeded.`);
  
  // Seed Courses
  const courses = [];
  for (let i = 1; i <= NUM_COURSES; i++) {
    const courseCode = `IF${String(1000 + i)}`;
    const name = faker.lorem.words(3);
    courses.push({ course_code: courseCode, name, credits: 3, quota: QUOTA_PER_COURSE, enrolled_count: 0 });
  }
  await db.collection('courses').insertMany(courses);
  console.log(`${NUM_COURSES} courses seeded.`);
  
  await client.close();
  console.log('MongoDB seeding finished.');
}

// Jalankan seeder
async function run() {
    await seedPostgres();
    await seedMongo();
}

run().catch(console.error);