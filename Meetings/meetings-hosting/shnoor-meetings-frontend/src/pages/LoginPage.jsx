import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../services/userService';
import { ensureFrontendUserId } from '../utils/currentUser';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const persistUser = async (userData) => {
    const normalizedUser = ensureFrontendUserId(userData);

    try {
      await saveUser(normalizedUser);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const validateEmail = (emailToCheck) => {
    return emailToCheck.endsWith("@shnoor.com");
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      setError('');
      const user = jwtDecode(response.credential);
      
      if (!validateEmail(user.email)) {
        setError("Only @shnoor.com email addresses are allowed.");
        return;
      }
      
      const userData = {
        id: user.email,
        firebaseUid: user.sub,
        name: user.name,
        email: user.email,
        picture: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      };

      await persistUser(userData);
      window.location.href = '/';
    } catch (err) {
      setError("Google login failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!validateEmail(email)) {
      setError("Only @shnoor.com email addresses are allowed.");
      return;
    }

    try {
      setLoading(true);
      const userData = {
        id: email,
        name: email,
        email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}`,
      };

      await persistUser(userData);
      navigate('/');
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError("Only @shnoor.com email addresses are allowed.");
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const userData = {
        id: email,
        name: fullName,
        email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`,
      };

      await persistUser(userData);
      navigate('/');
    } catch (err) {
      setError("Sign up failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  S
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Shnoor Meetings</h1>
              <p className="text-indigo-100">Professional Video Conferencing</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-10">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-red-600 font-semibold mt-0.5">⚠</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Tab Selection */}
            <div className="flex gap-2 mb-8">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setConfirmPassword('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  !isSignUp
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setConfirmPassword('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  isSignUp
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {!isSignUp && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      <span>📧</span> @shnoor.com
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="your.email@shnoor.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {isSignUp && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      <span>📧</span> @shnoor.com
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="your.email@shnoor.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm font-medium text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google OAuth */}
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600 mb-4">
                {isSignUp ? 'Create account with Google' : 'Sign in with Google'}
              </p>
              <div className="flex justify-center">
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess} 
                  onError={() => setError('Google authentication failed')}
                />
              </div>
            </div>

            {/* Footer Help Text */}
            <p className="text-center text-xs text-gray-500 mt-8">
              {isSignUp 
                ? "By creating an account, you agree to our Terms of Service" 
                : "Need help? Contact support@shnoor.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
