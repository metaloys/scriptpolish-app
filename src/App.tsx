// --- PASTE YOUR RENDER URL HERE ---
const API_URL = 'https://scriptpolish-server.onrender.com';
// -----------------------------------

import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import FAQ from './FAQ';
import type { Session, User } from '@supabase/supabase-js';

// --- Navbar Component (No changes) ---
function Navbar({ onSignOut }: { onSignOut: () => void }) {
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

// --- Script Editor Component (V3 LOGIC) ---
function ScriptEditor({ user }: { user: User }) {
  // --- STATE ---
  const [rawScript, setRawScript] = useState<string>('');
  const [polishedScript, setPolishedScript] = useState<string>(''); // The AI's guess
  const [finalScript, setFinalScript] = useState<string>('');     // The user's final edits
  
  // This new state holds the ID of the current polish,
  // so we can link it when the user "saves & learns"
  const [historyId, setHistoryId] = useState<number | null>(null);
  
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);     // For "Polish" button
  const [isLearning, setIsLearning] = useState<boolean>(false);   // For "Save & Learn" button

  // --- 1. Copy AI Guess to Final Version ---
  // When the AI finishes polishing, copy its output to the editable "Final Script" box.
  useEffect(() => {
    setFinalScript(polishedScript);
  }, [polishedScript]);

  // --- 2. Polish Script Handler (V3) ---
  const handlePolishScript = async () => {
    setIsLoading(true);
    setPolishedScript('');
    setFinalScript('');
    setHistoryId(null);

    try {
      // The backend now needs the userId to find the correct voice examples
      const response = await fetch(`${API_URL}/polish`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawScript: rawScript,
          userId: user.id // Send the user's ID
        }),
      });
      if (!response.ok) throw new Error('Something went wrong');
      
      const data = await response.json();
      
      setPolishedScript(data.polishedScript);
      setHistoryId(data.historyId); // <-- Store the new history ID
      
    } catch (error: any) {
      console.error('Error polishing script:', error.message);
      setPolishedScript('Error: Could not connect to the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Save & Learn Handler (V3) ---
  const handleSaveAndLearn = async () => {
    if (!historyId) {
      alert("Error: Cannot save, no polish history found. Please polish the script first.");
      return;
    }
    
    setIsLearning(true);

    try {
      // Call the new "/save-correction" endpoint
      const response = await fetch(`${API_URL}/save-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          historyId: historyId,
          aiPolishedScript: polishedScript,    // The AI's first guess
          userFinalScript: finalScript         // The user's corrected version
        }),
      });
      if (!response.ok) throw new Error('Learning failed');
      
      const data = await response.json();
      console.log("Learning saved!", data); // You can show a success message
      alert("Success! Your voice profile just got smarter.");

    } catch (error: any) {
      console.error('Error learning from edits:', error.message);
      alert("Error: Could not save your edits. Please try again.");
    } finally {
      setIsLearning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Polishing Station V3</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your voice is loaded. Paste a raw script, polish it, and click "Save & Learn" to make the AI smarter.
        </p>
      </div>

      <div className="p-4">
        {/* UPDATED: 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Column 1: Raw Script Input */}
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

          {/* Column 2: Polished Script (Editable) */}
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

      {/* Action Buttons */}
      <div className="flex justify-between p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          onClick={handleSaveAndLearn}
          disabled={isLoading || isLearning || !finalScript || !historyId}
        >
          {isLearning ? 'Learning...' : 'Save & Learn'}
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


// --- Main App Component (V3 - Passes User to Editor) ---
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
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !session ? (
            <Auth />
          ) : (
            <div className="min-h-screen bg-gray-100">
              <Navbar onSignOut={handleSignOut} />
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* We now pass the entire user object to the editor */}
                <ScriptEditor key={session.user.id} user={session.user} />
              </main>
            </div>
          )
        }
      />
      <Route path="/faq" element={<FAQ />} />
    </Routes>
  );
}

export default App;