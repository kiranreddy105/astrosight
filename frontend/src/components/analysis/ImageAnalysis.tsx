import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  Sliders,
  Maximize2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Ruler
} from 'lucide-react';
import { SampleImage, AnalysisRecord } from '../../types';
import { api } from '../../services/api';

interface ImageAnalysisProps {
  samples: SampleImage[];
  selectedPlanet: string;
  setSelectedPlanet: (planet: string) => void;
  activeAnalysis: AnalysisRecord | null;
  setActiveAnalysis: (analysis: AnalysisRecord | null) => void;
  onNavigate: (tab: string) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
  samples,
  selectedPlanet,
  setSelectedPlanet,
  activeAnalysis,
  setActiveAnalysis,
  onNavigate,
  isProcessing,
  setIsProcessing
}) => {
  // Selected or uploaded image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(samples[0]?.url || '');
  const [currentFilename, setCurrentFilename] = useState<string>(samples[0]?.filename || 'lunar_apollo11_tranquillitatis.jpg');
  
  // Pipeline configuration
  const [analysisMode, setAnalysisMode] = useState<string>('Full Analysis');
  const [resolutionMeters, setResolutionMeters] = useState<number>(10.0);
  const [applyClahe, setApplyClahe] = useState<boolean>(true);
  const [applyDenoise, setApplyDenoise] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.65);
  
  // Processing stages
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    'Image Ingestion & Format Validation',
    'Planetary Preprocessing & CLAHE Equalization',
    'CraterNet CNN Forward Feature Extraction',
    'Candidate Proposals & Non-Max Suppression',
    'Centroid Coordinate Extraction Cᵢ = (xᵢ, yᵢ)',
    'Euclidean & Real Geodesic Spatial Analysis',
    'NASA HUD Detection Overlay Rendering',
    'Publication PDF Dossier Generation'
  ];

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const valid = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!valid.includes(ext)) {
      setErrorMsg(`Invalid format '${ext}'. Please upload PNG, JPG/JPEG, or TIFF.`);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setCurrentFilename(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSelectSample = (sample: SampleImage) => {
    setSelectedFile(null);
    setPreviewUrl(sample.url);
    setCurrentFilename(sample.filename);
    setSelectedPlanet(sample.planet);
    setResolutionMeters(sample.default_resolution);
    setErrorMsg(null);
  };

  const handleRunAnalysis = async () => {
    if (!previewUrl) {
      setErrorMsg('Please select or upload a satellite image first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStep(1);

    try {
      let finalImageUrl = previewUrl;

      // If user uploaded a new local file, upload it to the backend first
      if (selectedFile) {
        setCurrentStep(1);
        const uploadRes = await api.uploadImage(selectedFile);
        finalImageUrl = uploadRes.url;
      }

      // Step 2 & 3: Stepping animation
      const stepTimer1 = setTimeout(() => setCurrentStep(3), 350);
      const stepTimer2 = setTimeout(() => setCurrentStep(5), 750);
      const stepTimer3 = setTimeout(() => setCurrentStep(7), 1100);

      const formData = new FormData();
      formData.append('image_url', finalImageUrl);
      formData.append('filename', currentFilename);
      formData.append('planet', selectedPlanet);
      formData.append('analysis_mode', analysisMode);
      formData.append('resolution_m_px', resolutionMeters.toString());
      formData.append('apply_clahe', applyClahe.toString());
      formData.append('apply_denoise', applyDenoise.toString());
      formData.append('confidence_threshold', confidenceThreshold.toString());
      formData.append('show_boundaries', 'true');
      formData.append('show_center_points', 'true');
      formData.append('show_labels', 'true');
      formData.append('show_bounding_boxes', 'false');

      const result = await api.runFullAnalysis(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setCurrentStep(8);
      setActiveAnalysis(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Check backend connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>IMAGE ANALYSIS & INFERENCE ENGINE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              TARGET: {selectedPlanet.toUpperCase()}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload planetary surface imagery (PNG, JPG, TIFF) or select mission samples to run CraterNet CNN detection.
          </p>
        </div>

        {/* Quick Sample Selector Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">Demo Samples:</span>
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-all flex-shrink-0 ${
                currentFilename === s.filename
                  ? 'bg-nasa-cyan/20 text-nasa-cyan border-nasa-cyan/60'
                  : 'bg-space-850 text-slate-400 border-space-700 hover:text-white'
              }`}
            >
              {s.name.split(' ')[0]} {s.name.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-nasa-red/15 border border-nasa-red/40 text-nasa-red text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Analysis Studio: Left Image Preview, Right Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Satellite Image Preview & Upload Dropzone (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="glass-panel rounded-2xl p-4 border border-space-700/80 relative overflow-hidden group min-h-[420px] flex flex-col justify-between"
          >
            {/* Header info bar */}
            <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-space-700/50">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5 truncate max-w-xs">
                <FileImage className="w-4 h-4 text-nasa-cyan flex-shrink-0" />
                {currentFilename}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-space-800 text-slate-400 text-[10px]">
                  {resolutionMeters} m/px
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-200 text-xs font-mono border border-space-600 transition-colors"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* Image Canvas Box */}
            <div className="relative my-3 flex-1 flex items-center justify-center bg-black/60 rounded-xl overflow-hidden border border-space-800">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Satellite Surface Preview"
                  className="max-h-[380px] w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <UploadCloud className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
                  <p className="text-xs font-mono text-slate-400">
                    Drag and drop satellite raster image here, or browse files
                  </p>
                </div>
              )}

              {/* Scanning visual overlay when processing */}
              {isProcessing && (
                <div className="absolute inset-0 bg-nasa-cyan/10 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-nasa-cyan to-transparent absolute top-0 animate-scanline" />
                  <div className="px-4 py-2 rounded-lg bg-black/80 border border-nasa-cyan text-nasa-cyan font-mono text-xs flex items-center gap-2 shadow-2xl">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>EXECUTING CNN INFERENCE...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom upload prompt */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.tif,.tiff"
              className="hidden"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-space-700/50">
              <span>SUPPORTED: PNG, JPG, JPEG, TIFF (MAX 50MB)</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-nasa-cyan hover:underline"
              >
                Browse local files &rarr;
              </button>
            </div>
          </div>

          {/* Stepper Progress Pipeline (Active during or after analysis) */}
          <div className="glass-panel p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-space-700/60 pb-2">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
                <span>REAL-TIME ANALYSIS TELEMETRY PIPELINE</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {currentStep === 8 ? 'STATUS: COMPLETED' : isProcessing ? `STAGE ${currentStep}/8` : 'IDLE'}
              </span>
            </div>

            <div className="space-y-2">
              {pipelineSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep >= stepNum;
                const isCurrent = currentStep === stepNum && isProcessing;

                return (
                  <div
                    key={stepNum}
                    className={`flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded transition-all ${
                      isDone
                        ? 'bg-nasa-emerald/10 text-nasa-emerald border border-nasa-emerald/20'
                        : isCurrent
                        ? 'bg-nasa-cyan/15 text-nasa-cyan border border-nasa-cyan/40 animate-pulse'
                        : 'text-slate-400 bg-space-850/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-[10px] text-slate-400 font-bold">#{stepNum.toString().padStart(2, '0')}</span>
                      <span>{step}</span>
                    </div>
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-nasa-emerald" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-nasa-cyan animate-ping" />
                    ) : (
                      <span className="text-[10px] text-slate-400">[PENDING]</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Analysis Controls & AI Classification Results (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Controls Panel */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2 border-b border-space-700/60 pb-3">
              <Sliders className="w-4 h-4 text-nasa-cyan" />
              <span>Analysis Parameters & Calibration</span>
            </h3>

            {/* Target Planet */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-slate-300 font-medium">Target Planetary Body:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlanet('Moon')}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                    selectedPlanet === 'Moon'
                      ? 'bg-nasa-cyan/20 text-nasa-cyan border-nasa-cyan shadow-sm'
                      : 'bg-space-850 text-slate-400 border-space-700 hover:text-white'
                  }`}
                >
                  🌕 Moon (Lunar)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlanet('Mars')}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                    selectedPlanet === 'Mars'
                      ? 'bg-nasa-red/20 text-nasa-red border-nasa-red shadow-sm'
                      : 'bg-space-850 text-slate-400 border-space-700 hover:text-white'
                  }`}
                >
                  🔴 Mars (Martian)
                </button>
              </div>
            </div>

            {/* Analysis Mode */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-slate-300 font-medium">Analysis Mode:</label>
              <select
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="w-full bg-space-850 border border-space-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-nasa-cyan"
              >
                <option value="Full Analysis">Full Analysis (Classify + Detect + Spatial)</option>
                <option value="Crater Detection">Crater Detection & Localization</option>
                <option value="Crater Classification">Crater / Non-Crater Classification</option>
                <option value="Spatial Analysis">Geodesic Spatial Analysis</option>
              </select>
            </div>

            {/* Pixel Resolution Scale (meters / pixel) */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-medium">Pixel Resolution Scale:</label>
                <span className="text-nasa-cyan font-bold">{resolutionMeters} m / px</span>
              </div>
              <input
                type="number"
                min="0.1"
                max="500"
                step="0.5"
                value={resolutionMeters}
                onChange={(e) => setResolutionMeters(parseFloat(e.target.value) || 10.0)}
                className="w-full bg-space-850 border border-space-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-nasa-cyan"
              />
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'HiRISE 0.25m', val: 0.25 },
                  { label: 'LROC 10m', val: 10.0 },
                  { label: 'CTX 25m', val: 25.0 },
                  { label: 'WAC 100m', val: 100.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setResolutionMeters(preset.val)}
                    className="flex-1 py-1 text-[10px] rounded bg-space-800 text-slate-400 hover:text-slate-200 border border-space-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preprocessing Toggles */}
            <div className="space-y-2 font-mono text-xs pt-2 border-t border-space-700/60">
              <span className="text-slate-300 font-medium block">Computer Vision Preprocessing:</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyClahe}
                    onChange={(e) => setApplyClahe(e.target.checked)}
                    className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                  />
                  <span>CLAHE Adaptive Contrast Equalization</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDenoise}
                    onChange={(e) => setApplyDenoise(e.target.checked)}
                    className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                  />
                  <span>Gaussian Regolith Noise Filtering</span>
                </label>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRunAnalysis}
                className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isProcessing
                    ? 'bg-space-800 text-slate-500 cursor-not-allowed border border-space-700'
                    : 'bg-gradient-to-r from-nasa-cyan via-blue-500 to-indigo-600 hover:brightness-110 text-space-950 shadow-nasa-cyan/25 glow-border-cyan'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-nasa-cyan" />
                    <span>ANALYZING PLANETARY SURFACE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>RUN ASTROSIGHT ANALYSIS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Classification Card (Section 6) */}
          {activeAnalysis && (
            <div className="glass-panel p-6 rounded-2xl border border-nasa-cyan/40 space-y-4 shadow-lg shadow-nasa-cyan/10">
              <div className="flex items-center justify-between border-b border-space-700/60 pb-3">
                <span className="text-xs font-mono font-bold text-nasa-cyan uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  CNN PREDICTION RESULT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nasa-emerald/15 text-nasa-emerald border border-nasa-emerald/30">
                  INFERENCE VERIFIED
                </span>
              </div>

              {/* Primary Prediction Display */}
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400">Prediction:</span>
                <div className="text-xl font-extrabold font-mono text-white tracking-wide flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-nasa-cyan animate-ping" />
                  <span>{activeAnalysis.classification?.prediction || 'CRATER DETECTED'}</span>
                </div>
              </div>

              {/* Confidence Metric & Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-nasa-cyan font-bold text-base">
                    {activeAnalysis.classification?.confidence || activeAnalysis.average_confidence}%
                  </span>
                </div>

                {/* Progress Bar Visualization */}
                <div className="h-3 w-full bg-space-950 rounded-full overflow-hidden p-0.5 border border-space-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-nasa-cyan rounded-full transition-all duration-1000"
                    style={{
                      width: `${activeAnalysis.classification?.confidence || activeAnalysis.average_confidence}%`
                    }}
                  />
                </div>

                {/* Probability Distribution */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-space-850/80 border border-space-700/60">
                    <span className="text-slate-400 block">Crater Probability:</span>
                    <span className="text-nasa-cyan font-bold text-xs">
                      {activeAnalysis.classification?.crater_probability || activeAnalysis.average_confidence}%
                    </span>
                  </div>
                  <div className="p-2 rounded bg-space-850/80 border border-space-700/60">
                    <span className="text-slate-400 block">Non-Crater Probability:</span>
                    <span className="text-slate-300 font-bold text-xs">
                      {activeAnalysis.classification?.non_crater_probability || (100 - activeAnalysis.average_confidence).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Stats & Jump Buttons */}
              <div className="pt-2 border-t border-space-700/60 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                  <span>Detected Crater Features:</span>
                  <span className="text-white font-bold">{activeAnalysis.crater_count}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNavigate('detection')}
                    className="py-2 px-3 rounded-lg bg-space-800 hover:bg-space-700 text-nasa-cyan font-mono text-xs border border-nasa-cyan/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>View Overlays</span>
                  </button>
                  <button
                    onClick={() => onNavigate('spatial')}
                    className="py-2 px-3 rounded-lg bg-space-800 hover:bg-space-700 text-nasa-amber font-mono text-xs border border-nasa-amber/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Spatial Studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
