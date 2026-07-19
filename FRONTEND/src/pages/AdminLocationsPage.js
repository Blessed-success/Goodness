/**
 * Admin Locations Page
 * Location management for admins
 */

import React from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminLocations from '../components/AdminLocations';

const AdminLocationsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🌍 Location Management</h2>
          <p className="text-gray-600 mt-1">Control which regions and cities can access BlessedNet services</p>
        </div>

        {/* Admin Locations Component */}
        <AdminLocations />
      </div>
    </AdminLayout>
  );
};

export default AdminLocationsPage;