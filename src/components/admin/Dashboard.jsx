import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    pendingCandidates: 0,
    approvedCandidates: 0,
    rejectedCandidates: 0,
    positions: [],
    monthlySubmissions: []
  });
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, candidatesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/candidates?limit=5&sortBy=submittedAt&sortOrder=desc`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (candidatesRes.data.success) {
        setRecentCandidates(candidatesRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statusChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [stats.pendingCandidates, stats.approvedCandidates, stats.rejectedCandidates],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 1
      }
    ]
  };

  const monthlyChartData = {
    labels: stats.monthlySubmissions.map(m => `${m._id.month}/${m._id.year}`),
    datasets: [
      {
        label: 'Submissions',
        data: stats.monthlySubmissions.map(m => m.count),
        backgroundColor: '#3b82f6'
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igsaa-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of nomination submissions and statistics</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> */}
      <div className="admin-card gap-2">
        <div className="bg-white rounded-lg shadow p-6 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Candidates</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pendingCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Approved</h3>
              <p className="text-2xl font-semibold text-green-600">{stats.approvedCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
              <p className="text-2xl font-semibold text-red-600">{stats.rejectedCandidates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-64">
            <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Submissions</h3>
          <div className="h-64">
            <Bar data={monthlyChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCandidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {candidate.formNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                    <div className="text-sm text-gray-500">{candidate.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {candidate.positionContested}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${
                      candidate.status === 'approved' ? 'status-approved' :
                      candidate.status === 'rejected' ? 'status-rejected' :
                      'status-pending'
                    }`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(candidate.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/candidates/${candidate._id}`}
                      className="text-igsaa-blue hover:text-igsaa-blue-dark"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link
            to="/admin/candidates"
            className="text-sm font-medium text-igsaa-blue hover:text-igsaa-blue-dark"
          >
            View all candidates →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;