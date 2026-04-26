/**
 * Product Import Page
 * Admin dashboard for importing products from 1688
 */

import React, { useState } from 'react';
import { FiDownload, FiDollarSign, FiImage, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import { importAPI } from '../api';

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
      const response = await axios.get(`${API_BASE_URL}/import/jobs?limit=5`, {
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
            📊 Import Jobs
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Profit Calculator
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handlePreviewProduct} className="bg-white rounded-lg shadow p-6">
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
                  onClick={handleImportProduct}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {loading ? '⏳ Importing...' : '✨ Import to Store'}
                </button>
              </div>
            )}
          </div>
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

// Bulk Import Component (1-Click)
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

    if (urls.length > 20) {
      setError('Maximum 20 products per batch');
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem('access_token');

      const response = await importAPI.batchImport({
        products: urls.map(url => ({
          product_url: url,
          profit_margin_percent: profitMargin
        }))
      });

      setResults(response.data.data);
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
        <p className="text-gray-600 mb-6">Import up to 20 products at once from 1688</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {results && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-3">📊 Import Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">Total Processed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.successful.length + results.failed.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">✅ Successful</p>
                <p className="text-2xl font-bold text-green-600">{results.successful.length}</p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-gray-600 text-sm">❌ Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed.length}</p>
              </div>
            </div>

            {results.successful.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-green-700 mb-2">✅ Successful Imports:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {results.successful.slice(0, 5).map((item, idx) => (
                    <li key={idx}>• {item.product.name} - {item.sku}</li>
                  ))}
                  {results.successful.length > 5 && (
                    <li className="text-gray-500">... and {results.successful.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-red-700 mb-2">❌ Failed Imports:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {results.failed.slice(0, 5).map((item, idx) => (
                    <li key={idx}>• URL {item.index + 1}: {item.error}</li>
                  ))}
                  {results.failed.length > 5 && (
                    <li className="text-gray-500">... and {results.failed.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
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
              rows="8"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              📋 Paste one URL per line. Maximum 20 URLs per batch.
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
              <>
                <span>⏳ Importing {bulkUrls.split('\n').filter(u => u.trim()).length} products...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Start Bulk Import</span>
              </>
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
              <li>✓ Takes 30-60 seconds for batch import</li>
            </ul>
          </div>
        </div>
      </div>
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
