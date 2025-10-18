// Password Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.querySelector('.eye-icon');
  const eyeOffIcon = document.querySelector('.eye-off-icon');

  if (passwordToggle) {
    passwordToggle.addEventListener('click', function() {
      // Toggle password visibility
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      } else {
        passwordInput.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      }
    });
  }

  // Form submission handler
  const loginForm = document.querySelector('.login-form-card');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe').checked;

      // Here you would typically send a request to your backend
      console.log('Login attempt:', { username, password, rememberMe });

      // For demo purposes, redirect to dashboard
      // In production, only redirect after successful authentication
      if (username && password) {
        // Simulate successful login
        alert('Login successful! Redirecting to dashboard...');
        window.location.href = 'index.html';
      }
    });
  }
});
