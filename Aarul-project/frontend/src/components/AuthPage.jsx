import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';

const AuthPage = () => {
  const [mode, setMode] = useState('landing'); // 'landing' | 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — matches app header exactly */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <i className="fas fa-cloud text-lg text-white"></i>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Cloud Architect AI</h1>
            <p className="text-xs text-blue-100 font-medium hidden sm:block">AWS Architecture Design & Optimization</p>
          </div>
        </div>
      </header>

      {mode === 'landing' ? (
        /* Landing page */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          {/* Hero */}
          <div className="text-center max-w-2xl mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <i className="fas fa-cloud text-4xl text-white"></i>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your AI Solution Architect
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Describe what you're building — Cloud Architect AI generates complete architecture designs, proposals, and project timelines tailored to your requirements.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Whether you're a startup, enterprise team, or independent consultant — just describe your project and get back professional architecture diagrams, service recommendations, cost breakdowns, and implementation plans. No prior architecture experience needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setMode('signup')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <i className="fas fa-rocket mr-2"></i>
                Get Started Free
              </button>
              <button
                onClick={() => setMode('signin')}
                className="px-8 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg font-semibold hover:bg-blue-50 transition-all"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
            {[
              { icon: 'fas fa-search', color: 'blue', title: 'Requirements Discovery', desc: 'Capture business context and turn requirements into structured project briefs' },
              { icon: 'fas fa-drafting-compass', color: 'indigo', title: 'Architecture Design', desc: 'Generate full architecture diagrams, proposals, and technical documentation' },
              { icon: 'fas fa-tasks', color: 'purple', title: 'Timelines & Planning', desc: 'Get implementation roadmaps, milestones, and delivery plans automatically' },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <i className={`${icon} text-${color}-600 text-xl`}></i>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Auth form */
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
            {/* Form header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className={`fas ${mode === 'signup' ? 'fa-user-plus' : 'fa-sign-in-alt'} text-2xl text-white`}></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'signup' ? 'Start designing AWS architectures with AI' : 'Sign in to your Cloud Architect AI account'}
              </p>
            </div>

            {/* Error / success */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>{error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                <i className="fas fa-check-circle mr-2"></i>{message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Please wait...</>
                ) : mode === 'signup' ? (
                  <><i className="fas fa-rocket mr-2"></i>Create Account</>
                ) : (
                  <><i className="fas fa-sign-in-alt mr-2"></i>Sign In</>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {mode === 'signup' ? (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="text-blue-600 font-medium hover:underline">Sign in</button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="text-blue-600 font-medium hover:underline">Sign up</button>
                </>
              )}
            </div>

            <button
              onClick={() => { setMode('landing'); setError(''); setMessage(''); }}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-arrow-left mr-1"></i>Back to home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
