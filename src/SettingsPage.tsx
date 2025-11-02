import { useState } from 'react';
import { supabase } from './supabaseClient'; // Import our Supabase client

// --- A small helper component for the Eye/Eye-slashed icons ---
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 10.136 7.49 6.5 12 6.5c4.51 0 8.577 3.636 9.964 5.183a1.012 1.012 0 0 1 0 .639C20.577 13.864 16.49 17.5 12 17.5c-4.51 0-8.577-3.636-9.964-5.183Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.426 13.866 7.49 17.5 12 17.5c.996 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 6.5c4.51 0 8.577 3.636 9.964 5.183 0 .059 0 .119-.012.178M15.75 15.75l-2.071-2.071m-2.071-2.071-2.071-2.071m2.071 2.071L12 12m-2.071 2.071l-2.071 2.071m2.071-2.071L9.929 9.929M3 3l18 18" />
  </svg>
);


export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // --- 1. Client-side validation ---
    if (newPassword.length < 6) {
      setMessage({ type: 'error', content: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match. Please try again.' });
      setLoading(false);
      return;
    }

    // --- 2. Supabase API call ---
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', content: 'Your password has been updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
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
          
          {/* New Password Field */}
          <div>
            <label 
              htmlFor="new-password" 
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative mt-1">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeSlashedIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label 
              htmlFor="confirm-password" 
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeSlashedIcon /> : <EyeIcon />}
              </button>
            </div>
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
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
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