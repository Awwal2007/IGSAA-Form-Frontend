import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    candidateId: null,
    candidateName: '',
    formNumber: ''
  });

  const API_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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

  // PDF Certificate Generation Function - FIXED VERSION
  const generateCertificate = (candidate) => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set document properties
      doc.setProperties({
        title: `Nomination Certificate - ${candidate.formNumber}`,
        subject: 'IGSAA Nomination Certificate',
        author: 'IGSAA Admin',
        keywords: 'nomination, certificate, igsaa',
        creator: 'IGSAA Election System'
      });

      // Add border
      doc.setDrawColor(30, 64, 175); // IGSAA blue
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277); // A4 border

      // Add decorative border
      doc.setDrawColor(59, 130, 246); // Lighter blue
      doc.setLineWidth(0.2);
      doc.rect(12, 12, 186, 273);

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175); // IGSAA blue
      doc.text('IWO GRAMMAR SCHOOL', 105, 30, { align: 'center' });
      
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text('ALUMNI ASSOCIATION', 105, 40, { align: 'center' });

      // Certificate title
      doc.setFontSize(28);
      doc.setTextColor(0, 0, 0);
      doc.text('CERTIFICATE OF NOMINATION', 105, 60, { align: 'center' });

      // Decorative line
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(50, 65, 160, 65);

      // Election Year
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      doc.text(`ELECTION YEAR: ${candidate.electionYear || 2026}`, 105, 75, { align: 'center' });

      // This is to certify that
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('This is to certify that', 105, 95, { align: 'center' });

      // Candidate Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175);
      doc.text(candidate.fullName.toUpperCase(), 105, 110, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('has been duly nominated for the position of', 105, 125, { align: 'center' });

      // Position
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text(candidate.positionContested, 105, 140, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('in the', 105, 155, { align: 'center' });

      // Election Type
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(candidate.electionType, 105, 165, { align: 'center' });

      // Candidate Details Table - FIXED: Using autoTable function
      autoTable(doc, {
        startY: 180,
        head: [['Candidate Information', 'Details']],
        body: [
          ['Form Number', candidate.formNumber],
          ['Membership Number', candidate.membershipNumber],
          ['Date of Birth', candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString('en-NG') : 'N/A'],
          ['Year of Admission', candidate.yearOfAdmission || 'N/A'],
          ['Year of Graduation', candidate.yearOfGraduation || 'N/A'],
          ['Gender', candidate.gender || 'N/A'],
          ['Email', candidate.email || 'N/A'],
          ['Phone', candidate.phoneNumber || 'N/A'],
          ['Residential Address', candidate.residentialAddress || 'N/A'],
          ['Registration Status', candidate.isRegisteredMember ? 'Registered' : 'Not Registered'],
          ['Stanza Financial Status', candidate.isStanzaFinancial ? 'Up-to-date' : 'Not Up-to-date'],
          ['Dues Status', candidate.hasPaidAllDues ? 'Paid' : 'Pending'],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [240, 244, 248]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 100 }
        },
        margin: { left: 20, right: 20 }
      });

      // Sponsors Section
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('SPONSORS', 105, finalY, { align: 'center' });

      // Sponsors Table - FIXED: Using autoTable function
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Sponsor', 'Full Name', 'Stanza', 'Date']],
        body: [
          ['1st Sponsor', 
           candidate.sponsor1Name || 'N/A', 
           candidate.sponsor1Stanza || 'N/A',
           candidate.sponsor1Date ? new Date(candidate.sponsor1Date).toLocaleDateString('en-NG') : 'N/A'
          ],
          ['2nd Sponsor', 
           candidate.sponsor2Name || 'N/A', 
           candidate.sponsor2Stanza || 'N/A',
           candidate.sponsor2Date ? new Date(candidate.sponsor2Date).toLocaleDateString('en-NG') : 'N/A'
          ]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10
        },
        margin: { left: 20, right: 20 }
      });

      // Declaration
      const declarationY = doc.lastAutoTable.finalY + 15;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 64, 175);
      doc.text('DECLARATION', 105, declarationY, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const declarationText = candidate.declarationName 
        ? `I, ${candidate.declarationName}, hereby declare that the information provided in this form is true and correct. I affirm that I meet all eligibility requirements and agree to abide by the constitution, electoral guidelines, and decisions of the Alumni Association.`
        : 'Declaration not provided.';
      
      const splitText = doc.splitTextToSize(declarationText, 170);
      doc.text(splitText, 20, declarationY + 10);

      // Declaration Date
      if (candidate.declarationDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Declaration Date: ${new Date(candidate.declarationDate).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`, 20, declarationY + 35);
      }

      // Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const statusColor = candidate.status === 'approved' ? [34, 197, 94] : 
                         candidate.status === 'rejected' ? [239, 68, 68] : [234, 179, 8];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`STATUS: ${candidate.status ? candidate.status.toUpperCase() : 'PENDING'}`, 105, declarationY + 50, { align: 'center' });

      // Review Information
      if (candidate.reviewedAt) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Reviewed on: ${new Date(candidate.reviewedAt).toLocaleDateString('en-NG')}`, 105, declarationY + 60, { align: 'center' });
      }

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated certificate. No signature is required.', 105, 280, { align: 'center' });
      
      // Save PDF
      const dateStr = new Date().toLocaleDateString('en-NG').replace(/\//g, '-');
      doc.save(`Nomination_Certificate_${candidate.formNumber}_${dateStr}.pdf`);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      setError('Error generating certificate. Please try again.');
    }
  };

  // Handle multiple certificate generation
  const generateBulkCertificates = () => {
    if (candidates.length === 0) {
      setError('No candidates to generate certificates for');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    candidates.forEach((candidate, index) => {
      setTimeout(() => {
        try {
          generateCertificate(candidate);
          successCount++;
        } catch (error) {
          console.error(`Error generating certificate for ${candidate.formNumber}:`, error);
          errorCount++;
        }
        
        // Show summary after last certificate
        if (index === candidates.length - 1) {
          setError(`Generated ${successCount} certificates successfully. ${errorCount} failed.`);
          setTimeout(() => setError(''), 5000);
        }
      }, index * 800);
    });
  };

  // Delete candidate function
  const handleDeleteClick = (candidate) => {
    setDeleteModal({
      isOpen: true,
      candidateId: candidate._id,
      candidateName: candidate.fullName,
      formNumber: candidate.formNumber
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/admin/candidates/${deleteModal.candidateId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCandidates(prev => prev.filter(c => c._id !== deleteModal.candidateId));
        setDeleteModal({ isOpen: false, candidateId: null, candidateName: '', formNumber: '' });
        setError('');
        alert('Candidate deleted successfully');
        fetchCandidates();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting candidate');
      setDeleteModal({ isOpen: false, candidateId: null, candidateName: '', formNumber: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, candidateId: null, candidateName: '', formNumber: '' });
  };

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  if (loading && candidates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igsaa-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Candidate</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the nomination for{' '}
                  <span className="font-semibold">{deleteModal.candidateName}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Form Number: <span className="font-mono font-medium">{deleteModal.formNumber}</span>
                </p>
                <p className="text-sm text-red-600 mt-4">
                  ⚠️ This will permanently delete all candidate data and uploaded files.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidates</h1>
          <p className="text-gray-600">Manage nomination submissions</p>
        </div>
        <div className="flex flex-wrap gap-4 md:flex-nowrap space-x-4">
          <button
            onClick={fetchCandidates}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          
          {/* Bulk Certificate Generation Button */}
          {candidates.length > 0 && (
            <button
              onClick={generateBulkCertificates}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Generate All Certificates
            </button>
          )}
          
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, email, or form number"
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={filters.position}
              onChange={handleFilterChange}
              placeholder="Filter by position"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Election Type
            </label>
            <select
              name="electionType"
              value={filters.electionType}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
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
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                <tr key={candidate._id} className="hover:bg-gray-50 transition-colors">
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
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        candidate.status === 'approved' ? 'bg-green-100 text-green-800' :
                        candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {candidate.status}
                      </span>
                      {candidate.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(candidate._id, 'approved')}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Approve
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleStatusUpdate(candidate._id, 'rejected')}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {candidate.submittedAt && new Date(candidate.submittedAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/candidates/${candidate._id}`}
                        className="text-igsaa-blue hover:text-igsaa-blue-dark transition-colors flex items-center gap-1"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View
                      </Link>
                      
                      {/* Generate Certificate Button */}
                      <button
                        onClick={() => generateCertificate(candidate)}
                        className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1"
                        title="Generate Certificate"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        Certificate
                      </button>
                      
                      <button
                        onClick={() => {
                          const dataStr = JSON.stringify(candidate, null, 2);
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                          const link = document.createElement('a');
                          link.setAttribute('href', dataUri);
                          link.setAttribute('download', `${candidate.formNumber}.json`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                        title="Export as JSON"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Export
                      </button>
                      
                      {/* Delete Button - Only visible to admin */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteClick(candidate)}
                          className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                          title="Delete Candidate"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {candidates.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm3-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 font-medium">No candidates found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-igsaa-blue text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  Next
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesList;