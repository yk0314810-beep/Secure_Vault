/* =========================================================
   SECUREVAULT — REGISTER PAGE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const registerForm = document.getElementById("registerForm");

    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const passwordToggle = document.getElementById("passwordToggle");
    const confirmPasswordToggle = document.getElementById(
        "confirmPasswordToggle"
    );

    const registerBtn = document.getElementById("registerBtn");
    const googleSignupBtn = document.getElementById("googleSignupBtn");

    const registerMessage = document.getElementById("registerMessage");

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById(
        "confirmPasswordError"
    );

    const reqLength = document.getElementById("reqLength");
    const reqUppercase = document.getElementById("reqUppercase");
    const reqNumber = document.getElementById("reqNumber");
    const reqSpecial = document.getElementById("reqSpecial");

    const passwordStrengthBar = document.getElementById(
        "passwordStrengthBar"
    );

    const passwordStrengthText = document.getElementById(
        "passwordStrengthText"
    );


    /* =====================================================
       PASSWORD REQUIREMENTS
       ===================================================== */

    function checkPasswordRequirements(password) {

        return {
            length: password.length >= 8,

            uppercase: /[A-Z]/.test(password),

            number: /[0-9]/.test(password),

            special: /[^A-Za-z0-9]/.test(password)
        };
    }


    /* =====================================================
       UPDATE PASSWORD REQUIREMENTS UI
       ===================================================== */

    function updateRequirement(element, valid) {

        if (!element) return;

        const icon = element.querySelector("span");

        if (valid) {

            element.classList.add("valid");

            if (icon) {
                icon.textContent = "✓";
            }

        } else {

            element.classList.remove("valid");

            if (icon) {
                icon.textContent = "○";
            }
        }
    }

    function updatePasswordRequirements() {

        const password = passwordInput.value;

        const requirements =
            checkPasswordRequirements(password);

        updateRequirement(
            reqLength,
            requirements.length
        );

        updateRequirement(
            reqUppercase,
            requirements.uppercase
        );

        updateRequirement(
            reqNumber,
            requirements.number
        );

        updateRequirement(
            reqSpecial,
            requirements.special
        );
    }


    /* =====================================================
       PASSWORD STRENGTH
       ===================================================== */

    function calculatePasswordStrength(password) {

        if (!password) {
            return {
                score: 0,
                text: "—"
            };
        }

        let score = 0;

        const requirements =
            checkPasswordRequirements(password);


        /* Basic length */

        if (requirements.length) {
            score++;
        }


        /* Uppercase */

        if (requirements.uppercase) {
            score++;
        }


        /* Number */

        if (requirements.number) {
            score++;
        }


        /* Special character */

        if (requirements.special) {
            score++;
        }


        /* Extra strength */

        if (password.length >= 12) {
            score++;
        }


        /* Extra combination */

        if (
            password.length >= 14 &&
            requirements.uppercase &&
            requirements.number &&
            requirements.special
        ) {
            score++;
        }


        if (score <= 2) {

            return {
                score: 1,
                text: "Weak"
            };

        }

        if (score <= 4) {

            return {
                score: 2,
                text: "Medium"
            };

        }

        if (score <= 5) {

            return {
                score: 3,
                text: "Strong"
            };

        }

        return {
            score: 4,
            text: "Very Strong"
        };
    }


    /* =====================================================
       UPDATE PASSWORD STRENGTH UI
       ===================================================== */

    function updatePasswordStrength() {

        const password = passwordInput.value;

        const strength =
            calculatePasswordStrength(password);


        if (!password) {

            passwordStrengthBar.style.width = "0%";

            passwordStrengthText.textContent = "—";

            passwordStrengthBar.className =
                "sv-strength-progress";

            return;
        }


        const widthMap = {
            1: "25%",
            2: "50%",
            3: "75%",
            4: "100%"
        };


        passwordStrengthBar.style.width =
            widthMap[strength.score];


        passwordStrengthText.textContent =
            strength.text;


        passwordStrengthBar.className =
            "sv-strength-progress";


        passwordStrengthBar.classList.add(
            `strength-${strength.score}`
        );
    }


    /* =====================================================
       VALIDATION FUNCTIONS
       ===================================================== */

    function validateName() {

        const name =
            nameInput.value.trim();


        if (!name) {

            showFieldError(
                nameInput,
                nameError,
                "Please enter your full name."
            );

            return false;
        }


        if (name.length < 2) {

            showFieldError(
                nameInput,
                nameError,
                "Name must contain at least 2 characters."
            );

            return false;
        }


        if (!/^[A-Za-z\s.'-]+$/.test(name)) {

            showFieldError(
                nameInput,
                nameError,
                "Please enter a valid name."
            );

            return false;
        }


        clearFieldError(
            nameInput,
            nameError
        );

        return true;
    }


    function validateEmail() {

        const email =
            emailInput.value.trim();


        if (!email) {

            showFieldError(
                emailInput,
                emailError,
                "Please enter your email address."
            );

            return false;
        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


        if (!emailPattern.test(email)) {

            showFieldError(
                emailInput,
                emailError,
                "Please enter a valid email address."
            );

            return false;
        }


        clearFieldError(
            emailInput,
            emailError
        );

        return true;
    }


    function validatePassword() {

        const password =
            passwordInput.value;


        if (!password) {

            showFieldError(
                passwordInput,
                passwordError,
                "Please create a password."
            );

            return false;
        }


        const requirements =
            checkPasswordRequirements(password);


        if (
            !requirements.length ||
            !requirements.uppercase ||
            !requirements.number ||
            !requirements.special
        ) {

            showFieldError(
                passwordInput,
                passwordError,
                "Please meet all password requirements."
            );

            return false;
        }


        clearFieldError(
            passwordInput,
            passwordError
        );

        return true;
    }


    function validateConfirmPassword() {

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (!confirmPassword) {

            showFieldError(
                confirmPasswordInput,
                confirmPasswordError,
                "Please confirm your password."
            );

            return false;
        }


        if (password !== confirmPassword) {

            showFieldError(
                confirmPasswordInput,
                confirmPasswordError,
                "Passwords do not match."
            );

            return false;
        }


        clearFieldError(
            confirmPasswordInput,
            confirmPasswordError
        );

        return true;
    }


    /* =====================================================
       ERROR HELPERS
       ===================================================== */

    function showFieldError(
        input,
        errorElement,
        message
    ) {

        input.classList.add("error");

        input.classList.remove("success");


        if (errorElement) {

            errorElement.textContent =
                message;

            errorElement.classList.add("show");
        }
    }


    function clearFieldError(
        input,
        errorElement
    ) {

        input.classList.remove("error");

        input.classList.add("success");


        if (errorElement) {

            errorElement.textContent = "";

            errorElement.classList.remove("show");
        }
    }


    /* =====================================================
       FORM VALIDATION
       ===================================================== */

    function validateForm() {

        const validName =
            validateName();

        const validEmail =
            validateEmail();

        const validPassword =
            validatePassword();

        const validConfirmPassword =
            validateConfirmPassword();


        const isValid =
            validName &&
            validEmail &&
            validPassword &&
            validConfirmPassword;


        registerBtn.disabled =
            !isValid;


        return isValid;
    }


    /* =====================================================
       CLEAR GLOBAL MESSAGE
       ===================================================== */

    function clearMessage() {

        registerMessage.textContent = "";

        registerMessage.className =
            "sv-register-message";
    }


    /* =====================================================
       SHOW GLOBAL MESSAGE
       ===================================================== */

    function showMessage(
        message,
        type = "info"
    ) {

        registerMessage.textContent =
            message;

        registerMessage.className =
            `sv-register-message ${type}`;
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
       ===================================================== */

    function togglePasswordVisibility(
        input,
        button
    ) {

        if (input.type === "password") {

            input.type = "text";

            button.textContent = "🙈";

            button.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            input.type = "password";

            button.textContent = "👁️";

            button.setAttribute(
                "aria-label",
                "Show password"
            );
        }
    }


    /* =====================================================
       PASSWORD TOGGLE EVENTS
       ===================================================== */

    passwordToggle.addEventListener(
        "click",
        () => {

            togglePasswordVisibility(
                passwordInput,
                passwordToggle
            );
        }
    );


    confirmPasswordToggle.addEventListener(
        "click",
        () => {

            togglePasswordVisibility(
                confirmPasswordInput,
                confirmPasswordToggle
            );
        }
    );


    /* =====================================================
       LIVE PASSWORD EVENTS
       ===================================================== */

    passwordInput.addEventListener(
        "input",
        () => {

            updatePasswordRequirements();

            updatePasswordStrength();

            clearMessage();

            validatePassword();

            if (confirmPasswordInput.value) {

                validateConfirmPassword();
            }

            validateForm();
        }
    );


    /* =====================================================
       LIVE CONFIRM PASSWORD
       ===================================================== */

    confirmPasswordInput.addEventListener(
        "input",
        () => {

            clearMessage();

            validateConfirmPassword();

            validateForm();
        }
    );


    /* =====================================================
       NAME INPUT
       ===================================================== */

    nameInput.addEventListener(
        "input",
        () => {

            clearMessage();

            validateName();

            validateForm();
        }
    );


    /* =====================================================
       EMAIL INPUT
       ===================================================== */

    emailInput.addEventListener(
        "input",
        () => {

            clearMessage();

            validateEmail();

            validateForm();
        }
    );


    /* =====================================================
       BLUR VALIDATION
       ===================================================== */

    nameInput.addEventListener(
        "blur",
        validateName
    );


    emailInput.addEventListener(
        "blur",
        validateEmail
    );


    passwordInput.addEventListener(
        "blur",
        validatePassword
    );


    confirmPasswordInput.addEventListener(
        "blur",
        validateConfirmPassword
    );


    /* =====================================================
       REGISTER FORM SUBMIT
       ===================================================== */
    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!validateForm()) {

                showMessage(
                    "Please fix the highlighted fields.",
                    "error"
                );

                return;
            }

            registerBtn.disabled = true;

            registerBtn.dataset.originalText =
                registerBtn.textContent;

            registerBtn.textContent =
                "Creating Account...";

            clearMessage();

            try {

                const name =
                    nameInput.value.trim();

                const email =
                    emailInput.value.trim();

                const password =
                    passwordInput.value;

                const response = await fetch(
                    "/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            password
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message || "Registration failed."
                    );

                }

                showMessage(
                    data.message ||
                    "Account created successfully! 🚀",
                    "success"
                );

                registerBtn.textContent =
                    "Account Created ✓";

                registerForm.reset();

                updatePasswordRequirements();
                updatePasswordStrength();

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Something went wrong. Please try again.",
                    "error"
                );

                registerBtn.disabled = false;

                registerBtn.textContent =
                    registerBtn.dataset.originalText ||
                    "Create Account 🔐";
            }

        }
    );    


    /* =====================================================
       GOOGLE SIGNUP
       ===================================================== */

    googleSignupBtn.addEventListener(
        "click",
        () => {

            showMessage(
                "Google signup will be connected soon.",
                "info"
            );

            console.log(
                "Google signup clicked"
            );
        }
    );


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    updatePasswordRequirements();

    updatePasswordStrength();

    registerBtn.disabled = true;

});