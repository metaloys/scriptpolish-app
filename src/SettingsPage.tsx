import { useState } from 'react';
import { supabase } from './supabaseClient'; // Import our Supabase client

export default function SettingsPage() {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Make sure the password is strong enough
    if (password.length < 6) {
      setMessage({ type: 'error', content: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    try {
      // --- THIS IS THE FIX ---
      // I removed the stray underscore after { error }
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      // ---------------------

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', content: 'Your password has been updated successfully!' });
      setPassword(''); // Clear the input field
    } catch (error: any) {
      console.error('Error changing password:', error.message);
      setMessage({ type: 'error', content: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings.
        </p>
      </div>

      {/* Change Password Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-medium text-gray-900">Change Password</h2>
        <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
          <div>
            <label 
              htmlFor="new-password" 
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a new password (min. 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Status Message Area */}
          {message && (
            <div 
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.content}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}