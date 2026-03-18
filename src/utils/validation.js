// src/utils/validation.js

export const validateName = (name) => {
  const regex = /^[a-zA-Z\s]+$/;
  if (!name) return "Name is required.";
  if (name.length > 15) return "Name must be 15 characters or less."; // NEW CHECK
  if (!regex.test(name)) return "Name can only contain letters and spaces.";
  return null;
};

export const validatePhone = (phone) => {
  const regex = /^\d{10}$/;
  if (!phone) return "Phone number is required.";
  if (!regex.test(phone)) return "Phone number must be exactly 10 digits.";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password needs a number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password needs a special character.";
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
};