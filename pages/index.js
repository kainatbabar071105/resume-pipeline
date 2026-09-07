import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF or Image file');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5001/api/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.parsed);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('❌ Failed to connect to server. Make sure Flask is running on port 5001');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fa 100%)',
      fontFamily: '"Segoe UI", Arial, sans-serif',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '750px',
        width: '100%',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 50, 100, 0.12)',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px'
          }}>📄</div>
          <h1 style={{
            color: '#1a3a5c',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            Resume Parser AI
          </h1>
          <p style={{
            color: '#6b8ba4',
            fontSize: '16px',
            margin: 0
          }}>
            Upload a PDF, JPG, or PNG to extract details + AI Summary
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#2563eb' : '#c5d9e8'}`,
            borderRadius: '16px',
            padding: '35px 20px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : '#fafcff',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          <div style={{
            fontSize: '42px',
            marginBottom: '12px',
            opacity: '0.7'
          }}>📤</div>
          <p style={{
            color: '#1a3a5c',
            fontSize: '16px',
            fontWeight: '500',
            margin: '0 0 6px 0'
          }}>
            {dragActive ? 'Drop your file here' : 'Drag & drop your resume here'}
          </p>
          <p style={{
            color: '#8aa9c4',
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            or click to browse
          </p>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              border: 0
            }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              display: 'inline-block',
              padding: '10px 28px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
            }}
          >
            Choose File
          </label>

          {file && (
            <div style={{
              marginTop: '16px',
              padding: '10px 16px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              display: 'inline-block',
              color: '#1a3a5c',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(37, 99, 235, 0.3)',
            marginBottom: '20px',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(37, 99, 235, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
            }
          }}
        >
          {loading ? (
            <span>
              <span style={{
                display: 'inline-block',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }}>⏳</span>
              Processing...
            </span>
          ) : '🚀 Parse Resume'}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#fef2f2',
            borderRadius: '10px',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{
              border: '1px solid #e2edf7',
              borderRadius: '14px',
              padding: '24px',
              backgroundColor: '#f8fcff'
            }}>
              <h3 style={{
                color: '#1a3a5c',
                fontSize: '18px',
                margin: '0 0 18px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '22px' }}>✅</span> Extracted Data
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '13px',
                  color: '#6b8ba4',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>Name</div>
                <div style={{
                  fontSize: '16px',
                  color: '#1a3a5c',
                  fontWeight: '500',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2edf7'
                }}>{result.name || 'Not found'}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '13px',
                  color: '#6b8ba4',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>Email</div>
                <div style={{
                  fontSize: '16px',
                  color: '#1a3a5c',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2edf7',
                  wordBreak: 'break-all'
                }}>{result.email || 'Not found'}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '13px',
                  color: '#6b8ba4',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>Phone</div>
                <div style={{
                  fontSize: '16px',
                  color: '#1a3a5c',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2edf7'
                }}>{result.phone || 'Not found'}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '13px',
                  color: '#6b8ba4',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}>Skills</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  padding: '4px 0'
                }}>
                  {result.skills && result.skills.length > 0 ? (
                    result.skills.map((skill, index) => (
                      <span key={index} style={{
                        padding: '4px 14px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#8aa9c4', fontSize: '14px' }}>None found</span>
                  )}
                </div>
              </div>

              {/* AI Summary */}
              {result.summary && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px 18px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#1d4ed8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>🤖</span> AI Summary
                  </div>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: '1.7',
                    color: '#1a3a5c',
                    margin: 0
                  }}>
                    {result.summary}
                  </p>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b8ba4',
                    marginTop: '8px',
                    textAlign: 'right',
                    fontStyle: 'italic'
                  }}>
                    ✨ Powered by OpenRouter
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}