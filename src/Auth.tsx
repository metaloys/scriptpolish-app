import { useState } from 'react';
import { supabase } from './supabaseClient'; 

export default function Auth() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // --- 1. NEW STATE TO TOGGLE VISIBILITY ---
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      if (error.message.includes("Invalid login")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (signUpError) {
          alert(signUpError.message);
        } else {
          // This alert is for when email confirmation is ON.
          // Since you turned it off, they will just be logged in.
          alert('Signed up successfully! Please check your email to confirm.');
        }
      } else {
        alert(error.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          ScriptPolish AI
        </h1>
        <p className="text-center text-gray-600">
          Sign in or create an account to get started.
        </p>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            {/* --- 2. ADDED "relative" WRAPPER --- */}
            <div className="relative mt-1">
              <input
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                // --- 3. DYNAMIC TYPE ---
                type={showPassword ? "text" : "password"}
                placeholder="Your password (min. 6 chars)"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* --- 4. THE TOGGLE BUTTON --- */}
              <button
                type="button" // Prevents form submission
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  // Eye (Open) Icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 10.136 7.49 6.5 12 6.5c4.51 0 8.577 3.636 9.964 5.183a1.012 1.012 0 0 1 0 .639C20.577 13.864 16.49 17.5 12 17.5c-4.51 0-8.577-3.636-9.964-5.183Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  // Eye-Slashed (Closed) Icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.426 13.866 7.49 17.5 12 17.5c.996 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 6.5c4.51 0 8.577 3.636 9.964 5.183 0 .059 0 .119-.012.178M15.75 15.75l-2.071-2.071m-2.071-2.071-2.071-2.071m2.071 2.071L12 12m-2.071 2.071l-2.071 2.071m2.071-2.071L9.929 9.929M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In / Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}