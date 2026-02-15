import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ArrowRight, Lock, Mail, User, UserCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabaseService } from '../services/supabaseService';

interface LoginProps {
  onLogin: () => void;
  onGuestLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await supabaseService.login(email, password);
        onLogin();
      } else {
        if (!name) {
          setError('Full Name is required for signup');
          setLoading(false);
          return;
        }
        const data = await supabaseService.signUp(email, password, name);
        
        // If session exists immediately, email confirmation is disabled or not required
        if (data.session) {
            onLogin();
        } else {
            // If no session, email confirmation is required
            alert('Signup successful! Please check your email to confirm your account before logging in.');
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      // Handle Supabase specific error for unconfirmed email
      if (err.message && (err.message.includes('Email not confirmed') || err.message.includes('Email not verified'))) {
         setError('Please verify your email address. Check your inbox and spam folder.');
      } else if (err.message && err.message.includes('Error sending confirmation email')) {
         setError('Email service limit reached. Please use "Continue as Guest" below.');
      } else {
         setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to ResumeAI</h1>
          <p className="text-slate-500">{isLogin ? 'Sign in to manage your resumes' : 'Create your account'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-3" icon={!loading && <ArrowRight size={18}/>} isLoading={loading}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-4">
          <button 
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <div className="border-t border-slate-100 pt-4">
            <button 
                onClick={onGuestLogin}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-2 w-full"
            >
                <UserCircle size={16} /> Continue as Guest (Local Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;