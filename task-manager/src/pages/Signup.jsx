
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../api/authApi";

import {
  validateEmail,
  validateMobile,
  validatePassword,
  validatePasswordMatch
} from "../utils/auth";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((oldData) => ({
      ...oldData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const {
      fullName,
      email,
      mobileNumber,
      password,
      confirmPassword,
    } = formData;

    if (
      !fullName.trim() ||
      !email.trim() ||
      !mobileNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!validateMobile(mobileNumber)) {
      setMessage("Please enter a valid mobile number.");
      return;
    }

    if (!validatePassword(password)) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await signupUser(formData);

      alert(data.message || "Registration successful!");

      setFormData({
        fullName: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login");

    } catch (error) {
      setMessage(error.message || "Unable to register.");

    } finally {
      setLoading(false);
    }
  }

  const labelClass =
    "block w-full text-left text-sm font-semibold text-[#142653]";

  const inputClass =
    "mt-1.5 block w-full box-border rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[#142653] placeholder:text-gray-400 outline-none transition duration-200 focus:border-[#5542e5] focus:ring-2 focus:ring-[#5542e5]/15 disabled:cursor-not-allowed disabled:bg-gray-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5fc] px-4 py-5 sm:px-6">

      <div className="w-full max-w-[460px] rounded-xl bg-white px-5 py-5 shadow-[0_8px_30px_rgba(20,38,83,0.08)] sm:px-7 sm:py-6">

        <div className="mb-5 text-center">
          <h1 className="m-0 text-xl font-bold leading-none tracking-tight text-[#142653] sm:text-lg">
            Create Account
          </h1>

          <p className="m-0 mt-1 text-sm leading-none text-gray-500">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">

            <div className="w-full">
              <label className={labelClass} htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="w-full">
              <label className={labelClass} htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="w-full sm:col-span-2">
              <label className={labelClass} htmlFor="mobileNumber">
                Mobile Number
              </label>

              <input
                id="mobileNumber"
                type="tel"
                name="mobileNumber"
                placeholder="Enter your mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                autoComplete="tel"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="w-full sm:col-span-2">
              <label className={labelClass} htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="w-full sm:col-span-2">
              <label
                className={labelClass}
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

          </div>

          {message && (
            <p
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
              role="alert"
            >
              {message}
            </p>
          )}

          <button
            className="mt-5 block w-full rounded-lg bg-[#5542e5] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#4432cc] focus:outline-none focus:ring-2 focus:ring-[#5542e5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}

          <Link
            to="/auth/login"
            className="font-semibold text-[#5542e5] transition hover:text-[#4432cc] hover:underline"
          >
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;
