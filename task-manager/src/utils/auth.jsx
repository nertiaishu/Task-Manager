
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateMobile = (mobileNumber) => {
  return /^\+?[0-9]{10,15}$/.test(mobileNumber);
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};