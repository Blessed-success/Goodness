/**
 * Login Page
 * User authentication with location selection
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import LocationSelector from '../components/LocationSelector';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
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
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
      await login(formData.email, formData.password);
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
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
            <FiShoppingBag size={20} />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-500">Login to continue to BlessedNet</p>
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
            <label className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
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
