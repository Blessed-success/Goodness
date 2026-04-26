/**
 * Comprehensive Product Import Page
 * Admin dashboard for importing products from 1688 with multiple methods:
 * - Single product import with preview
 * - Bulk URL import (1-click)
 * - CSV file upload
 * - Job history and tracking
 * - Profit calculator
 */

import React, { useState } from 'react';
import { FiDownload, FiDollarSign, FiCheck, FiX } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductImportPage = () => {
  const [activeTab, setActiveTab] = useState('bulk'); // single, bulk, csv, jobs, calculator
  const [productUrl, setProductUrl] = useState('');
  const [profitMargin, setProfitMargin] = useState(40);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exchange, setExchange] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch exchange rate and jobs on mount
  React.useEffect(() => {
    fetchExchangeRate();
    loadImportJobs();
    
    // Refresh jobs every 5 seconds if any are processing
    const interval = setInterval(() => {
      loadImportJobs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadImportJobs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/import/jobs?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data.data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/import/exchange-rate`);
      setExchange(response.data.data);
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    }
  };

  const handlePreviewProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productUrl.trim()) {
      setError('Please enter a 1688 product URL');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `${API_BASE_URL}/import/preview`,
        {
          product_url: productUrl,
          profit_margin_percent: profitMargin
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPreviewData(response.data.data);
    } catch (err) {
      const message = err.response?.data?.details || err.response?.data?.error || 'Failed to preview product';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportProduct = async () => {
    if (!previewData) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `${API_BASE_URL}/import/product`,
        {
          product_url: productUrl,
          product_title: previewData.product.title,
          price_ghs: previewData.pricing.final_price_ghs,
          description: previewData.product.description,
          images: previewData.product.images,
          category: previewData.product.category,
          profit_margin_percent: profitMargin,
          stock_quantity: 10,
          is_featured: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Product imported successfully! ✅');
      setPreviewData(null);
      setProductUrl('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to import product';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📦 1688 Product Importer</h1>
          <p className="text-gray-600">Import wholesale products from 1688.com and automatically set prices for Ghana market</p>
        </div>

        {/* Exchange Rate Info */}
        {exchange && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              💱 Current Exchange Rate: <strong>1 RMB = {exchange.rate} GHS</strong>
              <span className="text-sm text-blue-700 ml-2">(Updated {new Date(exchange.timestamp).toLocaleTimeString()})</span>
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('single')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'single'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Single Product
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚀 Bulk URLs
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'csv'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 CSV Import
          </button>
          <button
            onClick={() => { setActiveTab('jobs'); loadImportJobs(); }}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💰 Calculator
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Single Product Import */}
        {activeTab === 'single' && (
          <SingleProductTab 
            productUrl={productUrl}
            setProductUrl={setProductUrl}
            profitMargin={profitMargin}
            setProfitMargin={setProfitMargin}
            loading={loading}
            previewData={previewData}
            onPreview={handlePreviewProduct}
            onImport={handleImportProduct}
          />
        )}

        {/* Bulk Import */}
        {activeTab === 'bulk' && (
          <BulkImportTab apiUrl={API_BASE_URL} />
        )}

        {/* CSV Import */}
        {activeTab === 'csv' && (
          <CSVImportTab apiUrl={API_BASE_URL} onSuccess={() => {
            setSuccess('CSV imported successfully!');
            loadImportJobs();
            setTimeout(() => setSuccess(''), 3000);
          }} />
        )}

        {/* Import Jobs */}
        {activeTab === 'jobs' && (
          <ImportJobsTab jobs={jobs} apiUrl={API_BASE_URL} selectedJob={selectedJob} />
        )}

        {/* Profit Calculator */}
        {activeTab === 'calculator' && (
          <ProfitCalculator apiUrl={API_BASE_URL} />
        )}
      </div>
    </div>
  );
};

// Single Product Component
const SingleProductTab = ({ productUrl, setProductUrl, profitMargin, setProfitMargin, loading, previewData, onPreview, onImport }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Input Form */}
      <div className="lg:col-span-2">
        <form onSubmit={onPreview} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Import Product</h2>

          <div className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-semibold mb-2">1688 Product URL</label>
              <input
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.1688.com/offer/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                📋 Paste the full product URL from 1688.com
              </p>
            </div>

            {/* Profit Margin */}
            <div>
              <label className="block text-sm font-semibold mb-2">Profit Margin (%)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="200"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-600 font-semibold">{profitMargin}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📊 Recommended: 30-50% for wholesale products
              </p>
            </div>

            {/* Preview Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiDownload /> {loading ? 'Previewing...' : 'Preview Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="text-xl font-bold mb-4">✅ Preview</h3>

          {/* Product Image */}
          {previewData.product.images.length > 0 && (
            <div className="mb-4">
              <img
                src={previewData.product.images[0]}
                alt={previewData.product.title}
                className="w-full h-40 object-cover rounded-lg mb-2"
              />
              <p className="text-xs text-gray-500">{previewData.product.images.length} images found</p>
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-3 text-sm mb-6">
            <div>
              <p className="text-gray-600 font-semibold">Title</p>
              <p className="text-gray-900">{previewData.product.title}</p>
            </div>

            {previewData.pricing && (
              <>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-gray-600 font-semibold">Original Price (RMB)</p>
                  <p className="text-lg font-bold text-blue-600">
                    ¥{previewData.pricing.price_rmb}
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded">
                  <p className="text-gray-600 font-semibold">Final Price (GHS)</p>
                  <p className="text-lg font-bold text-green-600">
                    GHS {previewData.pricing.final_price_ghs.toFixed(2)}
                  </p>
                </div>

                {previewData.profit_estimate && (
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-gray-600 font-semibold">Profit per Unit</p>
                    <p className="text-lg font-bold text-orange-600">
                      GHS {previewData.profit_estimate.profit_per_unit_ghs.toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <p className="text-gray-600 font-semibold">Category</p>
              <p className="text-gray-900">{previewData.product.category}</p>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={onImport}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? '⏳ Importing...' : '✨ Import to Store'}
          </button>
        </div>
      )}
    </div>
  );
};

// Bulk Import Component
const BulkImportTab = ({ apiUrl }) => {
  const [bulkUrls, setBulkUrls] = useState('');
  const [profitMargin, setProfitMargin] = useState(40);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleBulkImport = async () => {
    setError('');
    setResults(null);

    if (!bulkUrls.trim()) {
      setError('Please enter at least one 1688 product URL');
      return;
    }

    const urls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setError('No valid URLs found');
      return;
    }

    if (urls.length > 50) {
      setError('Maximum 50 products per batch');
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `${apiUrl}/import/urls`,
        {
          urls,
          profit_margin_percent: profitMargin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const jobId = response.data.data.job_id;
      setResults({
        job_id: jobId,
        total_products: response.data.data.total_products,
        message: 'Import job queued successfully! Check Jobs tab for progress.'
      });
      setBulkUrls('');
    } catch (err) {
      setError(err.response?.data?.error || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-3xl font-bold mb-2">🚀 1-Click Bulk Import</h2>
        <p className="text-gray-600 mb-6">Import up to 50 products at once from 1688</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {results && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-bold text-green-900 mb-3">✅ {results.message}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">Job ID</p>
                <p className="text-lg font-bold text-gray-900 break-all">{results.job_id}</p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">Products Queued</p>
                <p className="text-lg font-bold text-blue-600">{results.total_products}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* URLs Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              1688 Product URLs (one per line)
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={`https://www.1688.com/offer/12345...
https://www.1688.com/offer/67890...
https://www.1688.com/offer/11111...`}
              rows="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              📋 Paste one URL per line. Maximum 50 URLs per batch.
            </p>
          </div>

          {/* Profit Margin */}
          <div>
            <label className="block text-sm font-semibold mb-2">Profit Margin for All (%)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                max="200"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <span className="text-gray-600 font-semibold">{profitMargin}%</span>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={handleBulkImport}
            disabled={importing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {importing ? (
              <>⏳ Processing {bulkUrls.split('\n').filter(u => u.trim()).length} URLs...</>
            ) : (
              <>🚀 Start Bulk Import</>
            )}
          </button>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3">💡 Quick Tips</h4>
            <ul className="text-sm text-blue-900 space-y-2">
              <li>✓ Copy product URLs directly from 1688.com</li>
              <li>✓ Each URL should be on a separate line</li>
              <li>✓ Same profit margin applied to all products</li>
              <li>✓ Invalid URLs will be skipped automatically</li>
              <li>✓ Background processing - check Jobs tab for progress!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSV Import Component
const CSVImportTab = ({ apiUrl, onSuccess }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large (max 5MB)');
        return;
      }
      setCsvFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', csvFile);

      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${apiUrl}/import/csv-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResults({
        job_id: response.data.data.job_id,
        total_products: response.data.data.total_products,
        message: 'CSV uploaded successfully! Import job queued.'
      });
      setCsvFile(null);
      
      setTimeout(() => onSuccess?.(), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-3xl font-bold mb-2">📄 CSV Import</h2>
        <p className="text-gray-600 mb-6">Bulk import multiple products from a CSV file</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {results && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-bold text-green-900 mb-3">✅ {results.message}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">Job ID</p>
                <p className="text-lg font-bold text-gray-900 break-all">{results.job_id}</p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">Products Queued</p>
                <p className="text-lg font-bold text-blue-600">{results.total_products}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Select CSV File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600 font-semibold">Click to select CSV file</p>
                {csvFile && <p className="text-green-600 text-sm mt-2">✓ {csvFile.name}</p>}
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              CSV format: product_url,profit_margin
            </p>
          </div>

          {/* CSV Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3">📋 CSV Format Guide</h4>
            <div className="bg-white rounded p-4 font-mono text-sm text-gray-700 mb-4 overflow-x-auto">
              <div>product_url,profit_margin</div>
              <div>https://www.1688.com/offer/123456,40</div>
              <div>https://www.1688.com/offer/789012,50</div>
              <div>https://www.1688.com/offer/345678,45</div>
            </div>
            <p className="text-sm text-blue-900">
              ✓ Column 1: Full product URL from 1688<br/>
              ✓ Column 2: Profit margin percentage (e.g., 40)<br/>
              ✓ Maximum 200 rows per file<br/>
              ✓ Maximum file size: 5MB
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!csvFile || uploading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>⏳ Uploading...</>
            ) : (
              <>📤 Upload and Import CSV</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Import Jobs Component
const ImportJobsTab = ({ jobs, apiUrl }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-700 bg-green-50';
      case 'processing': return 'text-blue-700 bg-blue-50';
      case 'failed': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg">No import jobs yet</p>
        <p className="text-gray-400 text-sm">Start a bulk or CSV import to see jobs here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.job_id}</h3>
              <p className="text-sm text-gray-500">
                {new Date(job.created_at).toLocaleString()}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
              {getStatusIcon(job.status)} {job.status.toUpperCase()}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-semibold text-gray-900">{job.progress_percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600 text-xs">Total</p>
              <p className="text-lg font-bold text-gray-900">{job.total_products}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-green-600 text-xs">Success</p>
              <p className="text-lg font-bold text-green-700">{job.successful_count || 0}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-red-600 text-xs">Failed</p>
              <p className="text-lg font-bold text-red-700">{job.failed_count || 0}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-blue-600 text-xs">Type</p>
              <p className="text-lg font-bold text-blue-700 capitalize">{job.import_type}</p>
            </div>
          </div>

          {/* Timing Info */}
          {job.completed_at && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              <p>Completed: {new Date(job.completed_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Profit Calculator Component
const ProfitCalculator = ({ apiUrl }) => {
  const [priceRmb, setPriceRmb] = useState(50);
  const [profitMargin, setProfitMargin] = useState(40);
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    try {
      setLoading(true);

      const response = await axios.post(`${apiUrl}/import/profit-calculator`, {
        price_rmb: parseFloat(priceRmb),
        profit_margin_percent: parseFloat(profitMargin),
        quantity: parseInt(quantity)
      });

      setResult(response.data.data);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FiDollarSign /> Profit Calculator
        </h2>

        <div className="space-y-6">
          {/* Price Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">1688 Price (RMB)</label>
            <input
              type="number"
              value={priceRmb}
              onChange={(e) => setPriceRmb(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Profit Margin */}
          <div>
            <label className="block text-sm font-semibold mb-2">Profit Margin (%)</label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              min="0"
              max="200"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Profit'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <h3 className="text-xl font-bold mb-4">💰 Results</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Original Price</p>
                <p className="text-2xl font-bold text-blue-600">¥{result.price_rmb}</p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Final Price (per unit)</p>
                <p className="text-2xl font-bold text-green-600">
                  GHS {result.final_price_ghs.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Profit per Unit</p>
                <p className="text-2xl font-bold text-orange-600">
                  GHS {result.profit_per_unit_ghs.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Profit ({result.quantity} units)</p>
                <p className="text-2xl font-bold text-purple-600">
                  GHS {result.total_profit_ghs.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-gray-600 text-sm mb-1">ROI (Return on Investment)</p>
              <p className="text-3xl font-bold text-green-600">{result.roi}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImportPage;
