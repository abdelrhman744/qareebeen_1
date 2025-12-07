import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE SETUP
// ========================================

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware
app.use(cors());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// ========================================
// NODEMAILER SETUP
// ========================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    }
});

// Function to send email notifications
async function sendSubmissionEmail(submission) {
    try {
        const htmlTemplate = `
            <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #667eea; text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 15px;">
                        تم استقبال مشاركتك بنجاح ✓
                    </h2>
                    
                    <p style="color: #333; font-size: 16px; margin: 20px 0;">
                        شكراً لك على مشاركتك القيمة. تم استقبال مشاركتك وسيتم مراجعتها قريباً.
                    </p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-right: 4px solid #667eea; margin: 20px 0;">
                        <h3 style="color: #667eea; margin-top: 0;">تفاصيل المشاركة:</h3>
                        <p><strong>الموضوع:</strong> ${submission.title}</p>
                        <p><strong>النوع:</strong> ${submission.type === 'suggestion' ? 'اقتراح' : 'استفسار'}</p>
                        <p><strong>الجامعة:</strong> ${getUniversityName(submission.university)}</p>
                        <p><strong>تاريخ الإرسال:</strong> ${new Date(submission.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        سيتم التواصل معك عبر البريد الإلكتروني: <strong>${submission.email}</strong>
                    </p>
                    
                    <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
                        <p>© 2025 قريبين - منصة الاقتراحات والاستفسارات</p>
                    </footer>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: submission.email,
            subject: `تم استقبال مشاركتك: ${submission.title}`,
            html: htmlTemplate
        });

        // Send admin notification
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `مشاركة جديدة: ${submission.title}`,
            html: `
                <div style="direction: rtl; font-family: Arial, sans-serif;">
                    <h2>مشاركة جديدة وردت</h2>
                    <p><strong>الاسم:</strong> ${submission.studentName}</p>
                    <p><strong>الجامعة:</strong> ${getUniversityName(submission.university)}</p>
                    <p><strong>الكلية:</strong> ${submission.faculty}</p>
                    <p><strong>البريد:</strong> ${submission.email}</p>
                    <p><strong>النوع:</strong> ${submission.type}</p>
                    <p><strong>الموضوع:</strong> ${submission.title}</p>
                    <p><strong>التفاصيل:</strong> ${submission.content}</p>
                    <p><a href="http://localhost:${PORT}/admin">اذهب إلى لوحة التحكم</a></p>
                </div>
            `
        });

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Helper function to get university name
function getUniversityName(university) {
    const names = {
        'government': 'جامعة حلوان الحكومية',
        'private': 'جامعة حلوان الأهلية',
        'tech': 'جامعة حلوان التكنولوجية'
    };
    return names[university] || university;
}

// ========================================
// ROUTES - Pages
// ========================================

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

// Government university page
app.get('/government', (req, res) => {
    res.render('government', { university: 'government' });
});

// Private university page
app.get('/private', (req, res) => {
    res.render('private', { university: 'private' });
});

// Tech university page
app.get('/tech', (req, res) => {
    res.render('tech', { university: 'tech' });
});

// ========================================
// ROUTES - API / Form Submission
// ========================================

// Submit suggestion or inquiry
app.post('/api/submit', async (req, res) => {
    try {
        const { studentName, studentId, faculty, year, email, type, title, content, university } = req.body;

        // Validation
        if (!studentName || !studentId || !faculty || !year || !email || !type || !title || !content || !university) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }

        // Save to database
        const submission = await prisma.submission.create({
            data: {
                studentName,
                studentId,
                faculty,
                year,
                email,
                type,
                title,
                content,
                university,
                status: 'pending'
            }
        });

        // Send email notification
        await sendSubmissionEmail(submission);

        // Update analytics
        await updateAnalytics();

        res.json({ success: true, message: 'تم إرسال مشاركتك بنجاح', submission });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ في الإرسال' });
    }
});

// ========================================
// ROUTES - Admin Panel
// ========================================

// Admin login page
app.get('/admin/login', (req, res) => {
    // If already logged in, redirect to admin dashboard
    if (req.session.admin) {
        return res.redirect('/admin');
    }
    res.render('admin-login');
});

// Admin login handler
app.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.status(401).json({ error: 'بيانات دخول غير صحيحة' });
        }

        req.session.admin = { id: admin.id, email: admin.email, name: admin.name };
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
    }
});

// Middleware to check admin session
const checkAdminSession = (req, res, next) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    next();
};

// Admin dashboard (PROTECTED)
app.get('/admin', checkAdminSession, (req, res) => {
    res.render('admin', { admin: req.session.admin });
});

// Analytics dashboard (PROTECTED)
app.get('/analytics', checkAdminSession, (req, res) => {
    res.render('analytics', { admin: req.session.admin });
});

// ========================================
// ROUTES - API / Admin Operations (ALL PROTECTED)
// ========================================

// Get all submissions (PROTECTED)
app.get('/api/submissions', checkAdminSession, async (req, res) => {
    try {
        const { university, type, status } = req.query;
        const where = {};

        if (university && university !== 'all') where.university = university;
        if (type && type !== 'all') where.type = type;
        if (status && status !== 'all') where.status = status;

        const submissions = await prisma.submission.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

// Get submission by ID (PROTECTED)
app.get('/api/submissions/:id', checkAdminSession, async (req, res) => {
    try {
        const submission = await prisma.submission.findUnique({
            where: { id: req.params.id }
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching submission' });
    }
});

// Update submission status (PROTECTED)
app.put('/api/submissions/:id', checkAdminSession, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const submission = await prisma.submission.update({
            where: { id: req.params.id },
            data: {
                status,
                adminNotes: adminNotes || undefined
            }
        });

        res.json({ success: true, submission });
    } catch (error) {
        res.status(500).json({ error: 'Error updating submission' });
    }
});

// Delete submission (PROTECTED)
app.delete('/api/submissions/:id', checkAdminSession, async (req, res) => {
    try {
        await prisma.submission.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true, message: 'Submission deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting submission' });
    }
});

// Get analytics data (PROTECTED)
app.get('/api/analytics', checkAdminSession, async (req, res) => {
    try {
        const total = await prisma.submission.count();
        const suggestions = await prisma.submission.count({
            where: { type: 'suggestion' }
        });
        const inquiries = await prisma.submission.count({
            where: { type: 'inquiry' }
        });

        const universities = {
            government: await prisma.submission.count({ where: { university: 'government' } }),
            private: await prisma.submission.count({ where: { university: 'private' } }),
            tech: await prisma.submission.count({ where: { university: 'tech' } })
        };

        const statuses = {
            pending: await prisma.submission.count({ where: { status: 'pending' } }),
            inProgress: await prisma.submission.count({ where: { status: 'in-progress' } }),
            resolved: await prisma.submission.count({ where: { status: 'resolved' } })
        };

        // Get last 7 days data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastSevenDays = await prisma.submission.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({
            total,
            suggestions,
            inquiries,
            universities,
            statuses,
            lastSevenDays
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Update analytics
async function updateAnalytics() {
    try {
        const total = await prisma.submission.count();
        const suggestions = await prisma.submission.count({ where: { type: 'suggestion' } });
        const inquiries = await prisma.submission.count({ where: { type: 'inquiry' } });
        const government = await prisma.submission.count({ where: { university: 'government' } });
        const priv = await prisma.submission.count({ where: { university: 'private' } });
        const tech = await prisma.submission.count({ where: { university: 'tech' } });

        await prisma.analytics.create({
            data: {
                totalSubmissions: total,
                suggestionsCount: suggestions,
                inquiriesCount: inquiries,
                governmentCount: government,
                privateCount: priv,
                techCount: tech
            }
        });
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

// ========================================
// SERVER STARTUP
// ========================================

// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`📋 Admin panel at http://localhost:${PORT}/admin/login`);
// });

// Handle Prisma cleanup
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export default app;