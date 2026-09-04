import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register as registerUser } from "../features/auth/authSlice.js";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) navigate("/account");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-soft shadow-sm p-8">
        <h1 className="font-display text-2xl text-ink mb-1">Create your account</h1>
        <p className="text-sm text-ink/60 mb-6">Join Little Sprout for faster checkout and order tracking.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Full name</label>
            <input id="name" {...field("name")} className="w-full rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" {...field("email")} className="w-full rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input id="password" type="password" {...field("password")} className="w-full rounded-soft border border-sage-100 px-3 py-2 focus:border-sage-600" />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-soft bg-sage-600 text-white py-2 font-medium hover:bg-sage-700 transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-sage-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
