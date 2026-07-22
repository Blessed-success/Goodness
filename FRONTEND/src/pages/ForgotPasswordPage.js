/**
 * Forgot Password Page
 * Requests a password reset link by email
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { authAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      await authAPI.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
            <FiShoppingBag size={20} />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-gray-500">We'll email you a link to set a new one</p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            If that email is registered, a reset link is on its way. It expires in an hour — check your inbox (and spam folder).
          </div>
        ) : (
          <>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
