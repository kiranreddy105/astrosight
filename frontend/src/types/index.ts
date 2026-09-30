export interface Crater {
  id?: number;
  index: number;
  name?: string;
  x: number;
  y: number;
  radius: number;
  diameter_px?: number;
  confidence: number;
  cnn_prob?: number;
  morph_score?: number;
}

export interface SpatialMeasurement {
  id?: number;
  crater_a_index: number;
  crater_b_index: number;
  crater_a_name?: string;
  crater_b_name?: string;
  crater_a_x: number;
  crater_a_y: number;
  crater_b_x: number;
  crater_b_y: number;
  pixel_distance: number;
  real_distance_m: number;
  real_distance_km: number;
  real_distance_mi: number;
  formatted_km?: string;
  formatted_m?: string;
  bearing_deg?: number;
}

export interface SpatialDensity {
  crater_count: number;
  width_km: number;
  height_km: number;
  area_km2: number;
  density_per_km2: number;
  formatted_density: string;
}

export interface ClassificationResult {
  prediction: string;
  is_crater: boolean;
  confidence: number;
  crater_probability: number;
  non_crater_probability: number;
  raw_logits?: number[];
}

export interface AnalysisRecord {
  id: string;
  filename: string;
  planet: string;
  image_url: string;
  annotated_image_url?: string;
  report_url?: string;
  crater_count: number;
  average_confidence: number;
  resolution_m_px: number;
  processing_time_ms: number;
  analysis_mode: string;
  classification_result?: string;
  classification_confidence?: number;
  crater_density_per_km2?: number;
  centroid_x?: number;
  centroid_y?: number;
  created_at: string;
  craters?: Crater[];
  measurements?: SpatialMeasurement[];
  spatial_density?: SpatialDensity;
  centroid?: { x: number; y: number } | null;
  classification?: ClassificationResult;
}

export interface DashboardStats {
  images_analyzed: number;
  craters_detected: number;
  average_confidence: number;
  total_measurements: number;
  recent_analyses: Array<{
    id: string;
    filename: string;
    planet: string;
    crater_count: number;
    average_confidence: number;
    created_at: string;
  }>;
}

export interface ModelPerformanceData {
  model_info: {
    model_name: string;
    model_architecture: string;
    task: string;
    target_classes: string[];
    input_resolution: string;
    total_parameters: number;
    trainable_parameters: number;
    device: string;
    checkpoint_loaded: boolean;
    operational_mode: string;
  };
  performance: {
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      val_accuracy: number;
      val_loss: number;
      auc_roc: number;
    };
    confusion_matrix: {
      true_positive: number;
      false_negative: number;
      false_positive: number;
      true_negative: number;
    };
    training_history: Array<{
      epoch: number;
      train_accuracy: number;
      val_accuracy: number;
      train_loss: number;
      val_loss: number;
    }>;
    roc_curve: Array<{
      fpr: number;
      tpr: number;
    }>;
    dataset_info: {
      total_samples: number;
      train_samples: number;
      val_samples: number;
      test_samples: number;
      source: string;
    };
  };
}

export interface SampleImage {
  id: string;
  name: string;
  planet: string;
  mission: string;
  description: string;
  filename: string;
  url: string;
  default_resolution: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'scientist';
  planet_preference: 'Moon' | 'Mars';
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface AdminTelemetrySummary {
  total_researchers: number;
  total_admins: number;
  total_accounts: number;
  new_researchers_this_week: number;
  today_active_members: number;
  today_visitors_total: number;
  total_analyses_run: number;
  total_craters_detected: number;
}

export interface VisitorTrendPoint {
  date: string;
  iso_date: string;
  total_visits: number;
  unique_members: number;
  new_signups: number;
}

export interface ResearcherUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  planet_preference: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_active: string;
  analyses_count: number;
  failed_attempts: number;
}

export interface AuditEventRecord {
  id: number;
  action: string;
  email: string;
  ip_address: string;
  created_at: string;
}

export interface AdminTelemetryResponse {
  summary: AdminTelemetrySummary;
  visitor_trend: VisitorTrendPoint[];
  researchers: ResearcherUserRecord[];
  recent_activity: AuditEventRecord[];
}


