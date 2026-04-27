/**
 * auth.js - Registration and Login dispatching
 */

document.addEventListener("DOMContentLoaded", () => {
    // If we're on the login page but already have a token, bounce straight to dashboard safely
    if (localStorage.getItem("jwt_token")) {
        window.location.href = "dashboard.html";
        return;
    }

    const authBox = document.getElementById("auth-box");
    
    // Password Visibility Toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '👁️‍🗨️';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
                }
            }
        });
    });
    
    // Toggles between forms
    const btnShowReg = document.getElementById("show-register");
    const btnShowLog = document.getElementById("show-login");

    if (btnShowReg) {
        btnShowReg.addEventListener("click", () => {
            authBox.classList.add("mode-register");
        });
    }

    if (btnShowLog) {
        btnShowLog.addEventListener("click", () => {
            authBox.classList.remove("mode-register");
        });
    }

    // Handle Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("log-username").value;
            const password = document.getElementById("log-password").value;

            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password })
            });

            if (res && res.token) {
                // Securely save JWT
                localStorage.setItem("jwt_token", res.token);
                localStorage.setItem("user_data", JSON.stringify(res.user));
                
                showToast("Login successful! Redirecting...", "success");
                setTimeout(() => window.location.href = "dashboard.html", 800);
            }
        });
    }

    // Handle Registration
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("reg-username").value;
            const email = document.getElementById("reg-email").value;
            const password = document.getElementById("reg-password").value;

            const res = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password })
            });

            if (res && res.message && res.message.includes("successfully")) {
                showToast("Account created! Please log in.", "success");
                authBox.classList.remove("mode-register");
                
                // Prefill login username
                document.getElementById("log-username").value = username;
                document.getElementById("log-password").value = password; // Convenient for user
                document.getElementById("reg-password").value = "";
            }
        });
    }
});
