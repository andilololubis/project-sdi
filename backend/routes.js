// backend/routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');

const router = express.Router();

// Tentukan DAL yang akan digunakan berdasarkan konfigurasi
const dal = require(`./dal/${config.dbType}.dal.js`);

// Middleware untuk proteksi route
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.student = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

// POST /api/auth/login [cite: 210]
router.post('/auth/login', async (req, res) => {
    const { student_id, password } = req.body;
    if (!student_id || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const student = await dal.findStudent(student_id);
        if (!student) return res.status(400).json({ msg: 'Student does not exist' });

        const isMatch = await bcrypt.compare(password, student.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        jwt.sign(
            { id: student.student_id },
            config.jwtSecret,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, student: { id: student.student_id, name: student.name } });
            }
        );
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// GET /api/courses [cite: 211]
router.get('/courses', auth, async (req, res) => {
    try {
        const courses = await dal.getCourses();
        res.json(courses);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// POST /api/enrollments [cite: 212]
router.post('/enrollments', auth, async (req, res) => {
    const { course_ids } = req.body; // array of course IDs
    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
        return res.status(400).json({ msg: 'Please provide an array of course_ids' });
    }
    
    try {
        const result = await dal.enroll(req.student.id, course_ids);
        res.status(201).json(result);
    } catch (e) {
        // Memberikan status code yang lebih sesuai
        if (e.message.includes('full') || e.message.includes('race condition')) {
            return res.status(409).json({ msg: e.message }); // 409 Conflict
        }
        res.status(500).json({ msg: e.message });
    }
});

module.exports = router;