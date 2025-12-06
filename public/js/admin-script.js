/* ========================================
   Admin Dashboard Script
   إدارة المشاركات والاستفسارات
   ======================================== */

let allSubmissions = [];
let currentSubmissionId = null;

/**
 * تحميل جميع المشاركات من قاعدة البيانات
 */
async function loadSubmissions() {
    try {
        const response = await fetch('/api/submissions');
        const submissions = await response.json();

        allSubmissions = submissions;
        displaySubmissions(submissions);
        updateStats();
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

/**
 * عرض المشاركات على الصفحة
 */
function displaySubmissions(submissions) {
    const container = document.getElementById('submissionsContainer');

    if (!submissions || submissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>لا توجد مشاركات</h3>
                <p>عندما يرسل الطلاب اقتراحاتهم أو استفساراتهم، ستظهر هنا</p>
            </div>
        `;
        return;
    }

    container.innerHTML = submissions.map(submission => `
        <div class="submission-card" data-id="${submission.id}">
            <div class="submission-header">
                <h3>${submission.title}</h3>
                <span class="submission-type ${submission.type}">${submission.type === 'suggestion' ? '💡 اقتراح' : '❓ استفسار'}</span>
            </div>

            <div class="submission-meta">
                <div class="meta-item">
                    <span class="meta-label">الاسم:</span>
                    <span class="meta-value">${submission.studentName}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">الجامعة:</span>
                    <span class="meta-value">${getUniversityName(submission.university)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">التاريخ:</span>
                    <span class="meta-value">${formatDate(submission.createdAt)}</span>
                </div>
            </div>

            <div class="submission-status">
                <select class="status-select" onchange="updateStatus('${submission.id}', this.value)">
                    <option value="pending" ${submission.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="in-progress" ${submission.status === 'in-progress' ? 'selected' : ''}>قيد المعالجة</option>
                    <option value="resolved" ${submission.status === 'resolved' ? 'selected' : ''}>تم الحل</option>
                </select>
                <span class="status-badge ${submission.status}">${getStatusText(submission.status)}</span>
            </div>

            <div class="submission-actions">
                <button class="view-btn" onclick="viewDetails('${submission.id}')">عرض التفاصيل</button>
                <button class="delete-btn" onclick="confirmDelete('${submission.id}')">حذف</button>
            </div>
        </div>
    `).join('');
}

/**
 * عرض تفاصيل المشاركة في نافذة منبثقة
 */
function viewDetails(id) {
    const submission = allSubmissions.find(s => s.id === id);
    if (!submission) return;

    currentSubmissionId = id;
    const modal = document.getElementById('detailsModal');
    const modalBody = document.getElementById('modalBody');

    const statusOptions = `
        <select class="modal-status-select" id="detailsStatusSelect">
            <option value="pending" ${submission.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
            <option value="in-progress" ${submission.status === 'in-progress' ? 'selected' : ''}>قيد المعالجة</option>
            <option value="resolved" ${submission.status === 'resolved' ? 'selected' : ''}>تم الحل</option>
        </select>
    `;

    modalBody.innerHTML = `
        <div class="details-container">
            <div class="details-section">
                <h3>معلومات المرسل</h3>
                <div class="details-row">
                    <span class="label">الاسم:</span>
                    <span class="value">${submission.studentName}</span>
                </div>
                <div class="details-row">
                    <span class="label">رقم الطالب:</span>
                    <span class="value">${submission.studentId}</span>
                </div>
                <div class="details-row">
                    <span class="label">البريد الإلكتروني:</span>
                    <span class="value">
                        <a href="mailto:${submission.email}">${submission.email}</a>
                    </span>
                </div>
                <div class="details-row">
                    <span class="label">الكلية:</span>
                    <span class="value">${submission.faculty}</span>
                </div>
                <div class="details-row">
                    <span class="label">الفرقة:</span>
                    <span class="value">${submission.year}</span>
                </div>
            </div>

            <div class="details-section">
                <h3>معلومات المشاركة</h3>
                <div class="details-row">
                    <span class="label">النوع:</span>
                    <span class="value">${submission.type === 'suggestion' ? 'اقتراح' : 'استفسار'}</span>
                </div>
                <div class="details-row">
                    <span class="label">الجامعة:</span>
                    <span class="value">${getUniversityName(submission.university)}</span>
                </div>
                <div class="details-row">
                    <span class="label">التاريخ:</span>
                    <span class="value">${formatDate(submission.createdAt)}</span>
                </div>
                <div class="details-row">
                    <span class="label">الحالة:</span>
                    <span class="value">${statusOptions}</span>
                </div>
            </div>

            <div class="details-section">
                <h3>المحتوى</h3>
                <div class="details-row">
                    <span class="label">العنوان:</span>
                    <span class="value">${submission.title}</span>
                </div>
                <div class="details-row">
                    <span class="label">التفاصيل:</span>
                    <div class="content-box">${submission.content}</div>
                </div>
            </div>

            <div class="details-section">
                <h3>ملاحظات الإدارة</h3>
                <textarea id="adminNotesTextarea" class="admin-notes" placeholder="أضف ملاحظاتك هنا...">${submission.adminNotes || ''}</textarea>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

/**
 * حفظ التحديثات عند إغلاق النافذة المنبثقة
 */
async function closeModal() {
    if (currentSubmissionId) {
        const statusSelect = document.getElementById('detailsStatusSelect');
        const adminNotes = document.getElementById('adminNotesTextarea');

        if (statusSelect || adminNotes) {
            const status = statusSelect?.value || allSubmissions.find(s => s.id === currentSubmissionId).status;
            const notes = adminNotes?.value || '';

            try {
                await fetch(`/api/submissions/${currentSubmissionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status, adminNotes: notes })
                });

                loadSubmissions();
            } catch (error) {
                console.error('Error updating submission:', error);
            }
        }
    }

    document.getElementById('detailsModal').style.display = 'none';
    currentSubmissionId = null;
}

/**
 * تحديث حالة المشاركة
 */
async function updateStatus(id, status) {
    try {
        await fetch(`/api/submissions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        loadSubmissions();
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

/**
 * حذف مشاركة
 */
async function deleteSubmission() {
    if (!currentSubmissionId) return;

    if (!confirm('هل أنت متأكد من حذف هذه المشاركة؟')) {
        return;
    }

    try {
        await fetch(`/api/submissions/${currentSubmissionId}`, {
            method: 'DELETE'
        });

        closeModal();
        loadSubmissions();
    } catch (error) {
        console.error('Error deleting submission:', error);
        alert('حدث خطأ في حذف المشاركة');
    }
}

/**
 * تأكيد قبل الحذف
 */
function confirmDelete(id) {
    currentSubmissionId = id;
    viewDetails(id);
}

/**
 * تصفية المشاركات
 */
function filterSubmissions() {
    const university = document.getElementById('universityFilter').value;
    const type = document.getElementById('typeFilter').value;
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = allSubmissions;

    if (university !== 'all') {
        filtered = filtered.filter(s => s.university === university);
    }

    if (type !== 'all') {
        filtered = filtered.filter(s => s.type === type);
    }

    if (status !== 'all') {
        filtered = filtered.filter(s => s.status === status);
    }

    if (search) {
        filtered = filtered.filter(s =>
            s.studentName.toLowerCase().includes(search) ||
            s.email.toLowerCase().includes(search) ||
            s.content.toLowerCase().includes(search)
        );
    }

    displaySubmissions(filtered);
}

/**
 * مسح الفلاتر
 */
function clearFilters() {
    document.getElementById('universityFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('searchInput').value = '';
    displaySubmissions(allSubmissions);
}

/**
 * تصدير البيانات إلى CSV
 */
function exportData() {
    const csv = [
        ['الاسم', 'رقم الطالب', 'البريد الإلكتروني', 'الجامعة', 'الكلية', 'النوع', 'الموضوع', 'الحالة', 'التاريخ']
    ];

    allSubmissions.forEach(s => {
        csv.push([
            s.studentName,
            s.studentId,
            s.email,
            getUniversityName(s.university),
            s.faculty,
            s.type === 'suggestion' ? 'اقتراح' : 'استفسار',
            s.title,
            getStatusText(s.status),
            formatDate(s.createdAt)
        ]);
    });

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().getTime()}.csv`;
    link.click();
}

/**
 * تحديث الإحصائيات
 */
function updateStats() {
    const total = allSubmissions.length;
    const suggestions = allSubmissions.filter(s => s.type === 'suggestion').length;
    const inquiries = allSubmissions.filter(s => s.type === 'inquiry').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('suggestionCount').textContent = suggestions;
    document.getElementById('inquiryCount').textContent = inquiries;
}

/**
 * دوال مساعدة
 */
function getUniversityName(code) {
    const names = {
        'government': 'جامعة حلوان الحكومية',
        'private': 'جامعة حلوان الأهلية',
        'tech': 'جامعة حلوان التكنولوجية'
    };
    return names[code] || code;
}

function getStatusText(status) {
    const texts = {
        'pending': 'قيد المراجعة',
        'in-progress': 'قيد المعالجة',
        'resolved': 'تم الحل'
    };
    return texts[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// إغلاق النافذة المنبثقة عند الضغط على مفتاح Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// إغلاق النافذة المنبثقة عند الضغط خارجها
window.addEventListener('click', (e) => {
    const modal = document.getElementById('detailsModal');
    if (e.target === modal) {
        closeModal();
    }
});
