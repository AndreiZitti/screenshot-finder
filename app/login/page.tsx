"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, clearSupabaseCookies } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Clear any stale auth state before allowing login
  useEffect(() => {
    async function clearStaleSession() {
      // 1. Nuke cookies directly — stops any in-progress refresh loops
      clearSupabaseCookies();
      // 2. Tell Supabase client to clear its in-memory session (no API call)
      const client = createClient();
      await client.auth.signOut({ scope: 'local' });
      // 3. Reset the singleton so handleLogin creates a fresh client
      if (typeof window !== 'undefined') {
        window.__supabaseClient = undefined;
      }
      setReady(true);
    }
    clearStaleSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    const supabase = createClient();
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Guest mode */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Need an account? Contact{' '}
          <a 
            href="https://zitti.ro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            zitti
          </a>
        </p>
      </div>
    </div>
  );
}
