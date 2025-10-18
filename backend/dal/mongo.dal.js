const { db } = require('../db');
const { ObjectId } = require('mongodb');

module.exports = {
  findStudent: async (studentId) => {
    return await db.client.collection('users').findOne({ student_id: studentId });
  },

  getCourses: async () => {
    return await db.client.collection('courses').find().toArray();
  },

  enroll: async (studentId, courseIds) => {
    const session = db.client.client.startSession();
    try {
      let result = {};
      await session.withTransaction(async () => {
        // Ambil student _id
        const user = await db.client.collection('users').findOne({ student_id: studentId }, { session });
        if (!user) throw new Error('Student not found');

        for (const courseId of courseIds) {
          const course = await db.client.collection('courses').findOne({ _id: new ObjectId(courseId) }, { session });
          
          if (!course) throw new Error(`Course with id ${courseId} not found.`);
          if (course.enrolled_count >= course.quota) {
            throw new Error(`Quota for course ${course.course_code} is full.`);
          }

          // Cek apakah mahasiswa sudah terdaftar
          const existingEnrollment = await db.client.collection('enrollments').findOne({
            student_id: user._id,
            course_id: course._id
          }, { session });

          if (existingEnrollment) {
            throw new Error(`Student already enrolled in course ${course.course_code}.`);
          }

          // Optimistic Concurrency Control: Update hanya jika enrolled_count masih sama
          const updateResult = await db.client.collection('courses').updateOne(
            { _id: course._id, enrolled_count: course.enrolled_count },
            { $inc: { enrolled_count: 1 } },
            { session }
          );
          
          if (updateResult.modifiedCount === 0) {
            throw new Error(`Failed to enroll due to a race condition for course ${course.course_code}. Please try again.`);
          }

          await db.client.collection('enrollments').insertOne(
            {
              student_id: user._id,
              course_id: course._id,
              enrollment_date: new Date(),
            },
            { session }
          );
        }
      });
      return { success: true, message: 'Enrollment successful.' };
    } catch (e) {
      throw e;
    } finally {
      await session.endSession();
    }
  },
};