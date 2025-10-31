import React from 'react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions (FAQ)
        </h1>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          
          {/* Question 1 */}
          <details className="p-6 group" open>
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <h2 className="text-lg font-medium text-gray-900">What is the "Your Style Examples" box for?</h2>
              <span className="text-indigo-600 group-open:rotate-180 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <p className="text-gray-600 mt-4">
              This is the most important part of the app. This is where you teach the AI your unique voice. Paste 2-3 examples of your best, 100% human-written scripts here. The AI will study them to learn your tone, pacing, and vocabulary *before* it polishes your new script.
            </p>
          </details>

          {/* Question 2 */}
          <details className="p-6 group">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <h2 className="text-lg font-medium text-gray-900">How does the "Save & Learn" button work?</h2>
            </summary>
            <p className="text-gray-600 mt-4">
              This button is the "learning" part. After the AI polishes your script, you should make your own final, manual edits in the "Polished Script" box. When you're happy, click "Save & Learn." The app will **add your new, perfect script** to its memory (your "Style Examples" profile), making the AI even smarter for the next time.
            </p>
          </details>

          {/* Question 3 */}
          <details className="p-6 group">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <h2 className="text-lg font-medium text-gray-900">Why does my "Style Examples" box keep changing?</h2>
            </summary>
            <p className="text-gray-600 mt-4">
              This is the "Save & Learn" feature in action! When you click that button, the app adds your newly corrected script to your profile. This makes your profile grow bigger and smarter over time, so the AI's future polishes are even more accurate.
            </p>
          </details>

          {/* Question 4 */}
          <details className="p-6 group">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <h2 className="text-lg font-medium text-gray-900">Will my Style Profile be saved?</h2>
            </summary>
            <p className="text-gray-600 mt-4">
              Yes. As long as you are logged in, your "Style Examples" are auto-saved to your secure cloud profile. You can log out, use a different computer, and when you log back in, your voice profile will be there waiting for you.
            </p>
          </details>

        </div>

        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700"
          >
            Back to the App
          </Link>
        </div>
      </div>
    </div>
  );
}