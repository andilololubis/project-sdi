import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  stages: [
    { duration: '2m', target: 1000 }, // Fase 1: Ramp-up ke 1000 VUs selama 2 menit [cite: 225]
    { duration: '5m', target: 1000 }, // Fase 2: Peak Load, 1000 VUs selama 5 menit [cite: 226]
    { duration: '1m', target: 0 },    // Fase 3: Ramp-down ke 0 VUs selama 1 menit [cite: 228]
  ],
  // Thresholds untuk kriteria lulus/gagal [cite: 230]
  thresholds: {
    'http_req_failed': ['rate<0.01'], // error rate < 1%
    
    // BENAR: Metric-nya adalah 'http_req_duration', 
    // dan kita menambahkan beberapa expression untuknya.
    'http_req_duration': [
        'p(95)<500',  // 95% permintaan < 500ms
        'p(99)<1500'  // 99% permintaan < 1500ms
    ],
  },
};

// Data Mahasiswa untuk Login - Dibuat oleh seed.js
const students = new SharedArray('students', function () {
    const data = [];
    for (let i = 1; i <= 2000; i++) {
        data.push({
            student_id: `502622${String(i).padStart(4, '0')}`,
            password: 'password123',
        });
    }
    return data;
});

const BASE_URL = 'http://localhost:3000/api';

// --- Alur Kerja Pengguna (User Journey) [cite: 222] ---
export default function () {
  // 1. Ambil data mahasiswa acak untuk VU ini
  const user = students[__VU % students.length];

  // 2. Login ke sistem
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login successful': (r) => r.status === 200 });
  if (loginRes.status !== 200) {
    console.error(`Login failed for ${user.student_id}: ${loginRes.body}`);
    return; // Hentikan iterasi VU jika login gagal
  }
  const token = loginRes.json('token');
  const params = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
  
  sleep(1);

  // 3. Mendapatkan daftar mata kuliah
  const coursesRes = http.get(`${BASE_URL}/courses`, params);
  check(coursesRes, { 'get courses successful': (r) => r.status === 200 });
  const courses = coursesRes.json();
  if (!courses || courses.length === 0) {
      return;
  }
  
  sleep(1);
  
  // 4. Memilih 5 mata kuliah secara acak untuk didaftarkan
  const coursesToEnroll = [];
  const enrolledIds = new Set(); // Menggunakan Set lebih efisien untuk cek duplikat
  
  for (let i = 0; i < 5 && i < courses.length; i++) {
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    const courseId = randomCourse._id || randomCourse.id; 

    // Cek jika ID ada dan belum kita tambahkan
    if (courseId && !enrolledIds.has(courseId)) {
        coursesToEnroll.push(courseId);
        enrolledIds.add(courseId);
    }
  }

  if (coursesToEnroll.length > 0) {
      // 5. Mengirimkan permintaan pendaftaran
      const enrollPayload = JSON.stringify({ course_ids: coursesToEnroll });
      const enrollRes = http.post(`${BASE_URL}/enrollments`, enrollPayload, params);
      
      check(enrollRes, {
          'enrollment created': (r) => r.status === 201,
          'enrollment conflict (quota full)': (r) => r.status === 409,
      });
  }

  // Logout tidak diimplementasikan di API, jadi VU berhenti di sini
  sleep(2);
}