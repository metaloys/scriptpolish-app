// --- PASTE YOUR RENDER URL HERE ---
const API_URL = 'https://scriptpolish-server.onrender.com';
// -----------------------------------

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import FAQ from './FAQ';
import HistoryPage from './HistoryPage';
import SettingsPage from './SettingsPage';
import type { Session, User } from '@supabase/supabase-js';
import { initializePaddle } from '@paddle/paddle-js';
import type { Paddle } from '@paddle/paddle-js';

// ---================================---
// --- V4 NAVBAR COMPONENT (No changes)
// ---================================---
function Navbar({ user, onSignOut }: { user: User, onSignOut: () => void }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { 
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-white">
              ScriptPolish AI
            </Link>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link 
                to="/profile"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                My Voice Profile
              </Link>
              <Link 
                to="/history"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                History
              </Link>
              <Link 
                to="/faq"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Help / FAQ
              </Link>
            </div>
            <div className="relative ml-4" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">Open user menu</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    Signed in as<br/>
                    <strong className="truncate block">{user.email}</strong>
                  </div>
                  <Link 
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <a
                    href="#"
                    onClick={onSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ---================================---
// --- V4 PROFILE PAGE COMPONENT (No changes)
// ---================================---
function ProfilePage({ user }: { user: User }) {
  // ... (This component is identical to before)
  const [examples, setExamples] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [newScriptText, setNewScriptText] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    const paddleClientKey = import.meta.env.VITE_PADDLE_CLIENT_KEY;
    if (!paddleClientKey) {
      console.error("Paddle client key is missing. Check .env.local or Vercel variables.");
      return;
    }
    initializePaddle({
      token: paddleClientKey,
      environment: 'sandbox', 
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [user.id]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const { data: examplesData, error: examplesError } = await supabase
        .from('voice_examples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (examplesError) throw examplesError;
      setExamples(examplesData || []);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('patterns_extracted_at, subscription_status')
        .eq('id', user.id)
        .single();
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      setProfile(profileData);
      
    } catch (error: any) {
      console.error('Error fetching profile data:', error.message);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptText.trim()) return;
    setStatus('Adding script...');
    try {
      const { error } = await supabase.from('voice_examples').insert({
        user_id: user.id,
        script_text: newScriptText,
        topic_category: 'General',
        quality_score: 100,
        word_count: newScriptText.split(' ').length,
      });
      if (error) throw error;
      setNewScriptText('');
      setStatus('New script added successfully!');
      fetchProfileData();
    } catch (error: any) {
      console.error('Error adding script:', error.message);
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleDeleteScript = async (exampleId: number) => {
    if (!window.confirm('Are you sure you want to delete this example?')) return;
    try {
      const { error } = await supabase.from('voice_examples').delete().eq('id', exampleId);
      if (error) throw error;
      setStatus('Example deleted.');
      fetchProfileData();
    } catch (error: any) {
      console.error('Error deleting script:', error.message);
      setStatus(`Error: ${error.message}`);
    }
  };
  
  const handleAnalyzeVoice = async () => {
    if (examples.length < 2) {
      alert('Please add at least 2 script examples before analyzing.');
      return;
    }
    setIsLoading(true);
    setStatus('Analyzing your voice... This may take a moment.');
    try {
      const response = await fetch(`${API_URL}/analyze-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await response.json();
      console.log('Analysis successful:', data.patterns);
      setStatus('Success! Your voice profile has been updated.');
      fetchProfileData();
    } catch (error: any) {
      console.error('Error analyzing voice:', error.message);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckout = () => {
    const priceId = import.meta.env.VITE_PADDLE_PRICE_ID;
    if (!paddle || !priceId) {
      alert("Payment system is not ready. Please refresh the page.");
      return;
    }
    if (!user.email) {
      alert("Error: Your user email could not be found. Unable to start checkout.");
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: {
        email: user.email,
      },
      customData: {
        user_id: user.id,
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Billing</h2>
        {isLoading ? (
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading subscription status...</p>
        ) : profile?.subscription_status === 'active' ? (
          <p className="mt-2 text-lg text-green-700 dark:text-green-400 font-medium">
            Subscription: Active
          </p>
        ) : (
          <div>
            <p className="mt-2 text-lg text-red-700 dark:text-red-400 font-medium">
              Subscription: Inactive
            </p>
            <button
              onClick={handleCheckout}
              disabled={!paddle || isLoading}
              className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Voice Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          This is your "learning engine." Add your best, 100% human-written scripts here.
          After you add or delete scripts, click "Analyze My Voice" to update your AI profile.
        </p>
        
        {profile?.patterns_extracted_at && (
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            Last analyzed: {new Date(profile.patterns_extracted_at).toLocaleString()}
          </p>
        )}
        
        <button
          onClick={handleAnalyzeVoice}
          disabled={isLoading || examples.length < 2}
          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : `Analyze My Voice (${examples.length} Examples)`}
        </button>
        {status && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{status}</p>}
      </div>

      <form onSubmit={handleAddScript} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add a New Script Example</h2>
        <textarea
          className="w-full h-48 p-3 mt-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Paste a new, 100% human-written script here..."
          value={newScriptText}
          onChange={(e) => setNewScriptText(e.target.value)}
        ></textarea>
        <button
          type="submit"
          disabled={!newScriptText.trim()}
          className="mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
        >
          Add Example
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 p-6">
          Your Saved Examples
        </h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading && <li className="p-4 text-gray-500 dark:text-gray-400">Loading examples...</li>}
          {examples.length === 0 && !isLoading && (
            <li className="p-4 text-gray-500 dark:text-gray-400">You have no script examples. Add one above to get started.</li>
          )}
          {examples.map((example) => (
            <li key={example.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Topic: {example.topic_category} (Quality: {example.quality_score})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {example.script_text.substring(0, 100)}...
                </p>
              </div>
              <button
                onClick={() => handleDeleteScript(example.id)}
                className="ml-4 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---================================---
// --- V4 SCRIPT EDITOR COMPONENT (No changes)
// ---================================---
function ScriptEditor({ user }: { user: User }) {
  // ... (This entire component is identical to before)
  const [rawScript, setRawScript] = useState<string>(() => {
    return localStorage.getItem('rawScriptDraft') || '';
  });
  const [polishedScript, setPolishedScript] = useState<string>('');
  const [finalScript, setFinalScript] = useState<string>(() => {
    return localStorage.getItem('finalScriptDraft') || '';
  });
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [profileStatus, setProfileStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLearning, setIsLearning] = useState<boolean>(false);

  useEffect(() => {
    async function checkProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('voice_patterns')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data && data.voice_patterns) {
          setProfileStatus('ready');
        } else {
          setProfileStatus('missing');
        }
      } catch (error: any) {
        console.error('Error checking profile:', error.message);
        setProfileStatus('missing');
      }
    }
    checkProfile();
  }, [user.id]);
  
  useEffect(() => {
    setFinalScript(polishedScript);
  }, [polishedScript]);

  useEffect(() => {
    if (rawScript) {
      localStorage.setItem('rawScriptDraft', rawScript);
    } else {
      localStorage.removeItem('rawScriptDraft');
    }
  }, [rawScript]);

  useEffect(() => {
    if (finalScript) {
      localStorage.setItem('finalScriptDraft', finalScript);
    } else {
      localStorage.removeItem('finalScriptDraft');
    }
  }, [finalScript]);

  const handlePolishScript = async () => {
    setIsLoading(true);
    setPolishedScript('');
    setFinalScript('');
    setHistoryId(null);
    try {
      const response = await fetch(`${API_URL}/polish`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawScript: rawScript,
          userId: user.id
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Something went wrong');
      }
      const data = await response.json();
      setPolishedScript(data.polishedScript);
      setHistoryId(data.historyId);
    } catch (error: any) {
      console.error('Error polishing script:', error.message);
      setPolishedScript(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!historyId) {
      alert("Error: Cannot save, no polish history found. Please polish the script first.");
      return;
    }
    setIsLearning(true);
    try {
      const response = await fetch(`${API_URL}/save-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          historyId: historyId,
          aiPolishedScript: polishedScript,
          userFinalScript: finalScript
        }),
      });
      if (!response.ok) throw new Error('Learning failed');
      const data = await response.json();
      console.log("Learning saved!", data);
      
      setRawScript('');
      setPolishedScript('');
      setFinalScript('');
      setHistoryId(null);
      
      alert("Success! Your edit has been saved as a new example. Re-analyze your voice on your profile page to include it in future polishes.");
    } catch (error: any) {
      console.error('Error learning from edits:', error.message);
      alert("Error: Could not save your edits. Please try again.");
    } finally {
      setIsLearning(false);
    }
  };
  
  if (profileStatus === 'loading') {
    return <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">Loading profile...</div>
  }
  
  if (profileStatus === 'missing') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome to ScriptPolish AI!</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          To get started, you need to create your "Voice Profile."
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Please go to your profile page, add 2-3 examples of your best writing, and click "Analyze My Voice."
        </p>
        <Link 
          to="/profile"
          className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700"
        >
          Go to My Voice Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Polishing Station</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Your V4 "Pattern-Matching" Voice Profile is loaded.
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="raw-script" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Raw Script to Polish
            </label>
            <textarea
              id="raw-script"
              className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Paste the script you want to fix here..."
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
            ></textarea>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="polished-script" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Polished Script (Editable)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (finalScript) {
                    navigator.clipboard.writeText(finalScript);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }
                }}
                disabled={!finalScript || isLoading || isLearning}
                className={`px-3 py-1 text-xs font-medium rounded-md ${isCopied ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150`}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              id="polished-script"
              className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 resize-none"
              placeholder="Your polished script will appear here..."
              value={finalScript}
              onChange={(e) => setFinalScript(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
      <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          onClick={handleSaveCorrection}
          disabled={isLoading || isLearning || !finalScript || !historyId}
        >
          {isLearning ? 'Saving...' : 'Save & Learn'}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          onClick={handlePolishScript}
          disabled={isLoading || isLearning || !rawScript}
        >
          {isLoading ? 'Polishing...' : 'Polish Script'}
        </button>
      </div>
    </div>
  );
}


// ---================================---
// --- V4 MAIN APP (ROUTER)
// ---================================---
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // --- NEW: This is the global theme loader ---
  // It runs ONCE, before anything else, to prevent "flash of light mode"
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Empty array means it runs only on initial app load

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (_event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Main layout for logged-in users
  const AppLayout = ({ user, children }: { user: User, children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar user={user} onSignOut={handleSignOut} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );

  // Layout for public pages
  const PublicLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-white">
                ScriptPolish AI
              </Link>
            </div>
            <div className="flex items-center">
              <Link 
                to="/faq"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Help / FAQ
              </Link>
              <Link 
                to="/"
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          !session ? (
            <Auth />
          ) : (
            <AppLayout user={session.user}>
              <ScriptEditor user={session.user} />
            </AppLayout>
          )
        }
      />
      <Route
        path="/profile"
        element={
          !session ? (
            <Auth />
          ) : (
            <AppLayout user={session.user}>
              <ProfilePage user={session.user} />
            </AppLayout>
          )
        }
      />
      <Route
        path="/history"
        element={
          !session ? (
            <Auth />
          ) : (
            <AppLayout user={session.user}>
              <HistoryPage />
            </AppLayout>
          )
        }
      />
      <Route
        path="/settings"
        element={
          !session ? (
            <Auth />
          ) : (
            <AppLayout user={session.user}>
              <SettingsPage />
            </AppLayout>
          )
        }
      />
      <Route 
        path="/faq" 
        element={
          !session ? (
            <PublicLayout>
              <FAQ />
            </PublicLayout>
          ) : (
            <AppLayout user={session.user}>
              <FAQ />
            </AppLayout>
          )
        } 
      />
    </Routes>
  );
}

export default App;