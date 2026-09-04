import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../features/auth/authSlice.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) navigate("/account");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-soft shadow-sm p-8">
        <h1 className="font-display text-2xl text-ink mb-1">Welcome back</h1>
        <p className="text-sm text-ink/60 mb-6">Log in to your Little Sprout account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              {...field("email")}
              className="w-full rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...field("password")}
              className="w-full rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600"
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-soft bg-sage-600 text-white py-2 font-medium hover:bg-sage-700 transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          New here? <Link to="/register" className="text-sage-600 font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
