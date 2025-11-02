// --- PASTE YOUR RENDER URL HERE ---
const API_URL = 'https://scriptpolish-server.onrender.com';
// -----------------------------------

import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import FAQ from './FAQ';
import type { Session, User } from '@supabase/supabase-js';

// --- FIX 1: Split Type and Value Imports ---
import { initializePaddle } from '@paddle/paddle-js';
import type { Paddle } from '@paddle/paddle-js'; // 'Paddle' is a type

// ---================================---
// --- V4 NAVBAR COMPONENT (No changes)
// ---================================---
function Navbar({ onSignOut }: { onSignOut: () => void }) {
  // ... (This component is identical to before)
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
            <Link 
              to="/profile"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              My Voice Profile
            </Link>
            <Link 
              to="/faq"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Help / FAQ
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="ml-4 bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">Sign out</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ---================================---
// --- V4 PROFILE PAGE COMPONENT (UPDATED)
// ---================================---
function ProfilePage({ user }: { user: User }) {
  const [examples, setExamples] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [newScriptText, setNewScriptText] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  // Initialize Paddle
  useEffect(() => {
    const paddleClientKey = import.meta.env.VITE_PADDLE_CLIENT_KEY;
    if (!paddleClientKey) {
      console.error("Paddle client key is missing. Check .env.local or Vercel variables.");
      return;
    }
    initializePaddle({
      token: paddleClientKey,
      environment: 'production',
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Get voice examples
      const { data: examplesData, error: examplesError } = await supabase
        .from('voice_examples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (examplesError) throw examplesError;
      setExamples(examplesData || []);

      // 2. Get main profile
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

  // ... (handleAddScript, handleDeleteScript, handleAnalyzeVoice are all identical) ...
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
  
  // --- FIX 2: Check for user.email before opening checkout ---
  const handleCheckout = () => {
    const priceId = import.meta.env.VITE_PADDLE_PRICE_ID;
    if (!paddle || !priceId) {
      alert("Payment system is not ready. Please refresh the page.");
      return;
    }

    // This check ensures user.email is a string, not undefined
    if (!user.email) {
      alert("Error: Your user email could not be found. Unable to start checkout.");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: {
        email: user.email, // This is now 100% safe and a valid string
      },
      customData: {
        user_id: user.id,
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      
      {/* --- BILLING SECTION --- */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900">Billing</h2>
        {isLoading ? (
          <p className="mt-2 text-gray-500">Loading subscription status...</p>
        ) : profile?.subscription_status === 'active' ? (
          <p className="mt-2 text-lg text-green-700 font-medium">
            Subscription: Active
          </p>
        ) : (
          <div>
            <p className="mt-2 text-lg text-red-700 font-medium">
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

      {/* ... (Rest of the ProfilePage component is identical) ... */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Voice Profile</h1>
        <p className="mt-2 text-gray-600">
          This is your "learning engine." Add your best, 100% human-written scripts here.
          After you add or delete scripts, click "Analyze My Voice" to update your AI profile.
        </p>
        
        {profile?.patterns_extracted_at && (
          <p className="mt-2 text-sm text-green-700">
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
        {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
      </div>

      <form onSubmit={handleAddScript} className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Add a New Script Example</h2>
        <textarea
          className="w-full h-48 p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
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

      <div className="bg-white shadow rounded-lg">
        <h2 className="text-lg font-medium text-gray-900 p-6">
          Your Saved Examples
        </h2>
        <ul className="divide-y divide-gray-200">
          {isLoading && <li className="p-4 text-gray-500">Loading examples...</li>}
          {examples.length === 0 && !isLoading && (
            <li className="p-4 text-gray-500">You have no script examples. Add one above to get started.</li>
          )}
          {examples.map((example) => (
            <li key={example.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Topic: {example.topic_category} (Quality: {example.quality_score})
                </p>
                <p className="text-sm text-gray-600 truncate">
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
  const [rawScript, setRawScript] = useState<string>('');
  const [polishedScript, setPolishedScript] = useState<string>('');
  const [finalScript, setFinalScript] = useState<string>('');
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
      alert("Success! Your edit has been saved as a new example. Re-analyze your voice on your profile page to include it in future polishes.");
    } catch (error: any) {
      console.error('Error learning from edits:', error.message);
      alert("Error: Could not save your edits. Please try again.");
    } finally {
      setIsLearning(false);
    }
  };
  
  if (profileStatus === 'loading') {
    return <div className="bg-white shadow rounded-lg p-6 text-center">Loading profile...</div>
  }
  
  if (profileStatus === 'missing') {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">Welcome to ScriptPolish AI!</h2>
        <p className="mt-2 text-gray-600">
          To get started, you need to create your "Voice Profile."
        </p>
        <p className="mt-2 text-gray-600">
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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Polishing Station</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your V4 "Pattern-Matching" Voice Profile is loaded.
        </D>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="raw-script" className="block text-sm font-medium text-gray-700 mb-1">
              Raw Script to Polish
            </label>
            <textarea
              id="raw-script"
              className="w-full h-96 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-800 bg-gray-50"
              placeholder="Paste the script you want to fix here..."
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
            ></textarea>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="polished-script" className="block text-sm font-medium text-gray-700">
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
              className="w-full h-96 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 resize-none text-gray-800 bg-gray-50"
              placeholder="Your polished script will appear here..."
              value={finalScript}
              onChange={(e) => setFinalScript(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
      <div className="flex justify-between p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
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

  const AppLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSignOut={handleSignOut} />
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
            <AppLayout>
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
            <AppLayout>
              <ProfilePage user={session.user} />
            </AppLayout>
          )
        }
      />
      <Route 
        path="/faq" 
        element={
          // We make the FAQ page accessible even if not logged in
          <div className="min-h-screen bg-gray-100">
            <Navbar onSignOut={handleSignOut} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <FAQ />
            </main>
          </div>
        } 
      />
    </Routes>
  );
}

export default App;