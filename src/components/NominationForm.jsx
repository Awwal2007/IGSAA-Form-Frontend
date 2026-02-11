import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const NominationForm = () => {
  const [formData, setFormData] = useState({
    // Section A
    positionContested: '',
    electionType: '',
    otherElectionType: '',
    formNumber: `IGSAA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    
    // Section B
    fullName: '',
    gender: '',
    dateOfBirth: null,
    yearOfAdmission: '',
    yearOfGraduation: '',
    membershipNumber: '',
    residentialAddress: '',
    phoneNumber: '',
    email: '',
    
    // Section C - Initialize as null instead of false
    isRegisteredMember: null,
    isStanzaFinancial: null,
    hasPaidAllDues: null,
    hasBeenDisciplined: null,
    disciplineDetails: '',
    
    // Section D
    previousPositions: '',
    otherExperience: '',
    
    // Section E
    sponsor1Name: '',
    sponsor1Stanza: '',
    sponsor1Date: null,
    
    // Section F
    sponsor2Name: '',
    sponsor2Stanza: '',
    sponsor2Date: null,
    
    // Section G
    declarationName: '',
    declarationDate: null,
    
    // Files
    files: {
      passportPhoto: null,
      stanzaTestimony: null,
      signature: null,
      sponsorsSignature: null,
      otherDocuments: []
    }
  });

  const [uploadProgress, setUploadProgress] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [formProgress, setFormProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [fileErrors, setFileErrors] = useState({});

  // Refs for scrolling
  const successMessageRef = useRef(null);
  const formTopRef = useRef(null);

  // File input refs
  const fileRefs = useRef({
    passportPhoto: null,
    stanzaTestimony: null,
    signature: null,
    sponsorsSignature: null,
    otherDocuments: null
  });

  const API_URL = import.meta.env.VITE_BASE_URL;

  // Scroll to top function
  const scrollToTop = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to success message
  const scrollToSuccessMessage = () => {
    setTimeout(() => {
      if (successMessageRef.current) {
        successMessageRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      } else {
        scrollToTop();
      }
    }, 100);
  };

  // Calculate form progress - FIXED VERSION
  const calculateProgress = () => {
    if (submitting) return 100;
    
    let filledFields = 0;
    const totalRequiredFields = 28; // Total required fields (including 4 required files)
    
    // Helper function to check if a field has value
    const hasValue = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'boolean') return true;
      if (value instanceof Date) return true;
      return !!value;
    };
    
    // Section A (2-3 fields depending on election type)
    if (hasValue(formData.positionContested)) filledFields++;
    if (hasValue(formData.electionType)) filledFields++;
    if (formData.electionType === 'Other' && hasValue(formData.otherElectionType)) {
      filledFields++;
    } else if (formData.electionType !== 'Other' && formData.electionType !== '') {
      filledFields++;
    }
    
    // Section B (9 fields)
    if (hasValue(formData.fullName)) filledFields++;
    if (hasValue(formData.gender)) filledFields++;
    if (hasValue(formData.dateOfBirth)) filledFields++;
    if (hasValue(formData.yearOfAdmission)) filledFields++;
    if (hasValue(formData.yearOfGraduation)) filledFields++;
    if (hasValue(formData.membershipNumber)) filledFields++;
    if (hasValue(formData.residentialAddress)) filledFields++;
    if (hasValue(formData.phoneNumber)) filledFields++;
    if (hasValue(formData.email)) filledFields++;
    
    // Section C (4 fields - boolean)
    if (formData.isRegisteredMember !== null) filledFields++;
    if (formData.isStanzaFinancial !== null) filledFields++;
    if (formData.hasPaidAllDues !== null) filledFields++;
    if (formData.hasBeenDisciplined !== null) filledFields++;
    
    // Section E (3 fields)
    if (hasValue(formData.sponsor1Name)) filledFields++;
    if (hasValue(formData.sponsor1Stanza)) filledFields++;
    if (hasValue(formData.sponsor1Date)) filledFields++;
    
    // Section F (3 fields)
    if (hasValue(formData.sponsor2Name)) filledFields++;
    if (hasValue(formData.sponsor2Stanza)) filledFields++;
    if (hasValue(formData.sponsor2Date)) filledFields++;
    
    // Section G (2 fields)
    if (hasValue(formData.declarationName)) filledFields++;
    if (hasValue(formData.declarationDate)) filledFields++;
    
    // Required Files (4 fields)
    if (formData.files.passportPhoto) filledFields++;
    if (formData.files.stanzaTestimony) filledFields++;
    if (formData.files.signature) filledFields++;
    if (formData.files.sponsorsSignature) filledFields++;
    
    // Calculate percentage
    const percentage = Math.round((filledFields / totalRequiredFields) * 100);
    
    return Math.min(percentage, 100);
  };

  // Update progress on form changes
  useEffect(() => {
    setFormProgress(calculateProgress());
  }, [formData, submitting]);

  // Validate required files
  const validateRequiredFiles = () => {
    const errors = {};
    const requiredFiles = ['passportPhoto', 'stanzaTestimony', 'signature', 'sponsorsSignature'];
    
    requiredFiles.forEach(field => {
      if (!formData.files[field]) {
        errors[field] = 'This file is required';
      }
    });
    
    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleFileChange = (e, field) => {
    const files = e.target.files;
    
    // Clear error for this field
    if (fileErrors[field]) {
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === 'otherDocuments') {
      setFormData(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [field]: [...files]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [field]: files[0]
        }
      }));
    }
  };

  const uploadFile = async (file, field) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/upload/single`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [field]: percentCompleted
          }));
        }
      });
      
      return response.data.fileId;
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      
      if (error.response) {
        if (error.response.status === 413) {
          throw new Error('File too large. Maximum size is 10MB');
        } else if (error.response.status === 400) {
          throw new Error('Invalid file type. Only images and PDFs are allowed');
        } else {
          throw new Error(error.response.data.message || `Error uploading ${field}`);
        }
      } else if (error.request) {
        throw new Error('Network error. Please check your connection');
      } else {
        throw new Error('Error uploading file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required files
    if (!validateRequiredFiles()) {
      // Scroll to file section
      document.getElementById('sectionFiles')?.scrollIntoView({ behavior: 'smooth' });
      setCurrentSection(7);
      
      setSubmitMessage({
        type: 'error',
        message: 'Please upload all required documents before submitting.'
      });
      return;
    }
    
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      // Upload files
      const fileUploads = {};
      const fileFields = ['passportPhoto', 'stanzaTestimony', 'signature', 'sponsorsSignature'];
      
      for (const field of fileFields) {
        if (formData.files[field]) {
          const fileId = await uploadFile(formData.files[field], field);
          fileUploads[field] = fileId;
        }
      }

      // Upload other documents (optional)
      if (formData.files.otherDocuments.length > 0) {
        const otherDocs = [];
        for (const file of formData.files.otherDocuments) {
          const fileId = await uploadFile(file, 'otherDocument');
          otherDocs.push(fileId);
        }
        fileUploads.otherDocuments = otherDocs;
      }

      // Prepare final data
      const submissionData = {
        ...formData,
        ...fileUploads,
        dateOfBirth: formData.dateOfBirth,
        sponsor1Date: formData.sponsor1Date,
        sponsor2Date: formData.sponsor2Date,
        declarationDate: formData.declarationDate
      };

      // Submit form
      const response = await axios.post(`${API_URL}/candidates`, submissionData);
      
      setSubmitMessage({
        type: 'success',
        message: `Nomination submitted successfully! Your Form Number is: ${response.data.formNumber}`,
        formNumber: response.data.formNumber
      });
      
      // Scroll to success message after state update
      setTimeout(() => {
        scrollToSuccessMessage();
      }, 100);
      
      // Reset form
      setFormData({
        positionContested: '',
        electionType: '',
        otherElectionType: '',
        formNumber: `IGSAA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: '',
        gender: '',
        dateOfBirth: null,
        yearOfAdmission: '',
        yearOfGraduation: '',
        membershipNumber: '',
        residentialAddress: '',
        phoneNumber: '',
        email: '',
        isRegisteredMember: null,
        isStanzaFinancial: null,
        hasPaidAllDues: null,
        hasBeenDisciplined: null,
        disciplineDetails: '',
        previousPositions: '',
        otherExperience: '',
        sponsor1Name: '',
        sponsor1Stanza: '',
        sponsor1Date: null,
        sponsor2Name: '',
        sponsor2Stanza: '',
        sponsor2Date: null,
        declarationName: '',
        declarationDate: null,
        files: {
          passportPhoto: null,
          stanzaTestimony: null,
          signature: null,
          sponsorsSignature: null,
          otherDocuments: []
        }
      });
      
      // Reset all file inputs
      Object.values(fileRefs.current).forEach(ref => {
        if (ref) ref.value = '';
      });
      
      // Clear upload progress
      setUploadProgress({});
      
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error.response?.data?.message || 'Error submitting nomination. Please try again.'
      });
      
      // Scroll to error message
      setTimeout(() => {
        scrollToSuccessMessage();
      }, 100);
      
    } finally {
      setSubmitting(false);
    }
  };

  // Custom File Upload Component with visual feedback
  const FileUpload = ({ label, field, accept, multiple, description, required = false }) => {
    const hasFile = multiple 
      ? formData.files[field]?.length > 0
      : formData.files[field];
    
    const fileName = multiple 
      ? formData.files[field]?.map(f => f.name).join(', ')
      : formData.files[field]?.name;
    
    const hasError = fileErrors[field];

    const getFileIcon = (fileName) => {
      if (!fileName) return '📄';
      const ext = fileName.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
      if (['pdf'].includes(ext)) return '📕';
      if (['doc', 'docx'].includes(ext)) return '📘';
      return '📄';
    };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {required && !hasFile && (
            <span className="text-xs text-red-500 font-medium">Required</span>
          )}
        </div>
        <span className="text-xs font-normal text-gray-500 block mb-2">{description}</span>
        
        <div className={`relative border-2 rounded-xl transition-all duration-300 cursor-pointer
          ${hasError ? 'border-red-500 bg-red-50' : 
            hasFile ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-igsaa-blue'
          }`}>
          <input
            ref={el => fileRefs.current[field] = el}
            type="file"
            onChange={(e) => handleFileChange(e, field)}
            accept={accept}
            multiple={multiple}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id={`file-${field}`}
            required={required && !hasFile}
          />
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center 
                ${hasError ? 'bg-red-100 text-red-600' :
                  hasFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                <span className="text-2xl">{getFileIcon(fileName)}</span>
              </div>
              
              <div>
                {hasFile ? (
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {multiple ? `${formData.files[field]?.length} files selected` : fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {multiple ? 'Multiple files' : 'Click to change file'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">Choose a file</p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-lg 
              ${hasError ? 'bg-red-100 text-red-700' :
                hasFile ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
              <span className="text-sm font-medium">
                {hasFile ? 'Selected ✓' : 'Browse'}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {hasError}
          </p>
        )}

        {/* File details */}
        {hasFile && !hasError && (
          <div className="mt-2 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓ File selected</span>
                {!multiple && fileName && (
                  <span className="text-gray-500">• {Math.round(formData.files[field].size / 1024)} KB</span>
                )}
              </div>
              {multiple && formData.files[field]?.length > 0 && (
                <span className="text-igsaa-blue font-medium">
                  {formData.files[field].length} file(s)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress[field] > 0 && uploadProgress[field] < 100 && (
          <div className="mt-3 animate-fade-in">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-igsaa-blue font-medium">Uploading...</span>
              <span className="text-gray-600">{uploadProgress[field]}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-igsaa-blue transition-all duration-300"
                style={{ width: `${uploadProgress[field]}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Form sections for navigation
  const sections = [
    { id: 'sectionA', title: 'General Information' },
    { id: 'sectionB', title: 'Bio-Data' },
    { id: 'sectionC', title: 'Membership & Eligibility' },
    { id: 'sectionD', title: 'Experience & Service' },
    { id: 'sectionE', title: '1st Sponsor' },
    { id: 'sectionF', title: '2nd Sponsor' },
    { id: 'sectionG', title: 'Declaration' },
    { id: 'sectionFiles', title: 'Documents' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-1 sm:px-6">
      {/* Hidden anchor for scrolling to top */}
      <div ref={formTopRef} className="h-0"></div>
      
      {/* Progress Bar */}
      <div className="mb-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nomination Form Progress</h3>
            <p className="text-sm text-gray-600">Complete all sections to submit your nomination</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-igsaa-blue">{formProgress}%</span>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>
        
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-igsaa-blue to-igsaa-blue-dark transition-all duration-500"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
        
        {/* Section dots */}
        <div className="flex justify-between mt-4 overflow-x-auto pb-2">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                setCurrentSection(index);
              }}
              className={`flex flex-col items-center mx-1 ${index === currentSection ? 'text-igsaa-blue' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                index <= currentSection 
                  ? 'bg-igsaa-blue text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {index < currentSection ? '✓' : index + 1}
              </div>
              <span className="text-xs font-medium hidden md:block">{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Success/Error Message - with ref for scrolling */}
      {submitMessage && (
        <div 
          ref={successMessageRef}
          className={`mb-8 rounded-2xl p-6 animate-slide-down scroll-mt-4 ${
            submitMessage.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              submitMessage.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {submitMessage.type === 'success' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-lg font-semibold mb-1 ${
                submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {submitMessage.type === 'success' ? 'Nomination Submitted Successfully!' : 'Submission Error'}
              </h4>
              <p className={`mb-2 ${submitMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {submitMessage.message}
              </p>
              {submitMessage.formNumber && (
                <div className="mt-3 p-3 bg-white/50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Your Form Number:</p>
                  <p className="text-xl font-bold text-igsaa-blue-dark font-mono">{submitMessage.formNumber}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please save this number for future reference and tracking.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A - General Information */}
        <div id="sectionA" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SECTION A: GENERAL INFORMATION</h3>
              <p className="text-gray-600">Basic details about your nomination</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Position Being Contested
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="positionContested"
                value={formData.positionContested}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent transition-all"
                placeholder="e.g., President, Secretary, Treasurer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Election Type
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="space-y-3">
                {['Executive Election', 'By-Election', 'Other'].map(type => (
                  <label key={type} className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="electionType"
                        value={type}
                        checked={formData.electionType === type}
                        onChange={handleInputChange}
                        className="sr-only peer"
                        required
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-igsaa-blue transition-colors group-hover:border-igsaa-blue/50"></div>
                      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all ${
                        formData.electionType === type ? 'bg-igsaa-blue scale-100' : 'scale-0'
                      }`}></div>
                    </div>
                    <span className="ml-3 text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {formData.electionType === 'Other' && (
                <div className="mt-4">
                  <input
                    type="text"
                    name="otherElectionType"
                    value={formData.otherElectionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                    placeholder="Specify other election type"
                    required
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Form Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.formNumber}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-700"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Auto-generated</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This unique ID will be used to track your nomination
            </p>
          </div>
        </div>

        {/* Section B - Bio-Data */}
        <div id="sectionB" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SECTION B: CANDIDATE'S BIO-DATA</h3>
              <p className="text-gray-600">Personal and contact information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name (Surname First)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                placeholder="Surname Firstname Middlename"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Prefer not to say'].map(gender => (
                  <label key={gender} className="relative">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      required
                    />
                    <div className={`p-3 text-center rounded-xl border-2 cursor-pointer transition-all ${
                      formData.gender === gender
                        ? 'border-igsaa-blue bg-igsaa-blue/5 text-igsaa-blue'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                      {gender}
                    </div>
                    {formData.gender === gender && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-igsaa-blue rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.dateOfBirth}
                  onChange={(date) => handleDateChange(date, 'dateOfBirth')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                  showYearDropdown
                  placeholderText="Select date"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📅
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year of Admission into IGS
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                name="yearOfAdmission"
                value={formData.yearOfAdmission}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                min="1900"
                max={new Date().getFullYear()}
                placeholder="YYYY"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year of Graduation/Stanza
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                name="yearOfGraduation"
                value={formData.yearOfGraduation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                min={formData.yearOfAdmission || 1900}
                max={new Date().getFullYear()}
                placeholder="YYYY"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alumni Membership Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="membershipNumber"
                value={formData.membershipNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                placeholder="e.g., IGSAA-2024-001"
                required
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Residential Address
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="residentialAddress"
              value={formData.residentialAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent resize-none"
              rows="3"
              placeholder="Full residential address"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                placeholder="+234 800 000 0000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Section C - Membership & Eligibility */}
        <div id="sectionC" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SECTION C: MEMBERSHIP & ELIGIBILITY</h3>
              <p className="text-gray-600">Membership status and eligibility criteria</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {[
              { name: 'isRegisteredMember', label: 'Are you a registered member of your stanza and IGSAA?' },
              { name: 'isStanzaFinancial', label: 'Is your stanza a up-to-date financial member of IGSAA?' },
              { name: 'hasPaidAllDues', label: 'Have you paid all dues, levies, and obligations of your stanza?' },
              { name: 'hasBeenDisciplined', label: 'Have you ever been suspended or disciplined by your stanza or IGSAA?' }
            ].map(({ name, label }) => (
              <div key={name} className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-700 mb-3 font-medium">{label}</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name={name}
                        value="true"
                        checked={formData[name] === true}
                        onChange={() => setFormData(prev => ({ ...prev, [name]: true }))}
                        className="sr-only peer"
                        required
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-green-500 transition-colors"></div>
                      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all ${
                        formData[name] === true ? 'bg-green-500 scale-100' : 'scale-0'
                      }`}></div>
                    </div>
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name={name}
                        value="false"
                        checked={formData[name] === false}
                        onChange={() => setFormData(prev => ({ ...prev, [name]: false }))}
                        className="sr-only peer"
                        required
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-gray-400 transition-colors"></div>
                      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all ${
                        formData[name] === false ? 'bg-gray-400 scale-100' : 'scale-0'
                      }`}></div>
                    </div>
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>
            ))}
            
            {formData.hasBeenDisciplined && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  If yes, provide details
                </label>
                <textarea
                  name="disciplineDetails"
                  value={formData.disciplineDetails}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  rows="3"
                  placeholder="Please provide details of the disciplinary action..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Section D - Experience & Service */}
        <div id="sectionD" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SECTION D: EXPERIENCE & SERVICE</h3>
              <p className="text-gray-600">Leadership and community service history</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Previous Positions Held in your stanza and IGSAA (if any)
              </label>
              <textarea
                name="previousPositions"
                value={formData.previousPositions}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent resize-none"
                rows="4"
                placeholder="List any previous positions held, including dates and responsibilities..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Other Relevant Leadership or Community Experience
              </label>
              <textarea
                name="otherExperience"
                value={formData.otherExperience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent resize-none"
                rows="4"
                placeholder="Describe any other leadership roles, community service, or relevant experience..."
              />
            </div>
          </div>
        </div>

        {/* Section E & F - Sponsors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section E - 1st Sponsor */}
          <div id="sectionE" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">SECTION E: 1ST SPONSOR</h3>
                <p className="text-gray-600">Primary sponsor details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="sponsor1Name"
                  value={formData.sponsor1Name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stanza
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="sponsor1Stanza"
                  value={formData.sponsor1Stanza}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <DatePicker
                  selected={formData.sponsor1Date}
                  onChange={(date) => handleDateChange(date, 'sponsor1Date')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section F - 2nd Sponsor */}
          <div id="sectionF" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl">
                <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">SECTION F: 2ND SPONSOR</h3>
                <p className="text-gray-600">Secondary sponsor details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="sponsor2Name"
                  value={formData.sponsor2Name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stanza
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="sponsor2Stanza"
                  value={formData.sponsor2Stanza}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <DatePicker
                  selected={formData.sponsor2Date}
                  onChange={(date) => handleDateChange(date, 'sponsor2Date')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section G - Declaration */}
        <div id="sectionG" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">SECTION G: DECLARATION BY THE CANDIDATE</h3>
              <p className="text-gray-600">Final declaration and commitment</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <div className="italic text-gray-700 mb-6">
              <p className="mb-4">
                I, 
                <input
                  type="text"
                  name="declarationName"
                  value={formData.declarationName}
                  onChange={handleInputChange}
                  className="inline-block mx-2 px-4 py-2 w-full border-2 border-dashed border-blue-300 rounded-lg focus:outline-none focus:border-solid focus:border-igsaa-blue focus:ring-2 focus:ring-igsaa-blue/30 bg-white"
                  placeholder="Enter your full name here"
                  required
                  style={{ minWidth: '200px' }}
                />
                , hereby declare that the information provided in this form is true and correct.
              </p>
              <p>
                I affirm that I meet all eligibility requirements and agree to abide by the constitution, electoral guidelines, and decisions of the Alumni Association.
              </p>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Declaration Date
                <span className="text-red-500 ml-1">*</span>
              </label>
              <DatePicker
                selected={formData.declarationDate}
                onChange={(date) => handleDateChange(date, 'declarationDate')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-igsaa-blue focus:border-transparent"
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date"
                required
              />
            </div>
          </div>
        </div>

        {/* File Upload Section - REQUIRED FILES */}
        <div id="sectionFiles" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">ATTACH REQUIRED DOCUMENTS</h3>
              <p className="text-gray-600">Upload all required supporting documents (<span className="text-red-500 font-semibold">* Required</span>)</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <FileUpload 
              label="Passport Photograph"
              field="passportPhoto"
              accept="image/*"
              description="Recent passport-sized photo (JPG/PNG, max 5MB)"
              required={true}
            />
            
            <FileUpload 
              label="Testimony from Your Stanza"
              field="stanzaTestimony"
              accept=".pdf,.doc,.docx"
              description="Official testimony document (PDF/DOC, max 10MB)"
              required={true}
            />
            
            <FileUpload 
              label="Your Signature"
              field="signature"
              accept="image/*,.pdf"
              description="Scanned or digital signature (Image/PDF, max 5MB)"
              required={true}
            />
            
            <FileUpload 
              label="Sponsors' Signatures"
              field="sponsorsSignature"
              accept="image/*,.pdf"
              description="Signatures of both sponsors (Image/PDF, max 5MB)"
              required={true}
            />
            
            <FileUpload 
              label="Additional Documents (Optional)"
              field="otherDocuments"
              accept=".pdf,.doc,.docx,image/*"
              multiple={true}
              description="Any other supporting documents (max 10MB each)"
              required={false}
            />
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Document Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">•</span>
                    <span><span className="font-semibold">Passport Photograph, Stanza Testimony, Your Signature, and Sponsors' Signatures</span> are <span className="text-red-600 font-bold">REQUIRED</span></span>
                  </li>
                  <li>• All files must be clear and legible</li>
                  <li>• Maximum file size: 10MB each</li>
                  <li>• Accepted formats: JPG, PNG, PDF, DOC, DOCX</li>
                  <li>• Passport photo must be recent (taken within last 6 months)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="bg-gradient-to-r from-igsaa-blue/5 to-igsaa-blue-light/5 rounded-2xl p-6 md:p-8 border border-igsaa-blue/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Submit?</h3>
              <p className="text-gray-600">
                Please review all information before submitting. Once submitted, changes cannot be made.
                Your nomination will be reviewed by the election committee.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-3 h-3 rounded-full ${formProgress === 100 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">
                  {formProgress === 100 ? 'All sections completed ✓' : `Form ${formProgress}% complete`}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                    window.location.reload();
                  }
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                Reset Form
              </button>
              
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-igsaa-blue to-igsaa-blue-dark text-white font-semibold rounded-xl hover:from-igsaa-blue-dark hover:to-igsaa-blue-darker transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
                disabled={submitting || formProgress < 100}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Submit Nomination
                  </>
                )}
              </button>
            </div>
          </div>
          
          {formProgress < 100 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-yellow-800 font-medium">
                    Complete all required fields before submitting
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please fill in all sections marked with <span className="text-red-500">*</span> and upload all 
                    <span className="font-semibold"> required documents</span> to enable submission.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NominationForm;