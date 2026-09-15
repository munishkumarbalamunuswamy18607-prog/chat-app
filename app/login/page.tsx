"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: displayName } },
        });
        if (error) throw error;

       if (data.user) {
  const tencentUserId = `u_${username.replace(/[^a-zA-Z0-9_-]/g, "")}`.slice(0, 32);
  const { error: profileError } = await supabase.from("users").insert({
    id: data.user.id,
    username,
    display_name: displayName,
    email,
    tencent_user_id: tencentUserId,  });
  if (profileError) {
    console.error("Profile insert failed:", profileError);
    throw profileError;
  }
}
      } else {
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Self-heal: if signup's insert failed earlier (e.g. because email
  // confirmation was pending at the time), create the profile row now —
  // we definitely have a real session at this point.
  if (signInData.user) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", signInData.user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("users").insert({
        id: signInData.user.id,
        username: signInData.user.user_metadata.username,
        display_name: signInData.user.user_metadata.display_name,
        email: signInData.user.email,
        tencent_user_id: `u_${signInData.user.user_metadata.username?.replace(/[^a-zA-Z0-9_-]/g, "")}`.slice(0, 32),
      });
    }
  }
}
      router.push("/chat");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Username (e.g. rahul)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                required
                minLength={2}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Display Name (e.g. Rahul)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-600">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignup(!isSignup)} className="text-blue-600 font-medium">
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

