// Login page functionality
import { login, signup } from '../auth.js';

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
        usernameInput.querySelector('label')?.textContent = 'Email';
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

    // Basic validation
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Show loading state
      const originalText = submitButton.textContent;
      submitButton.textContent = isSignupMode ? 'SIGNING UP...' : 'LOGGING IN...';
      submitButton.disabled = true;

      if (isSignupMode) {
        // Handle signup
        const username = email.split('@')[0]; // Extract username from email
        const { user, error } = await signup(email, password, username);

        if (error) {
          throw error;
        }

        alert('Account created successfully! Please check your email to verify your account.');
        // Switch back to login mode
        isSignupMode = false;
        welcomeTitle.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to continue to CoachTzy';
        submitButton.textContent = 'LOGIN';
        signupText.textContent = "Don't have an account?";
        signupLink.textContent = 'Sign Up';
        loginForm.reset();
      } else {
        // Handle login
        const { user, error } = await login(email, password);

        if (error) {
          throw error;
        }

        // Check if user profile exists in database
        const { supabase } = await import('../supabase-client.js');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single();

        if (profileError || !profile) {
          // User authenticated but profile doesn't exist
          alert('User profile not found in database. Please contact support or try signing up again.');
          const { logout } = await import('../auth.js');
          await logout();
          submitButton.textContent = 'LOGIN';
          submitButton.disabled = false;
          return;
        }

        // Success - redirect to dashboard
        window.location.href = 'index.html';
      }

      submitButton.textContent = originalText;
      submitButton.disabled = false;
    } catch (error) {
      console.error(isSignupMode ? 'Signup error:' : 'Login error:', error);
      
      // Show user-friendly error messages
      let errorMessage = error.message;
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = '❌ User does not exist or invalid password.\n\nPlease check your credentials or sign up for a new account.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = '⚠️ Please verify your email before logging in.\n\nCheck your inbox (and spam folder) for the verification link.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = '⚠️ This email is already registered.\n\nPlease use the login form instead.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = '❌ Invalid email format. Please enter a valid email address.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = '❌ No account found with this email.\n\nPlease sign up to create a new account.';
      }
      
      alert(errorMessage || (isSignupMode ? 'Signup failed. Please try again.' : 'Login failed. Please check your credentials.'));
      
      // Reset button
      submitButton.textContent = isSignupMode ? 'SIGN UP' : 'LOGIN';
      submitButton.disabled = false;
    }
  });
});
