import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MultiStepForm } from './components/MultiStepForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthButton } from './components/auth/AuthButton';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthCallback } from './components/auth/AuthCallback';
import { SharedAnalysis } from './components/SharedAnalysis';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#1C1C1C]">
          <header className="bg-[#1C1C1C] border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-white">ProductLed</span>
                  <div className="w-1.5 h-1.5 ml-0.5 mb-1 bg-[#FFD23F] rounded-full" />
                  <span className="ml-3 text-gray-400">Free Model Analyzer</span>
                </div>
                <AuthButton />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/share/:shareId" element={<SharedAnalysis />} />
                <Route path="/" element={<MultiStepForm />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 