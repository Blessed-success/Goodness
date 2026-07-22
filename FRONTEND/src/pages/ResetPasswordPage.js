/**
 * Reset Password Page
 * Completes a password reset using the token from the emailed link
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { authAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token — request a new one');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword({ token, new_password: newPassword });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
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
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        </div>

        {!token && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            This link is missing its reset token. Use the link from your email, or{' '}
            <Link to="/forgot-password" className="font-semibold underline">request a new one</Link>.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:outline-none"
              required
            />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters, one uppercase letter, one digit, one symbol.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={!token}>
            Reset Password
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
