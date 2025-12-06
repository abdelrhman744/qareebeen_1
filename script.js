/* ========================================
   ملف JavaScript الرئيسي لموقع قريبين
   يحتوي على جميع الوظائف والتفاعلات
   ======================================== */

// ========================================
// وظائف الصفحة الرئيسية (index.html)
// ========================================

/**
 * دالة اختيار الجامعة - تُستدعى عند الضغط على زر "اختر"
 * @param {string} universityType - نوع الجامعة (government, private, tech)
 */
function selectUniversity(universityType) {
    // إضافة تأثير بصري للبطاقة المختارة
    const cards = document.querySelectorAll('.university-card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`[data-university="${universityType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // حفظ الاختيار في التخزين المحلي
    localStorage.setItem('selectedUniversity', universityType);

    // التوجيه إلى الصفحة المناسبة
    setTimeout(() => {
        const universityPages = {
            'government': 'government.html',
            'private': 'private.html',
            'tech': 'tech.html'
        };

        const universityNames = {
            'government': 'جامعة حلوان الحكومية',
            'private': 'جامعة حلوان الأهلية',
            'tech': 'جامعة حلوان التكنولوجية'
        };

        // عرض رسالة تأكيد
        console.log(`تم اختيار ${universityNames[universityType]}`);

        // التوجيه للصفحة
        window.location.href = universityPages[universityType];
    }, 300);
}

// ========================================
// اختصارات لوحة المفاتيح
// ========================================

/**
 * السماح باختيار الجامعة عن طريق الأرقام (1, 2, 3)
 */
document.addEventListener('keydown', (e) => {
    const buttons = document.querySelectorAll('.select-btn');

    if (buttons.length > 0) {
        if (e.key === '1' && buttons[0]) {
            buttons[0].click();
        } else if (e.key === '2' && buttons[1]) {
            buttons[1].click();
        } else if (e.key === '3' && buttons[2]) {
            buttons[2].click();
        }
    }
});

// ========================================
// تحميل الصفحة وإعداداتها
// ========================================

/**
 * عند تحميل الصفحة - التحقق من الاختيار السابق
 */
window.addEventListener('load', () => {
    // استرجاع الجامعة المحفوظة
    const savedUniversity = localStorage.getItem('selectedUniversity');
    if (savedUniversity) {
        const savedCard = document.querySelector(`[data-university="${savedUniversity}"]`);
        if (savedCard) {
            savedCard.style.border = '3px solid #667eea';
        }
    }

    // إعداد الأنيميشن للبطاقات
    const cards = document.querySelectorAll('.university-card');
    if (cards.length > 0) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.6s ease-in-out';
                }
            });
        }, observerOptions);

        cards.forEach(card => {
            observer.observe(card);
        });
    }
});

// ========================================
// وظائف صفحات النماذج (government.html, private.html, tech.html)
// ========================================

/**
 * عداد الأحرف لمربع النص الكبير
 */
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('content');
    const characterCount = document.querySelector('.character-count');

    if (textarea && characterCount) {
        const maxLength = 2000;

        // تحديث العداد عند الكتابة
        textarea.addEventListener('input', () => {
            const currentLength = textarea.value.length;
            characterCount.textContent = `${currentLength} / ${maxLength} حرف`;

            // تغيير اللون إذا اقترب من الحد الأقصى
            if (currentLength > maxLength * 0.9) {
                characterCount.style.color = '#e74c3c';
            } else {
                characterCount.style.color = '#888';
            }

            // منع الكتابة بعد الحد الأقصى
            if (currentLength > maxLength) {
                textarea.value = textarea.value.substring(0, maxLength);
                characterCount.textContent = `${maxLength} / ${maxLength} حرف`;
            }
        });
    }
});

// ========================================
// معالج إرسال النموذج
// ========================================

/**
 * معالجة إرسال النموذج
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('suggestionForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // منع الإرسال الافتراضي

            // جمع البيانات من النموذج
            const formData = {
                studentName: document.getElementById('studentName').value,
                studentId: document.getElementById('studentId').value,
                faculty: document.getElementById('faculty').value,
                year: document.getElementById('year').value,
                email: document.getElementById('email').value,
                type: document.querySelector('input[name="type"]:checked').value,
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                university: localStorage.getItem('selectedUniversity'),
                timestamp: new Date().toISOString()
            };

            // التحقق من صحة البيانات
            if (validateForm(formData)) {
                // حفظ البيانات في localStorage
                saveSubmission(formData);

                // عرض رسالة نجاح
                showSuccessMessage();

                // مسح النموذج بعد الإرسال
                form.reset();
            }
        });

        // معالج زر المسح
        form.addEventListener('reset', () => {
            const characterCount = document.querySelector('.character-count');
            if (characterCount) {
                characterCount.textContent = '0 / 2000 حرف';
            }
        });
    }
});

// ========================================
// وظائف مساعدة
// ========================================

/**
 * حفظ المشاركة في localStorage
 * @param {Object} data - بيانات المشاركة
 */
function saveSubmission(data) {
    // توليد معرف فريد للمشاركة
    const id = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // إضافة المعرف والحالة الافتراضية للبيانات
    const submission = {
        id: id,
        ...data,
        status: 'pending' // الحالة الافتراضية
    };

    // جلب المشاركات الحالية
    let submissions = [];
    const stored = localStorage.getItem('submissions');
    if (stored) {
        try {
            submissions = JSON.parse(stored);
        } catch (e) {
            console.error('خطأ في قراءة البيانات:', e);
            submissions = [];
        }
    }

    // إضافة المشاركة الجديدة
    submissions.push(submission);

    // حفظ في localStorage
    localStorage.setItem('submissions', JSON.stringify(submissions));

    console.log('تم حفظ المشاركة بنجاح:', submission);
}

/**
 * التحقق من صحة بيانات النموذج
 * @param {Object} data - بيانات النموذج
 * @returns {boolean} - true إذا كانت البيانات صحيحة
 */
function validateForm(data) {
    // التحقق من الحقول المطلوبة
    if (!data.studentName || !data.studentId || !data.faculty ||
        !data.year || !data.email || !data.title || !data.content) {
        alert('برجاء ملء جميع الحقول المطلوبة');
        return false;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        alert('برجاء إدخال بريد إلكتروني صحيح');
        return false;
    }

    // التحقق من طول المحتوى
    if (data.content.length < 10) {
        alert('برجاء كتابة تفاصيل أكثر (على الأقل 10 أحرف)');
        return false;
    }

    return true;
}

/**
 * عرض رسالة نجاح بعد إرسال النموذج
 */
function showSuccessMessage() {
    // إنشاء عنصر الرسالة
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px 50px;
        border-radius: 20px;
        font-size: 1.3rem;
        font-weight: 700;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        text-align: center;
        animation: fadeIn 0.5s ease-in-out;
    `;
    message.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">✓</div>
        <div>تم إرسال مشاركتك بنجاح!</div>
        <div style="font-size: 1rem; margin-top: 10px; opacity: 0.9;">
            سيتم الرد عليك قريباً عبر البريد الإلكتروني
        </div>
    `;

    document.body.appendChild(message);

    // إزالة الرسالة بعد 3 ثواني
    setTimeout(() => {
        message.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            document.body.removeChild(message);
            // العودة للصفحة الرئيسية
            window.location.href = 'index.html';
        }, 500);
    }, 3000);
}

// ========================================
// تأثيرات CSS إضافية للأنيميشن
// ========================================

// إضافة تأثير fadeOut للأنيميشن
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
`;
document.head.appendChild(style);