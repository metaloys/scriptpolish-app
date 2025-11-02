import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

type HistoryItem = {
  id: number;
  created_at: string;
  raw_script: string;
  ai_polished_script: string;
  user_final_script?: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found. Please log in again.');

        const { data, error } = await supabase
          .from('polish_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setHistory(data as HistoryItem[]);
        }
      } catch (error: any) {
        console.error('Error fetching history:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Polish History
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          A list of all the scripts you've polished, from most recent to oldest.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          {loading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Loading history...
            </div>
          )}

          {error && (
            <div className="text-center text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              You haven't polished any scripts yet.
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item) => (
                <li key={item.id} className="py-4">
                  {/* --- THIS IS THE FIX --- */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      Polished on: {new Date(item.created_at).toLocaleString()}
                    </span>
                    {item.user_final_script && (
                      <span className="mt-2 sm:mt-0 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full self-start">
                        Learned
                      </span>
                    )}
                  </div>
                  {/* --- END FIX --- */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-gray-100">
                      View Raw Script
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-48">
                      {item.raw_script}
                    </pre>
                  </details>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-gray-100">
                      View Polished Script
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-48">
                      {item.user_final_script || item.ai_polished_script}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}