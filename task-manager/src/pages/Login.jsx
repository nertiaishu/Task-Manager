
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { loginUser } from "../api/authApi";
import { validateEmail } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      
      const data = await loginUser(email, password);

      sessionStorage.setItem("authToken", data.token);

      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate(location.state?.from || "/tasks", {
        replace: true,
        state: {
          message: "Login successful!",
        },
      });

    } catch (error) {
      setMessage(error.message || "Unable to log in.");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="box-border flex min-h-screen items-center justify-center bg-[#f3f5fc] px-3 py-5 font-['Segoe_UI',Arial,sans-serif] text-[#142653] sm:px-5 sm:py-[30px]">

      <div className="w-full max-w-[480px] rounded-[14px] border border-[#edf0fa] bg-white px-[22px] py-[30px] shadow-[0_10px_35px_rgba(35,50,100,0.08)] sm:px-9 sm:py-[38px]">

        <div className="mb-8 text-center">
          <h1 className="text-[29px] font-bold text-[#142653] sm:text-[34px]">
            Welcome Back
          </h1>

          <p className="mt-[10px] text-[17px] text-[#7180a0]">
            Login to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="mb-[22px] min-w-0">
            <label
              htmlFor="loginEmail"
              className="mb-[9px] block text-left text-base font-semibold text-[#142653]"
            >
              Email
            </label>

            <input
              id="loginEmail"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="username"
              className="block h-[52px] w-full rounded-lg border border-[#d7deef] bg-white px-4 text-[15px] text-[#142653] outline-none placeholder:text-[#8492b0] focus:border-[#5945e8] focus:ring-[3px] focus:ring-[rgba(89,69,232,0.1)]"
            />
          </div>

          <div className="mb-[22px] min-w-0">
            <label
              htmlFor="loginPassword"
              className="mb-[9px] block text-left text-base font-semibold text-[#142653]"
            >
              Password
            </label>

            <input
              id="loginPassword"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              className="block h-[52px] w-full rounded-lg border border-[#d7deef] bg-white px-4 text-[15px] text-[#142653] outline-none placeholder:text-[#8492b0] focus:border-[#5945e8] focus:ring-[3px] focus:ring-[rgba(89,69,232,0.1)]"
            />
          </div>

          {message && (
            <p
              className="mt-[15px] text-center text-sm text-[#c62828]"
              role="alert"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-[54px] w-full cursor-pointer rounded-lg border-0 bg-[#5542e5] text-[17px] font-semibold text-white hover:bg-[#4433c8] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-[26px] text-center text-[15px] text-[#7180a0]">
          Don't have an account?{" "}

          <Link
            to="/auth/signup"
            className="font-semibold text-[#5542e5]"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
