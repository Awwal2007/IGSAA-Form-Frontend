import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [fileUrls, setFileUrls] = useState({});
  const [fileInfo, setFileInfo] = useState({});

  const API_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/candidates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const candidateData = response.data.data;
        setCandidate(candidateData);
        setStatus(candidateData.status);
        
        // Fetch file info and previews
        await fetchFileInfo(candidateData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading candidate details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileInfo = async (candidateData) => {
    const urls = {};
    const info = {};
    const fileFields = ['passportPhoto', 'signature', 'stanzaTestimony', 'sponsorsSignature'];
    
    for (const field of fileFields) {
      if (candidateData[field]) {
        try {
          // First get file info
          const infoRes = await axios.get(`${API_URL}/upload/info/${candidateData[field]}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (infoRes.data.success) {
            info[field] = infoRes.data.file;
            
            // If it's an image, create preview
            if (infoRes.data.file.contentType?.startsWith('image/')) {
              const fileRes = await axios.get(`${API_URL}/upload/id/${candidateData[field]}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
              });
              
              urls[field] = URL.createObjectURL(fileRes.data);
            }
          }
        } catch (err) {
          console.error(`Error fetching ${field}:`, err);
          info[field] = null;
          urls[field] = null;
        }
      }
    }
    
    setFileUrls(urls);
    setFileInfo(info);
  };

  const getFileDownloadUrl = (fileId) => {
    if (!fileId) return '#';
    return `${API_URL}/upload/id/${fileId}`;
  };

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith('image/')) return '🖼️';
    if (contentType?.includes('pdf')) return '📕';
    if (contentType?.includes('word')) return '📘';
    if (contentType?.includes('document')) return '📄';
    return '📎';
  };

  const getFileName = (field) => {
    switch(field) {
      case 'passportPhoto':
        return 'Passport Photograph';
      case 'stanzaTestimony':
        return 'Stanza Testimony';
      case 'signature':
        return 'Candidate Signature';
      case 'sponsorsSignature':
        return 'Sponsors Signatures';
      case 'otherDocuments':
        return 'Additional Documents';
      default:
        return field;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await axios.patch(
        `${API_URL}/admin/candidates/${id}/status`,
        { status, notes },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCandidate(response.data.data);
        setNotes('');
        alert('Status updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleAddNote = async () => {
    if (!notes.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/admin/candidates/${id}/notes`,
        { notes },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCandidate(response.data.data);
        setNotes('');
        alert('Note added successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding note');
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(fileUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [fileUrls]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igsaa-blue"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Candidate not found</h3>
        <button
          onClick={() => navigate('/admin/candidates')}
          className="mt-4 text-igsaa-blue hover:text-igsaa-blue-dark"
        >
          ← Back to candidates
        </button>
      </div>
    );
  }

  const Section = ({ title, children }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="mb-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || 'Not provided'}</dd>
    </div>
  );

  const FilePreview = ({ field, fileId }) => {
    if (!fileId) return null;
    
    const info = fileInfo[field];
    const isImage = info?.contentType?.startsWith('image/');
    const fileUrl = fileUrls[field];
    const downloadUrl = getFileDownloadUrl(fileId);
    
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-igsaa-blue/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <span className="text-2xl">{getFileIcon(info?.contentType)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{getFileName(field)}</h4>
                {info && (
                  <span className="text-xs text-gray-500">
                    {formatFileSize(info.length)}
                  </span>
                )}
              </div>
              
              {info && (
                <p className="text-xs text-gray-500 mt-1">
                  {info.contentType} • Uploaded: {new Date(info.uploadDate).toLocaleDateString()}
                </p>
              )}
              
              {isImage && fileUrl ? (
                <div className="mt-3">
                  <img 
                    src={fileUrl} 
                    alt={getFileName(field)}
                    className="max-w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-white"
                  />
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-igsaa-blue transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download
                  </a>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-igsaa-blue transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/candidates')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Candidates
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {candidate.fullName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                candidate.status === 'approved' ? 'bg-green-100 text-green-800' :
                candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {candidate.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Form Number: <span className="font-mono font-medium">{candidate.formNumber}</span>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Submitted: {new Date(candidate.submittedAt).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Candidate Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Position Being Contested" value={candidate.positionContested} />
                <InfoRow label="Election Type" value={candidate.electionType} />
                {candidate.otherElectionType && (
                  <InfoRow label="Other Election Type" value={candidate.otherElectionType} />
                )}
                <InfoRow label="Form Number" value={candidate.formNumber} />
                <InfoRow label="Election Year" value={candidate.electionYear} />
              </div>
            </Section>
          </div>

          {/* Bio-Data */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="Candidate's Bio-Data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={candidate.fullName} />
                <InfoRow label="Gender" value={candidate.gender} />
                <InfoRow label="Date of Birth" value={new Date(candidate.dateOfBirth).toLocaleDateString('en-NG')} />
                <InfoRow label="Year of Admission" value={candidate.yearOfAdmission} />
                <InfoRow label="Year of Graduation" value={candidate.yearOfGraduation} />
                <InfoRow label="Membership Number" value={candidate.membershipNumber} />
                <InfoRow label="Phone Number" value={candidate.phoneNumber} />
                <InfoRow label="Email" value={candidate.email} />
                <div className="md:col-span-2">
                  <InfoRow label="Residential Address" value={candidate.residentialAddress} />
                </div>
              </div>
            </Section>
          </div>

          {/* Membership & Eligibility */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="Membership & Eligibility">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow 
                  label="Registered Member" 
                  value={candidate.isRegisteredMember ? 'Yes' : 'No'} 
                />
                <InfoRow 
                  label="Stanza Financial Member" 
                  value={candidate.isStanzaFinancial ? 'Yes' : 'No'} 
                />
                <InfoRow 
                  label="Paid All Dues" 
                  value={candidate.hasPaidAllDues ? 'Yes' : 'No'} 
                />
                <InfoRow 
                  label="Ever Disciplined" 
                  value={candidate.hasBeenDisciplined ? 'Yes' : 'No'} 
                />
                {candidate.hasBeenDisciplined && candidate.disciplineDetails && (
                  <div className="md:col-span-2">
                    <InfoRow label="Discipline Details" value={candidate.disciplineDetails} />
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* Experience & Service */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="Experience & Service">
              <div className="space-y-4">
                <InfoRow 
                  label="Previous Positions Held" 
                  value={candidate.previousPositions || 'None provided'} 
                />
                <InfoRow 
                  label="Other Relevant Experience" 
                  value={candidate.otherExperience || 'None provided'} 
                />
              </div>
            </Section>
          </div>

          {/* Sponsors */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="Sponsors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-igsaa-blue/10 rounded-full flex items-center justify-center text-xs font-bold text-igsaa-blue">
                      1
                    </span>
                    First Sponsor
                  </h4>
                  <InfoRow label="Full Name" value={candidate.sponsor1Name} />
                  <InfoRow label="Stanza" value={candidate.sponsor1Stanza} />
                  <InfoRow 
                    label="Date" 
                    value={new Date(candidate.sponsor1Date).toLocaleDateString('en-NG')} 
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-igsaa-blue/10 rounded-full flex items-center justify-center text-xs font-bold text-igsaa-blue">
                      2
                    </span>
                    Second Sponsor
                  </h4>
                  <InfoRow label="Full Name" value={candidate.sponsor2Name} />
                  <InfoRow label="Stanza" value={candidate.sponsor2Stanza} />
                  <InfoRow 
                    label="Date" 
                    value={new Date(candidate.sponsor2Date).toLocaleDateString('en-NG')} 
                  />
                </div>
              </div>
            </Section>
          </div>

          {/* Declaration */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <Section title="Declaration">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <p className="italic text-gray-700 mb-3">
                  "I, <span className="font-semibold not-italic">{candidate.declarationName}</span>, hereby declare that the information provided in this form is true and correct."
                </p>
                <InfoRow 
                  label="Declaration Date" 
                  value={new Date(candidate.declarationDate).toLocaleDateString('en-NG')} 
                />
              </div>
            </Section>
          </div>
        </div>

        {/* Right column - Admin Actions and Files */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-igsaa-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Update Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approve Nomination</option>
                  <option value="rejected">Reject Nomination</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  placeholder="Add notes about this status change..."
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                className="w-full px-4 py-2 bg-igsaa-blue text-white font-medium rounded-lg hover:bg-igsaa-blue-dark focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:ring-offset-2 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>

          {/* Files */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-igsaa-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Attached Documents
            </h3>
            
            <div className="space-y-4">
              <FilePreview field="passportPhoto" fileId={candidate.passportPhoto} />
              <FilePreview field="signature" fileId={candidate.signature} />
              <FilePreview field="stanzaTestimony" fileId={candidate.stanzaTestimony} />
              <FilePreview field="sponsorsSignature" fileId={candidate.sponsorsSignature} />
              
              {candidate.otherDocuments && candidate.otherDocuments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Additional Documents</h4>
                  <div className="space-y-2">
                    {candidate.otherDocuments.map((docId, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-igsaa-blue/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📄</span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">Document {index + 1}</span>
                            <p className="text-xs text-gray-500">
                              Click to view or download
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={getFileDownloadUrl(docId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-igsaa-blue transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            View
                          </a>
                          <a
                            href={getFileDownloadUrl(docId)}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-igsaa-blue transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-igsaa-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Admin Notes
            </h3>
            <div className="space-y-4">
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  placeholder="Add a note..."
                />
                <button
                  onClick={handleAddNote}
                  className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  Add Note
                </button>
              </div>
              
              {candidate.adminNotes && candidate.adminNotes.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm font-medium text-gray-500">Note History</h4>
                  {candidate.adminNotes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900">{note.note}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;