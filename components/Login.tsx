import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ArrowRight, Lock, Mail, User, UserCircle } from 'lucide-react';
import { Logo } from './Logo';
import { firebaseService } from '../services/firebaseService';

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
        await firebaseService.login(email, password);
        onLogin();
      } else {
        if (!name) {
          setError('Full Name is required for signup');
          setLoading(false);
          return;
        }
        await firebaseService.signUp(email, password, name);
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      // Handle Firebase specific errors
      const errorMessage = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-200/30 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent-200/30 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="glass-panel p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 transition-all duration-500 hover:shadow-brand-500/10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
            <Logo size={70} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome to ResumeAI</h1>
          <p className="text-slate-500 font-medium">{isLogin ? 'Sign in to craft your career' : 'Create your account today'}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r text-sm font-medium animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="animate-slide-up">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-200"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-200"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button type="submit" className="w-full py-3.5 text-base font-bold shadow-brand-500/30 hover:shadow-brand-500/50" icon={!loading && <ArrowRight size={20}/>} isLoading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>
        
        <div className="mt-8 text-center space-y-4 animate-fade-in">
          <button 
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
            }}
            className="text-sm text-brand-600 hover:text-brand-800 font-semibold hover:underline transition-all"
          >
            {isLogin ? "New here? Create an account" : "Already a member? Sign in"}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 backdrop-blur px-2 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <button 
              onClick={onGuestLogin}
              className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow active:scale-95"
          >
              <UserCircle size={18} className="text-slate-400" /> Guest Mode (Local Storage)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;