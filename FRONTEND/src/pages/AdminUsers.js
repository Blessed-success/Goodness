/**
 * Admin Users Management
 * View all users and manage permissions
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiToggleRight, FiToggleLeft, FiSearch } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: { page, limit: 20, search },
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      Swal.fire('Error', 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    const result = await Swal.fire({
      title: 'Confirm',
      text: currentStatus 
        ? 'Remove admin privileges from this user?' 
        : 'Grant admin privileges to this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#ef4444' : '#3b82f6'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('access_token');

      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/toggle-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire('Success', 
        currentStatus ? 'Admin privileges removed' : 'Admin privileges granted', 
        'success'
      );
      fetchUsers();
    } catch (err) {
      Swal.fire('Error', 'Failed to update user', 'error');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const result = await Swal.fire({
      title: 'Confirm',
      text: currentStatus 
        ? 'Deactivate this user account?' 
        : 'Activate this user account?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#ef4444' : '#10b981'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('access_token');

      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire('Success', 
        currentStatus ? 'User deactivated' : 'User activated', 
        'success'
      );
      fetchUsers();
    } catch (err) {
      Swal.fire('Error', 'Failed to update user', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, username, or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Orders</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Admin</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold"
                          >
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user.full_name}</p>
                            <p className="text-xs text-gray-600">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {user.orders_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold text-sm transition ${
                            user.is_admin
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {user.is_admin ? (
                            <>
                              <FiToggleRight size={16} />
                              Admin
                            </>
                          ) : (
                            <>
                              <FiToggleLeft size={16} />
                              User
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-semibold text-sm">Admin Users</p>
            <p className="text-blue-600 text-2xl font-bold mt-1">
              {users.filter(u => u.is_admin).length}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-900 font-semibold text-sm">Active Users</p>
            <p className="text-green-600 text-2xl font-bold mt-1">
              {users.filter(u => u.is_active).length}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900 font-semibold text-sm">Inactive Users</p>
            <p className="text-red-600 text-2xl font-bold mt-1">
              {users.filter(u => !u.is_active).length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
