/**
 * Admin Vendors Management
 * Approve/reject marketplace sellers, set commission rates, and reconcile
 * the vendor-earnings ledger (manual payout tracking, no automated transfer)
 */

import React, { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { adminVendorAPI } from '../api';
import Swal from 'sweetalert2';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [vendorsRes, earningsRes] = await Promise.all([
        adminVendorAPI.getAll(),
        adminVendorAPI.getEarnings(),
      ]);
      setVendors(vendorsRes.data.data);
      setEarnings(earningsRes.data.data);
    } catch (err) {
      Swal.fire('Error', 'Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalToggle = async (vendor) => {
    try {
      await adminVendorAPI.update(vendor.id, { is_approved: !vendor.is_approved });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to update vendor', 'error');
    }
  };

  const handleActiveToggle = async (vendor) => {
    try {
      await adminVendorAPI.update(vendor.id, { is_active: !vendor.is_active });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to update vendor', 'error');
    }
  };

  const handleCommissionChange = async (vendor, value) => {
    const commission_percent = parseFloat(value);
    if (Number.isNaN(commission_percent)) return;
    try {
      await adminVendorAPI.update(vendor.id, { commission_percent });
    } catch (err) {
      Swal.fire('Error', 'Failed to update commission', 'error');
    }
  };

  const handleMarkPaid = async (earningId) => {
    try {
      await adminVendorAPI.markEarningPaid(earningId);
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to update earning', 'error');
    }
  };

  return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Vendors</h2>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : vendors.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No vendor applications yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Approved</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Commission %</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{vendor.store_name}</p>
                      <p className="text-xs text-gray-500">/{vendor.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {vendor.is_approved ? (
                        <span className="text-green-600">Approved</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{vendor.is_active ? 'Active' : 'Suspended'}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={vendor.commission_percent}
                        onBlur={(e) => handleCommissionChange(vendor, e.target.value)}
                        className="w-20 rounded border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovalToggle(vendor)}
                          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                            vendor.is_approved ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <FiCheck size={12} /> {vendor.is_approved ? 'Revoke' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleActiveToggle(vendor)}
                          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                            vendor.is_active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <FiX size={12} /> {vendor.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Vendor Earnings Ledger</h2>
        <p className="text-sm text-gray-500">
          Money still flows through the single Nexus Paystack account. This is a manual
          reconciliation ledger — pay vendors outside the app, then mark rows paid here.
        </p>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No vendor sales yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Net Owed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {earnings.map((earning) => (
                  <tr key={earning.id}>
                    <td className="px-4 py-3">#{earning.order_id}</td>
                    <td className="px-4 py-3">GHS {earning.gross_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">GHS {earning.commission_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold">GHS {earning.net_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {earning.payout_status === 'paid' ? (
                        <span className="text-green-600">Paid</span>
                      ) : (
                        <span className="text-amber-600">Unpaid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {earning.payout_status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(earning.id)}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
};

export default AdminVendors;
