// Login page functionality
import { login, signup, logout } from '../auth.js';
import { supabase } from '../supabase-client.js';

let isSignupMode = false;

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.login-form-card');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const eyeIcon = document.querySelector('.eye-icon');
  const eyeOffIcon = document.querySelector('.eye-off-icon');
  const signupLink = document.querySelector('.signup-link a');
  const welcomeTitle = document.querySelector('.login-welcome');
  const subtitle = document.querySelector('.login-subtitle');
  const submitButton = document.querySelector('.login-button');
  const signupText = document.querySelector('.signup-link span');

  // Create error message element
  function showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background-color: #f8d7da;
      color: #721c24;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #dc3545;
      font-size: 14px;
      animation: slideDown 0.3s ease;
    `;
    errorDiv.textContent = message;

    // Insert before the login button
    loginForm.insertBefore(errorDiv, submitButton);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
  }

  // Create success message element
  function showSuccess(message) {
    // Remove existing messages
    const existingMsg = document.querySelector('.success-message, .error-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      background-color: #d4edda;
      color: #155724;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #28a745;
      font-size: 14px;
      animation: slideDown 0.3s ease;
    `;
    successDiv.textContent = message;

    loginForm.insertBefore(successDiv, submitButton);
  }

  // Show loading state
  function setLoading(loading) {
    submitButton.disabled = loading;
    if (loading) {
      submitButton.innerHTML = '<span class="loading-spinner"></span> Loading...';
      submitButton.style.opacity = '0.7';
    } else {
      submitButton.textContent = isSignupMode ? 'SIGN UP' : 'LOGIN';
      submitButton.style.opacity = '1';
    }
  }

  // Password toggle visibility
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      
      if (type === 'password') {
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      } else {
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      }
    });
  }

  // Toggle between login and signup
  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignupMode = !isSignupMode;
      
      if (isSignupMode) {
        // Switch to signup mode
        welcomeTitle.textContent = 'Create Account';
        subtitle.textContent = 'Sign up to start using CoachTzy';
        submitButton.textContent = 'SIGN UP';
        signupText.textContent = 'Already have an account?';
        signupLink.textContent = 'Sign In';
        usernameInput.placeholder = 'Enter your email';
      } else {
        // Switch to login mode
        welcomeTitle.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to continue to CoachTzy';
        submitButton.textContent = 'LOGIN';
        signupText.textContent = "Don't have an account?";
        signupLink.textContent = 'Sign Up';
        usernameInput.placeholder = 'Enter your username or email';
      }
    });
  }

  // Handle form submission (login or signup)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    // Basic validation
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignupMode) {
        // SIGNUP MODE
        console.log('Attempting signup for:', email);
        
        const username = email.split('@')[0]; // Extract username from email
        const { user } = await signup(email, password, username);

        console.log('Signup successful:', user);
        showSuccess('Account created! Please check your email to verify your account.');
        
        // Switch back to login mode after 3 seconds
        setTimeout(() => {
          isSignupMode = false;
          welcomeTitle.textContent = 'Welcome Back';
          subtitle.textContent = 'Sign in to continue to CoachTzy';
          submitButton.textContent = 'LOGIN';
          signupText.textContent = "Don't have an account?";
          signupLink.textContent = 'Sign Up';
          loginForm.reset();
          setLoading(false);
        }, 3000);

      } else {
        // LOGIN MODE
        console.log('Attempting login for:', email);
        
        // Step 1: Authenticate with Supabase
        const { user, session } = await login(email, password);
        console.log('Authentication successful:', user);

        // Step 2: Check if profile exists in database
        console.log('Checking for profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile check error:', profileError);
          
          if (profileError.code === 'PGRST116') {
            // No profile found
            await logout();
            showError('User profile not found in database. Please contact support or sign up again.');
            setLoading(false);
            return;
          }
          throw profileError;
        }

        console.log('Profile found:', profile);

        // Step 3: Save session if remember me
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          console.log('Remember me enabled');
        }

        // Step 4: Success - redirect to dashboard
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      }

    } catch (error) {
      console.error('Error:', error);
      setLoading(false);

      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        showError('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        showError('Please verify your email address before logging in.');
      } else if (error.message.includes('User not found')) {
        showError('No account found with this email address.');
      } else if (error.message.includes('User already registered')) {
        showError('An account with this email already exists. Please login.');
      } else if (error.message.includes('Failed to fetch')) {
        showError('Network error. Please check your internet connection.');
      } else {
        showError(`Error: ${error.message}`);
      }
    }
  });

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  console.log('Login page initialized');
});
