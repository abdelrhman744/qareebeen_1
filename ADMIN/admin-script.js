/* ========================================
   ملف JavaScript لصفحة الأدمن
   إدارة وعرض الشكاوى والاقتراحات
   ======================================== */

// ========================================
// متغيرات عامة
// ========================================

let allSubmissions = []; // جميع المشاركات
let filteredSubmissions = []; // المشاركات المفلترة
let currentSubmissionId = null; // المشاركة المحددة حالياً

// ========================================
// تحميل البيانات عند فتح الصفحة
// ========================================

window.addEventListener('load', () => {
    loadSubmissions();
    updateStats();
});

// ========================================
// تحميل المشاركات من localStorage
// ========================================

/**
 * تحميل جميع المشاركات من التخزين المحلي
 */
function loadSubmissions() {
    // جلب البيانات من localStorage
    const stored = localStorage.getItem('submissions');
    allSubmissions = stored ? JSON.parse(stored) : [];

    // عرض المشاركات
    filteredSubmissions = [...allSubmissions];
    displaySubmissions();
    updateStats();
}

// ========================================
// عرض المشاركات في الصفحة
// ========================================

/**
 * عرض المشاركات في الصفحة
 */
function displaySubmissions() {
    const container = document.getElementById('submissionsContainer');

    if (filteredSubmissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>لا توجد مشاركات تطابق الفلاتر</h3>
                <p>جرب تغيير الفلاتر أو مسحها</p>
            </div>
        `;
        return;
    }

    // ترتيب المشاركات من الأحدث للأقدم
    const sorted = [...filteredSubmissions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    // إنشاء HTML للمشاركات
    container.innerHTML = sorted.map(submission => createSubmissionCard(submission)).join('');
}

/**
 * إنشاء بطاقة مشاركة واحدة
 */
function createSubmissionCard(submission) {
    const universityNames = {
        'government': 'جامعة حلوان الحكومية',
        'private': 'جامعة حلوان الأهلية',
        'tech': 'جامعة حلوان التكنولوجية'
    };

    const typeNames = {
        'suggestion': 'اقتراح',
        'inquiry': 'استفسار'
    };

    const typeIcons = {
        'suggestion': '💡',
        'inquiry': '❓'
    };

    const statusNames = {
        'pending': 'قيد المراجعة',
        'in-progress': 'قيد المعالجة',
        'resolved': 'تم الحل'
    };

    const date = new Date(submission.timestamp);
    const formattedDate = date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const status = submission.status || 'pending';

    return `
        <div class="submission-card ${submission.type}" data-id="${submission.id}">
            <div class="submission-header">
                <div class="submission-info">
                    <h3>${typeIcons[submission.type]} ${submission.title}</h3>
                    <div class="submission-meta">
                        <span>👤 ${submission.studentName}</span>
                        <span>🎓 ${submission.faculty}</span>
                        <span>📅 ${formattedDate}</span>
                    </div>
                </div>
                <div class="submission-badges">
                    <span class="badge university">${universityNames[submission.university]}</span>
                    <span class="badge type ${submission.type}">${typeNames[submission.type]}</span>
                </div>
            </div>

            <div class="submission-content">
                <div class="content-preview">
                    <p>${submission.content.substring(0, 150)}${submission.content.length > 150 ? '...' : ''}</p>
                </div>
            </div>

            <div class="submission-footer">
                <select class="status-select ${status}" onchange="updateStatus('${submission.id}', this.value)">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>قيد المعالجة</option>
                    <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>تم الحل</option>
                </select>
                <div class="card-actions">
                    <button class="action-btn view-btn" onclick="viewDetails('${submission.id}')">
                        عرض التفاصيل
                    </button>
                    <button class="action-btn delete-btn-small" onclick="confirmDelete('${submission.id}')">
                        حذف
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// تحديث الإحصائيات
// ========================================

/**
 * تحديث الإحصائيات في الأعلى
 */
function updateStats() {
    const total = allSubmissions.length;
    const suggestions = allSubmissions.filter(s => s.type === 'suggestion').length;
    const inquiries = allSubmissions.filter(s => s.type === 'inquiry').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('suggestionCount').textContent = suggestions;
    document.getElementById('inquiryCount').textContent = inquiries;
}

// ========================================
// تصفية المشاركات
// ========================================

/**
 * تصفية المشاركات حسب الفلاتر
 */
function filterSubmissions() {
    const universityFilter = document.getElementById('universityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    filteredSubmissions = allSubmissions.filter(submission => {
        // فلتر الجامعة
        if (universityFilter !== 'all' && submission.university !== universityFilter) {
            return false;
        }

        // فلتر النوع
        if (typeFilter !== 'all' && submission.type !== typeFilter) {
            return false;
        }

        // فلتر الحالة
        const status = submission.status || 'pending';
        if (statusFilter !== 'all' && status !== statusFilter) {
            return false;
        }

        // البحث
        if (searchInput) {
            const searchableText = `
                ${submission.studentName}
                ${submission.email}
                ${submission.title}
                ${submission.content}
                ${submission.faculty}
            `.toLowerCase();

            if (!searchableText.includes(searchInput)) {
                return false;
            }
        }

        return true;
    });

    displaySubmissions();
}

/**
 * مسح جميع الفلاتر
 */
function clearFilters() {
    document.getElementById('universityFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('searchInput').value = '';
    filterSubmissions();
}

// ========================================
// تحديث حالة المشاركة
// ========================================

/**
 * تحديث حالة مشاركة
 */
function updateStatus(id, newStatus) {
    const index = allSubmissions.findIndex(s => s.id === id);
    if (index !== -1) {
        allSubmissions[index].status = newStatus;
        localStorage.setItem('submissions', JSON.stringify(allSubmissions));

        // تحديث شكل القائمة المنسدلة
        const select = event.target;
        select.className = `status-select ${newStatus}`;

        // إعادة التصفية
        filterSubmissions();
    }
}

// ========================================
// عرض تفاصيل المشاركة
// ========================================

/**
 * عرض تفاصيل مشاركة في نافذة منبثقة
 */
function viewDetails(id) {
    const submission = allSubmissions.find(s => s.id === id);
    if (!submission) return;

    currentSubmissionId = id;

    const universityNames = {
        'government': 'جامعة حلوان الحكومية',
        'private': 'جامعة حلوان الأهلية',
        'tech': 'جامعة حلوان التكنولوجية'
    };

    const typeNames = {
        'suggestion': 'اقتراح',
        'inquiry': 'استفسار'
    };

    const statusNames = {
        'pending': 'قيد المراجعة',
        'in-progress': 'قيد المعالجة',
        'resolved': 'تم الحل'
    };

    const date = new Date(submission.timestamp);
    const formattedDate = date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-detail">
            <label>🎓 الجامعة:</label>
            <p>${universityNames[submission.university]}</p>
        </div>
        <div class="modal-detail">
            <label>📋 نوع المشاركة:</label>
            <p>${typeNames[submission.type]}</p>
        </div>
        <div class="modal-detail">
            <label>📊 الحالة:</label>
            <p>${statusNames[submission.status || 'pending']}</p>
        </div>
        <div class="modal-detail">
            <label>👤 اسم الطالب:</label>
            <p>${submission.studentName}</p>
        </div>
        <div class="modal-detail">
            <label>🔢 رقم الطالب:</label>
            <p>${submission.studentId}</p>
        </div>
        <div class="modal-detail">
            <label>🏛️ الكلية:</label>
            <p>${submission.faculty}</p>
        </div>
        <div class="modal-detail">
            <label>📚 الفرقة:</label>
            <p>الفرقة ${submission.year}</p>
        </div>
        <div class="modal-detail">
            <label>📧 البريد الإلكتروني:</label>
            <p>${submission.email}</p>
        </div>
        <div class="modal-detail">
            <label>📝 العنوان:</label>
            <p>${submission.title}</p>
        </div>
        <div class="modal-detail">
            <label>💬 التفاصيل:</label>
            <p>${submission.content}</p>
        </div>
        <div class="modal-detail">
            <label>📅 تاريخ الإرسال:</label>
            <p>${formattedDate}</p>
        </div>
    `;

    // عرض النافذة المنبثقة
    const modal = document.getElementById('detailsModal');
    modal.classList.add('show');
}

/**
 * إغلاق النافذة المنبثقة
 */
function closeModal() {
    const modal = document.getElementById('detailsModal');
    modal.classList.remove('show');
    currentSubmissionId = null;
}

// إغلاق عند الضغط خارج النافذة
document.addEventListener('click', (e) => {
    const modal = document.getElementById('detailsModal');
    if (e.target === modal) {
        closeModal();
    }
});

// ========================================
// حذف المشاركة
// ========================================

/**
 * تأكيد حذف المشاركة
 */
function confirmDelete(id) {
    if (confirm('هل أنت متأكد من حذف هذه المشاركة؟')) {
        deleteSubmissionById(id);
    }
}

/**
 * حذف المشاركة من النافذة المنبثقة
 */
function deleteSubmission() {
    if (currentSubmissionId) {
        if (confirm('هل أنت متأكد من حذف هذه المشاركة؟')) {
            deleteSubmissionById(currentSubmissionId);
            closeModal();
        }
    }
}

/**
 * حذف المشاركة بواسطة المعرف
 */
function deleteSubmissionById(id) {
    allSubmissions = allSubmissions.filter(s => s.id !== id);
    localStorage.setItem('submissions', JSON.stringify(allSubmissions));
    filterSubmissions();
    updateStats();
}

// ========================================
// تصدير البيانات
// ========================================

/**
 * تصدير البيانات إلى ملف CSV
 */
function exportData() {
    if (allSubmissions.length === 0) {
        alert('لا توجد بيانات لتصديرها');
        return;
    }

    const universityNames = {
        'government': 'جامعة حلوان الحكومية',
        'private': 'جامعة حلوان الأهلية',
        'tech': 'جامعة حلوان التكنولوجية'
    };

    const typeNames = {
        'suggestion': 'اقتراح',
        'inquiry': 'استفسار'
    };

    const statusNames = {
        'pending': 'قيد المراجعة',
        'in-progress': 'قيد المعالجة',
        'resolved': 'تم الحل'
    };

    // إنشاء محتوى CSV
    let csv = '\uFEFF'; // BOM للدعم العربي
    csv += 'الجامعة,النوع,الحالة,اسم الطالب,رقم الطالب,الكلية,الفرقة,البريد الإلكتروني,العنوان,التفاصيل,تاريخ الإرسال\n';

    allSubmissions.forEach(s => {
        const date = new Date(s.timestamp).toLocaleString('ar-EG');
        const status = statusNames[s.status || 'pending'];

        csv += `"${universityNames[s.university]}","${typeNames[s.type]}","${status}","${s.studentName}","${s.studentId}","${s.faculty}","${s.year}","${s.email}","${s.title}","${s.content.replace(/"/g, '""')}","${date}"\n`;
    });

    // تنزيل الملف
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `submissions_${today}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}