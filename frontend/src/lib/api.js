import axios from 'axios';
import { auth } from '@/lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 300000, // 5 min for batch AI analysis
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor — attach Firebase ID token if user is signed in
api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Proceed without auth header (guest mode)
  }
  return config;
});

// Upload single resume and get analysis
export async function uploadResume(file, jobDescription = null, onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (jobDescription) {
    formData.append('job_description', jobDescription);
  }

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
  return response.data;
}

// Batch upload up to 25 resumes
export async function uploadBatchResumes(files, jobDescription = null, onProgress = null) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (jobDescription) {
    formData.append('job_description', jobDescription);
  }

  const response = await api.post('/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
  return response.data;
}

// Get analysis history
export async function getHistory() {
  const response = await api.get('/history');
  return response.data;
}

// Get single analysis
export async function getAnalysis(id) {
  const response = await api.get(`/history/${id}`);
  return response.data;
}

// Delete analysis
export async function deleteAnalysis(id) {
  const response = await api.delete(`/history/${id}`);
  return response.data;
}

// Export analysis report
export async function exportAnalysis(id, format = 'text') {
  const response = await api.get(`/export/${id}`, {
    params: { format },
    responseType: format === 'json' ? 'json' : 'text',
  });
  return response.data;
}

// Health check
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

// Enhance resume with AI
export async function enhanceResume(analysisId, mode, jobDescription = null) {
  const response = await api.post('/enhance', {
    analysis_id: analysisId,
    mode,
    job_description: jobDescription || null,
  });
  return response.data;
}

// Download enhanced resume as DOCX
export async function downloadEnhancedDocx(enhancementId, mode = 'professional', socialLinks = [], displayMode = 'compact') {
  const socialLinksJson = socialLinks && socialLinks.length > 0 ? JSON.stringify(socialLinks) : undefined;
  
  const response = await api.get(`/enhance/${enhancementId}/download/docx`, {
    responseType: 'blob',
    params: {
      social_links_json: socialLinksJson,
      display_mode: displayMode
    }
  });
  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `enhanced_resume_${mode}.docx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function generateInterviewAnswer(analysisId, question) {
  const response = await api.post(`/history/${analysisId}/interview-answer`, { question });
  return response.data;
}

export default api;
