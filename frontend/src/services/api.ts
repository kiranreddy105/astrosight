import {
  DashboardStats,
  SampleImage,
  AnalysisRecord,
  ModelPerformanceData,
  UserProfile,
  AuthTokenResponse,
  AdminTelemetryResponse
} from '../types';

const API_V1 = '/api/v1';

let currentAuthToken: string | null = null;

export const api = {
  setAuthToken(token: string | null) {
    currentAuthToken = token;
  },

  getAuthToken(): string | null {
    return currentAuthToken;
  },

  getHeaders(includeJson: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (currentAuthToken) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    return headers;
  },

  // --- Auth APIs ---
  async login(credentials: { email: string; password: string }): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_V1}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data: AuthTokenResponse = await res.json();
    this.setAuthToken(data.access_token);
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    planet_preference?: string;
  }): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_V1}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data: AuthTokenResponse = await res.json();
    this.setAuthToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    await fetch(`${API_V1}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(false),
    }).catch(() => {});
    this.setAuthToken(null);
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_V1}/auth/me`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve user session');
    }
    return res.json();
  },

  async updateProfile(payload: { full_name?: string; planet_preference?: string }): Promise<UserProfile> {
    const res = await fetch(`${API_V1}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Update failed' }));
      throw new Error(err.detail || 'Profile update failed');
    }
    return res.json();
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<void> {
    const res = await fetch(`${API_V1}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Password change failed' }));
      throw new Error(err.detail || 'Password change failed');
    }
  },

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_V1}/auth/delete-account`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Account deletion failed' }));
      throw new Error(err.detail || 'Account deletion failed');
    }
    this.setAuthToken(null);
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_V1}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Reset request failed' }));
      throw new Error(err.detail || 'Reset request failed');
    }
    return res.json();
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_V1}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Password reset failed' }));
      throw new Error(err.detail || 'Password reset failed');
    }
    return res.json();
  },

  // --- Telemetry & System APIs ---
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_V1}/dashboard/stats`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
    return res.json();
  },

  async getSamples(): Promise<SampleImage[]> {
    const res = await fetch(`${API_V1}/samples`);
    if (!res.ok) throw new Error('Failed to fetch demo planetary samples');
    return res.json();
  },

  // --- File Upload & Analysis APIs ---
  async uploadImage(file: File): Promise<{ file_id: string; filename: string; url: string; width: number; height: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Auth headers without Content-Type so browser sets boundary multipart automatically
    const headers: Record<string, string> = {};
    if (currentAuthToken) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }

    const res = await fetch(`${API_V1}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Image upload failed. Ensure image is PNG/JPEG under 50MB.');
    }
    const data = await res.json();
    return {
      file_id: data.file_id,
      filename: data.filename,
      url: `${API_V1}/files/${data.file_id}`,
      width: data.width,
      height: data.height
    };
  },

  async runFullAnalysis(formData: FormData): Promise<AnalysisRecord> {
    const imageUrl = (formData.get('image_url') as string) || '';
    const filename = (formData.get('filename') as string) || 'image.jpg';
    const planet = (formData.get('planet') as string) || 'Moon';
    const analysisMode = (formData.get('analysis_mode') as string) || 'Full Analysis';
    const resolution = parseFloat((formData.get('resolution_m_px') as string) || '10.0');
    const applyClahe = formData.get('apply_clahe') === 'true';
    const applyDenoise = formData.get('apply_denoise') === 'true';
    const confidenceThreshold = parseFloat((formData.get('confidence_threshold') as string) || '0.60');

    // Extract file_id from image_url or use filename for sample
    let fileId = filename;
    if (imageUrl.includes('/files/')) {
      const parts = imageUrl.split('/files/');
      fileId = parts[parts.length - 1];
    } else if (filename.includes('apollo11')) {
      fileId = 'sample-lunar-apollo11';
    } else if (filename.includes('tycho')) {
      fileId = 'sample-lunar-tycho';
    } else if (filename.includes('jezero')) {
      fileId = 'sample-mars-jezero';
    } else if (filename.includes('gale')) {
      fileId = 'sample-mars-gale';
    }

    const res = await fetch(`${API_V1}/analyses`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        file_id: fileId,
        filename: filename,
        planet: planet,
        analysis_mode: analysisMode,
        resolution_m_px: resolution,
        apply_clahe: applyClahe,
        apply_denoise: applyDenoise,
        confidence_threshold: confidenceThreshold,
        show_boundaries: true,
        show_center_points: true,
        show_labels: true,
        show_bounding_boxes: false
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis execution failed' }));
      throw new Error(err.detail || 'Planetary analysis pipeline failed');
    }
    return res.json();
  },

  async calculateSpatial(
    pointA: { x: number; y: number },
    pointB: { x: number; y: number },
    resolution: number,
    unit: string
  ) {
    const res = await fetch(`${API_V1}/analyses/spatial/distance`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        point_a: pointA,
        point_b: pointB,
        resolution_m_px: resolution,
        unit: unit,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Spatial measurement calculation failed' }));
      throw new Error(err.detail || 'Spatial measurement failed');
    }
    return res.json();
  },

  async getHistory(search?: string, planet?: string): Promise<{ analyses: AnalysisRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (planet && planet !== 'all') params.append('planet', planet);
    params.append('size', '50');
    
    const res = await fetch(`${API_V1}/analyses?${params.toString()}`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch analysis history');
    const data = await res.json();
    return {
      analyses: data.items || [],
      total: data.total || 0
    };
  },

  async getAnalysisById(id: string): Promise<AnalysisRecord> {
    const res = await fetch(`${API_V1}/analyses/${id}`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Session not found' }));
      throw new Error(err.detail || 'Analysis session not found');
    }
    return res.json();
  },

  async deleteAnalysis(id: string): Promise<boolean> {
    const res = await fetch(`${API_V1}/analyses/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to delete analysis record');
    return true;
  },

  async getModelPerformance(): Promise<ModelPerformanceData> {
    const res = await fetch(`${API_V1}/model-performance`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async getDatasetStats() {
    const res = await fetch(`${API_V1}/datasets`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch dataset info');
    return res.json();
  },

  getReportDownloadUrl(id: string): string {
    return `${API_V1}/reports/${id}`;
  },

  getFileUrl(fileId: string): string {
    return `${API_V1}/files/${fileId}`;
  },

  // --- Commander Admin Telemetry APIs ---
  async getAdminTelemetry(): Promise<AdminTelemetryResponse> {
    const res = await fetch(`${API_V1}/admin/telemetry`, {
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch administrator telemetry' }));
      throw new Error(err.detail || 'Failed to fetch administrator telemetry');
    }
    return res.json();
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const res = await fetch(`${API_V1}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update user status' }));
      throw new Error(err.detail || 'Failed to update user status');
    }
    return res.json();
  }
};
