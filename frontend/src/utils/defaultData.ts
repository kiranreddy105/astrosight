import { SampleImage, AnalysisRecord } from '../types';

export const DEFAULT_SAMPLE_IMAGE: SampleImage = {
  id: 'sample-lunar-apollo11',
  name: 'Lunar Mare Tranquillitatis',
  planet: 'Moon',
  mission: 'Apollo 11 / LROC',
  description: 'High-albedo lunar basalt plain with prominent impact crater cluster.',
  filename: 'lunar_apollo11_tranquillitatis.jpg',
  url: '/static/samples/lunar_apollo11_tranquillitatis.jpg',
  default_resolution: 10.0
};

export const DEFAULT_BASELINE_ANALYSIS: AnalysisRecord = {
  id: 'demo-analysis-apollo11',
  filename: 'lunar_apollo11_tranquillitatis.jpg',
  planet: 'Moon',
  image_url: '/static/samples/lunar_apollo11_tranquillitatis.jpg',
  annotated_image_url: '/static/samples/lunar_apollo11_tranquillitatis.jpg',
  crater_count: 12,
  average_confidence: 94.7,
  resolution_m_px: 10.0,
  processing_time_ms: 2800,
  analysis_mode: 'Full Analysis',
  classification_result: 'CRATER',
  classification_confidence: 0.9682,
  crater_density_per_km2: 0.015,
  centroid_x: 512,
  centroid_y: 480,
  created_at: new Date().toISOString(),
  classification: {
    prediction: 'CRATER DETECTED',
    is_crater: true,
    confidence: 96.82,
    crater_probability: 96.82,
    non_crater_probability: 3.18
  },
  craters: [
    { index: 1, crater_index: 1, name: 'Crater #01', x: 428, y: 315, radius: 46.5, diameter_px: 93, confidence: 98.2 },
    { index: 2, crater_index: 2, name: 'Crater #02', x: 712, y: 534, radius: 58.2, diameter_px: 116.4, confidence: 94.7 },
    { index: 3, crater_index: 3, name: 'Crater #03', x: 260, y: 640, radius: 38.0, diameter_px: 76, confidence: 91.3 },
    { index: 4, crater_index: 4, name: 'Crater #04', x: 620, y: 220, radius: 34.5, diameter_px: 69, confidence: 89.6 },
    { index: 5, crater_index: 5, name: 'Crater #05', x: 840, y: 380, radius: 28.0, diameter_px: 56, confidence: 87.4 },
    { index: 6, crater_index: 6, name: 'Crater #06', x: 180, y: 410, radius: 25.5, diameter_px: 51, confidence: 86.1 },
    { index: 7, crater_index: 7, name: 'Crater #07', x: 510, y: 720, radius: 42.0, diameter_px: 84, confidence: 96.4 },
    { index: 8, crater_index: 8, name: 'Crater #08', x: 350, y: 190, radius: 31.0, diameter_px: 62, confidence: 84.8 },
    { index: 9, crater_index: 9, name: 'Crater #09', x: 760, y: 680, radius: 22.0, diameter_px: 44, confidence: 82.5 },
    { index: 10, crater_index: 10, name: 'Crater #10', x: 490, y: 490, radius: 19.5, diameter_px: 39, confidence: 81.0 },
    { index: 11, crater_index: 11, name: 'Crater #11', x: 310, y: 810, radius: 24.0, diameter_px: 48, confidence: 79.4 },
    { index: 12, crater_index: 12, name: 'Crater #12', x: 680, y: 350, radius: 18.0, diameter_px: 36, confidence: 76.5 }
  ],
  measurements: [
    {
      crater_a_index: 1,
      crater_b_index: 2,
      crater_a_name: 'Crater #01',
      crater_b_name: 'Crater #02',
      crater_a_x: 428,
      crater_a_y: 315,
      crater_b_x: 712,
      crater_b_y: 534,
      pixel_distance: 357.08,
      real_distance_m: 3570.8,
      real_distance_km: 3.57,
      real_distance_mi: 2.22,
      formatted_km: '3.57 km',
      formatted_m: '3,571 m',
      bearing_deg: 52
    }
  ],
  spatial_density: {
    crater_count: 12,
    width_km: 10.24,
    height_km: 10.24,
    area_km2: 104.85,
    density_per_km2: 0.114,
    formatted_density: '0.114 craters / km²'
  }
};
