// --- PASTE YOUR NEW RENDER URL HERE ---
const API_URL = 'https://scriptpolish-server.onrender.com'; // <--- REPLACE THIS
// -----------------------------------

import { useState, useEffect } from 'react'; // <--- THIS LINE IS FIXED
import { supabase } from './supabaseClient';
import Auth from './Auth';
import type { Session } from '@supabase/supabase-js';

// --- Navbar Component (No changes) ---
function Navbar({ onSignOut }: { onSignOut: () => void }) {
  // ... (code is identical)
  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-white">
              ScriptPolish AI
            </h1>
          </div>
          <div className="flex items-center">
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

// --- Script Editor Component (No changes) ---
function ScriptEditor() {
  const [rawScript, setRawScript] = useState<string>('');
  const [polishedScript, setPolishedScript] = useState<string>('');
  const [finalScript, setFinalScript] = useState<string>('');
  const [styleExamples, setStyleExamples] = useState<string>('');
  
  const [saveStatus, setSaveStatus] = useState<'Idle' | 'Saving...' | 'Saved' | 'Error'>('Idle');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ... (useEffect for getProfile is identical) ...
  useEffect(() => {
    async function getProfile() {
      try {
        setSaveStatus('Saving...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error, status } = await supabase
          .from('profiles')
          .select('style_examples')
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setStyleExamples(data.style_examples || '');
        }
        setSaveStatus('Saved');
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        setSaveStatus('Error');
      }
    }
    getProfile();
  }, []);

  // ... (useEffect for auto-save is identical) ...
  useEffect(() => {
    if (saveStatus === 'Idle' || saveStatus === 'Saved') {
      return; 
    }
    if (saveStatus !== 'Saving...') {
      setSaveStatus('Saving...');
    }

    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id, 
            style_examples: styleExamples 
          });

        if (error) throw error;
        setSaveStatus('Saved');
      } catch (error: any) {
        console.error('Error saving profile:', error.message);
        setSaveStatus('Error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [styleExamples, saveStatus]);
  
  // ... (useEffect for copy to final is identical) ...
  useEffect(() => {
    setFinalScript(polishedScript);
  }, [polishedScript]);

  // --- 4. Polish Script Handler (No changes) ---
  const handlePolishScript = async () => {
    setIsLoading(true);
    setPolishedScript('');
    setFinalScript('');

    try {
      const response = await fetch(`${API_URL}/polish`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawScript: rawScript,
          styleExamples: styleExamples
        }),
      });
      if (!response.ok) throw new Error('Something went wrong');
      const data = await response.json();
      setPolishedScript(data.polishedScript);
    } catch (error: any) {
      console.error('Error polishing script:', error.message);
      setPolishedScript('Error: Could not connect to the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (handleSaveAndLearn is identical) ...
  const handleSaveAndLearn = () => {
    const separator = `\n\n---\n[New Example Added: ${new Date().toLocaleString()}]\n---\n\n`;
    const newStyleProfile = styleExamples + separator + finalScript;
    setStyleExamples(newStyleProfile);
    setSaveStatus('Saving...');
  };

  // ... (The rest of the component is identical) ...
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Polishing Station</h2>
        <p className="mt-1 text-sm text-gray-600">
          Paste your style examples, then your raw script, and let the AI do the rest.
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Your Style Examples */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="style-examples" className="block text-sm font-medium text-gray-700">
                Your Style Examples (Voice Profile)
              </label>
              <span className="text-sm text-gray-500">
                {saveStatus === 'Saving...' && 'Saving...'}
                {saveStatus === 'Saved' && 'Saved'}
                {saveStatus === 'Error' && 'Error saving!'}
              </span>
            </div>
            <textarea
              id="style-examples"
              className={`w-full h-96 p-3 border rounded-md shadow-sm resize-none text-gray-800 bg-gray-50 ${saveStatus === 'Error' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="Paste 2-3 examples of your writing style here..."
              value={styleExamples}
              onChange={(e) => {
                setStyleExamples(e.target.value);
                setSaveStatus('Saving...');
              }}
            ></textarea>
          </div>

          {/* Column 2: Raw Script Input */}
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

          {/* Column 3: Polished Script */}
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
                disabled={!finalScript || isLoading}
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

      {/* Action Buttons */}
      <div className="flex justify-between p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          onClick={handleSaveAndLearn}
          disabled={isLoading || saveStatus === 'Saving...' || !finalScript}
        >
          {saveStatus === 'Saving...' ? 'Learning...' : 'Save & Learn'}
        </button>
        
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          onClick={handlePolishScript}
          disabled={isLoading || saveStatus === 'Saving...' || !rawScript}
        >
          {isLoading ? 'Polishing...' : 'Polish Script'}
        </button>
      </div>
    </div>
  );
}


// --- Main App Component (No changes) ---
function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <Navbar onSignOut={handleSignOut} />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <ScriptEditor key={session.user.id} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;