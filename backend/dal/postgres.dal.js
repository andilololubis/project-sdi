const { db } = require('../db');

module.exports = {
  findStudent: async (studentId) => {
    const res = await db.client.query('SELECT * FROM students WHERE student_id = $1', [studentId]);
    return res.rows[0];
  },

  getCourses: async () => {
    const res = await db.client.query('SELECT id, course_code, name, credits, quota, (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as enrolled_count FROM courses');
    return res.rows;
  },

  enroll: async (studentId, courseIds) => {
    const client = await db.client.connect();
    try {
      await client.query('BEGIN');
      
      // Ambil student internal id
      const studentRes = await client.query('SELECT id FROM students WHERE student_id = $1', [studentId]);
      if (studentRes.rows.length === 0) throw new Error('Student not found');
      const studentInternalId = studentRes.rows[0].id;

      for (const courseId of courseIds) {
        // Kunci baris course untuk mencegah race condition (pessimistic locking)
        const courseRes = await client.query('SELECT quota, (SELECT COUNT(*) FROM enrollments WHERE course_id = $1) as enrolled FROM courses WHERE id = $1 FOR UPDATE', [courseId]);
        
        if (courseRes.rows.length === 0) throw new Error(`Course with id ${courseId} not found.`);
        
        const course = courseRes.rows[0];
        if (course.enrolled >= course.quota) {
          throw new Error(`Quota for course id ${courseId} is full.`);
        }
        
        await client.query(
          'INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES ($1, $2, NOW())',
          [studentInternalId, courseId]
        );
      }
      
      await client.query('COMMIT');
      return { success: true, message: 'Enrollment successful.' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e; // Lemparkan error ke lapisan atas untuk ditangani
    } finally {
      client.release();
    }
  },
};