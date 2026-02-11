import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    electionType: '',
    search: ''
  });

  const API_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, filters]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await axios.get(
        `${API_URL}/admin/candidates?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCandidates(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      const response = await axios.patch(
        `${API_URL}/admin/candidates/${candidateId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update the candidate in the list
        setCandidates(prev =>
          prev.map(candidate =>
            candidate._id === candidateId
              ? { ...candidate, status: newStatus }
              : candidate
          )
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igsaa-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidates</h1>
          <p className="text-gray-600">Manage nomination submissions</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={fetchCandidates}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Refresh
          </button>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-igsaa-blue focus:border-igsaa-blue"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, email, or form number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-igsaa-blue focus:border-igsaa-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={filters.position}
              onChange={handleFilterChange}
              placeholder="Filter by position"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-igsaa-blue focus:border-igsaa-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Election Type
            </label>
            <select
              name="electionType"
              value={filters.electionType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-igsaa-blue focus:border-igsaa-blue"
            >
              <option value="">All Types</option>
              <option value="Executive Election">Executive Election</option>
              <option value="By-Election">By-Election</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.formNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.positionContested}
                    </div>
                    <div className="text-xs text-gray-400">
                      {candidate.electionType}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.phoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        candidate.status === 'approved' ? 'bg-green-100 text-green-800' :
                        candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {candidate.status}
                      </span>
                      {candidate.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(candidate._id, 'approved')}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(candidate._id, 'rejected')}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {candidate.submittedAt && new Date(candidate.submittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/candidates/${candidate._id}`}
                      className="text-igsaa-blue hover:text-igsaa-blue-dark mr-4"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => {
                        // Download functionality
                        const dataStr = JSON.stringify(candidate, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const link = document.createElement('a');
                        link.setAttribute('href', dataUri);
                        link.setAttribute('download', `${candidate.formNumber}.json`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      pagination.page === pageNum
                        ? 'bg-igsaa-blue text-white'
                        : 'border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatesList;