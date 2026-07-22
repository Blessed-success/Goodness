/**
 * Login Page
 * User authentication with location selection
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationSelector from '../components/LocationSelector';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import logo from '../assets/nexus-logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.is_admin ? '/admin' : '/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const loggedInUser = await login(formData.email, formData.password);
      if (loggedInUser?.is_admin) {
        // Admins manage the store, not shop from it — skip the shipping
        // location prompt and go straight to the dashboard.
        navigate('/admin');
        return;
      }
      // Show location selector after successful login
      setShowLocationSelector(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = () => {
    setShowLocationSelector(false);
    navigate('/');
  };

  // Show location selector after login
  if (showLocationSelector) {
    return <LocationSelector showModal={true} onLocationSelect={handleLocationSelect} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="Nexus" className="mx-auto mb-4 h-10 w-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-500">Login to continue to Nexus</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Register here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
