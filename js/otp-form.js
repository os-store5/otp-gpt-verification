document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");
  const formMessage = document.getElementById("formMessage");
  const submitBtn = document.querySelector("button[type='submit']");

  const showToast = (msg, type = "is-info", withSpinner = false, callback = null) => {
    const toast = document.createElement("div");
    toast.className = `notification ${type} is-light has-text-centered`;
    toast.style.position = "fixed";
    toast.style.top = "1rem";
    toast.style.right = "1rem";
    toast.style.zIndex = "9999";
    toast.style.maxWidth = "300px";
    toast.innerHTML = withSpinner
      ? `<span class="icon is-small is-left"><i class="fas fa-circle-notch fa-spin"></i></span> ${msg}`
      : msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
      if (callback) callback();
    }, 5000);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    showToast("جاري إرسال الطلب...", "is-info", true);
    formMessage.innerHTML = "";

    try {
      const res = await fetch("/.netlify/functions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });

      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || "حدث خطأ أثناء تنفيذ الطلب.");
      }

      form.remove();
      formMessage.innerHTML = `
        <div class="box has-background-dark has-text-white has-text-centered">
          <p class="title is-5 has-text-white">🎮 كود التحقق الخاص بك</p>
          ${createOtpField(result.otp)}
          <p class="has-text-warning mt-4">⏳ سيتم إخفاء الكود بعد 30 ثانية لأمانك.</p>
        </div>
      `;

      setTimeout(() => {
        formMessage.innerHTML = '<div class="notification is-warning has-text-centered">⏳ انتهى الوقت. تم إخفاء الكود.</div>';
        form.reset();
        grecaptcha.reset();
        document.body.appendChild(form);
      }, 30000);
    } catch (err) {
      formMessage.innerHTML = "";
      showToast(err.message || "حدث خطأ أثناء إرسال الطلب.", "is-danger", false, () => submitBtn.disabled = false);
      grecaptcha.reset();
    }
  });

  function createOtpField(otpValue) {
    const otpId = `otp-${Math.random().toString(36).substring(2, 10)}`;
    setTimeout(() => {
      const copyBtn = document.getElementById(otpId);
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(otpValue).then(() => {
            showToast("✅ تم نسخ الكود!", "is-success");
          });
        });
      }
    }, 0);

    return `
      <div class="field">
        <div class="control has-icons-right">
          <input class="input" type="text" readonly value="${otpValue}" />
          <span class="icon is-small is-right is-clickable" id="${otpId}" style="cursor:pointer">
            <i class="fa fa-copy"></i>
          </span>
        </div>
      </div>
    `;
  }
});
