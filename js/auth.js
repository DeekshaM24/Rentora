(() => {
  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  function clearFeedback(form) {
    const error = form.querySelector(".auth-error");
    const status = form.querySelector(".auth-status");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
    if (status) {
      status.textContent = "";
      status.hidden = true;
    }
  }

  function setError(form, message) {
    const error = form.querySelector(".auth-error");
    error.textContent = message;
    error.hidden = false;
    form.querySelector(":invalid")?.focus();
  }

  function setStatus(form, message) {
    const status = form.querySelector(".auth-status");
    status.textContent = message;
    status.hidden = false;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  function passwordMeetsPolicy(value) {
    return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  }

  function validPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  document.querySelectorAll(".auth-form").forEach((form) => {
    form.addEventListener("input", () => clearFeedback(form));
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", `${show ? "Hide" : "Show"} password`);
      button.setAttribute("aria-pressed", String(show));
      input.focus();
    });
  });

  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    const password = registerForm.elements.password;
    const strengthBar = document.querySelector("#password-strength-bar");
    const strengthLabel = document.querySelector("#password-strength-label");
    const strengthNames = ["Password strength", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["#7e7a78", "#e3b8b4", "#d5c39f", "#bbd5c7", "#9fcbb1"];

    password.addEventListener("input", () => {
      const score = passwordStrength(password.value);
      strengthBar.style.width = `${score * 25}%`;
      strengthBar.style.background = strengthColors[score];
      strengthLabel.textContent = strengthNames[score];
    });

    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback(registerForm);
      const invalid = registerForm.querySelector(":invalid");
      if (invalid) {
        setError(registerForm, invalid.validationMessage || "Complete all required fields.");
        return;
      }
      if (!validEmail(registerForm.elements.email.value)) {
        setError(registerForm, "Enter a valid email address.");
        registerForm.elements.email.focus();
        return;
      }
      if (!validPhone(registerForm.elements.phone.value)) {
        setError(registerForm, "Enter a phone number with 7 to 15 digits.");
        registerForm.elements.phone.focus();
        return;
      }
      if (!passwordMeetsPolicy(password.value)) {
        setError(registerForm, "Use at least 8 characters with uppercase, lowercase, a number, and a symbol.");
        password.focus();
        return;
      }
      if (password.value !== registerForm.elements.confirmPassword.value) {
        setError(registerForm, "Your passwords do not match.");
        registerForm.elements.confirmPassword.focus();
        return;
      }
      setStatus(registerForm, "Registration is not connected to a backend. No account was created and no information was sent or stored.");
    });
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback(loginForm);
      const invalid = loginForm.querySelector(":invalid");
      if (invalid) {
        setError(loginForm, invalid.validationMessage || "Enter your email and password.");
        return;
      }
      if (!validEmail(loginForm.elements.email.value)) {
        setError(loginForm, "Enter a valid email address.");
        loginForm.elements.email.focus();
        return;
      }
      setStatus(loginForm, "Login is not connected to a backend. No credentials were sent or saved.");
    });
  }

  const recoveryForm = document.querySelector("#recovery-form");
  if (recoveryForm) {
    recoveryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFeedback(recoveryForm);
      const invalid = recoveryForm.querySelector(":invalid");
      if (invalid) {
        setError(recoveryForm, invalid.validationMessage || "Enter your email address.");
        return;
      }
      if (!validEmail(recoveryForm.elements.email.value)) {
        setError(recoveryForm, "Enter a valid email address.");
        recoveryForm.elements.email.focus();
        return;
      }
      setStatus(recoveryForm, "Password recovery is not connected. No email was sent and the address was not stored.");
    });
  }

  const accountType = document.querySelector("#account-type");
  const selectedType = new URLSearchParams(window.location.search).get("type");
  if (accountType && ["renter", "owner"].includes(selectedType)) accountType.value = selectedType;
  document.querySelectorAll(".auth-submit").forEach((button) => { button.disabled = false; });
})();