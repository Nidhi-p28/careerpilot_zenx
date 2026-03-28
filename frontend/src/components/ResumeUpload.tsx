"use client"
import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  userId: string;
}

export default function ResumeUpload({ userId }: Props) {
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('UPLOADING');
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Force the call to the IP we just set up
      const response = await axios({
        method: 'post',
        url: `http://127.0.0.1:8000/api/upload-resume?user_id=${userId}`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000 // If it doesn't connect in 5s, fail fast
      });

      console.log("SYNC_SUCCESS:", response.data);
      setStatus('SUCCESS');
    } catch (err: any) {
      console.error("DEBUG_LOG:", err.message);
      setStatus('ERROR');
      alert("BRIDGE_BLOCK: The browser is blocking the connection. Check if your Firewall allowed Python to access the network.");
    }
  };

  return (
    <div className="cp-upload-wrapper">
      <div className="cp-section-tag">OUTREACH_ASSETS</div>
      
      <label className={`cp-upload-label ${status}`}>
        <span className="cp-bit">
          {status === 'UPLOADING' ? '[...]' : '[+]'}
        </span>
        
        {status === 'IDLE' && " UPLOAD_RESUME_PDF_FOR_AUTO_APPLY"}
        {status === 'UPLOADING' && " SYNCING_TO_LOCAL_STORAGE..."}
        {status === 'SUCCESS' && " RESUME_SYNC_COMPLETE"}
        {status === 'ERROR' && " CONNECTION_INTERRUPTED_RETRY"}
        
        <input 
          type="file" 
          hidden 
          accept=".pdf" 
          onChange={handleFileChange} 
          disabled={status === 'UPLOADING'}
        />
      </label>

      <style jsx>{`
        .cp-upload-wrapper { 
          margin-bottom: 30px; 
          border: 1px solid #1a1a1a; 
          padding: 15px; 
          background: #080808; 
        }
        .cp-section-tag { 
          font-size: 8px; 
          color: #404040; 
          margin-bottom: 10px; 
          letter-spacing: 1px; 
        }
        .cp-upload-label {
          display: block;
          padding: 12px;
          border: 1px dashed #262626;
          color: #525252;
          font-family: monospace;
          font-size: 10px;
          cursor: pointer;
          transition: 0.2s;
        }
        .cp-bit { color: #f97316; margin-right: 8px; font-weight: bold; }
        .cp-upload-label:hover { 
          border-color: #f97316; 
          color: #fff; 
          background: rgba(249, 115, 22, 0.05); 
        }
        .cp-upload-label.SUCCESS { border-color: #22c55e; color: #22c55e; }
        .cp-upload-label.ERROR { border-color: #ef4444; color: #ef4444; }
        .cp-upload-label.UPLOADING { 
          animation: pulse 1s infinite; 
          border-color: #f97316; 
          cursor: wait;
        }
        @keyframes pulse { 
          0% { opacity: 1; } 
          50% { opacity: 0.5; } 
          100% { opacity: 1; } 
        }
      `}</style>
    </div>
  );
}
