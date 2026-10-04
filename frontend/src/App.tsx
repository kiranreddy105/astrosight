import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AboutModal } from './components/layout/AboutModal';
import { CosmicBackground } from './components/layout/CosmicBackground';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { Dashboard } from './components/dashboard/Dashboard';
import { ImageAnalysis } from './components/analysis/ImageAnalysis';
import { CraterDetection } from './components/detection/CraterDetection';
import { SpatialAnalysis } from './components/spatial/SpatialAnalysis';
import { PlanetaryMap } from './components/map/PlanetaryMap';
import { ModelPerformance } from './components/model/ModelPerformance';
import { Dataset } from './components/dataset/Dataset';
import { AnalysisHistory } from './components/history/AnalysisHistory';
import { ReportsView } from './components/reports/ReportsView';
import { AuthModal } from './components/auth/AuthModal';
import { AccountSettingsModal } from './components/auth/AccountSettingsModal';
import { AdminPersonnel } from './components/admin/AdminPersonnel';

import { api } from './services/api';
import { DashboardStats, SampleImage, AnalysisRecord } from './types';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPlanet, setSelectedPlanet] = useState<string>(user?.planet_preference || 'Moon');
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisRecord | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);

  // Load telemetry stats & bundled samples on mount
  useEffect(() => {
    api.getDashboardStats()
      .then((s) => setDashboardStats(s))
      .catch((e) => console.error('Dashboard stats fetch error:', e));

    api.getSamples()
      .then((res) => {
        setSamples(res);
      })
      .catch((e) => console.error('Samples fetch error:', e));
  }, [user?.id]);

  // Update stats whenever a new analysis finishes
  useEffect(() => {
    if (activeAnalysis) {
      api.getDashboardStats().then((s) => setDashboardStats(s)).catch(() => {});
    }
  }, [activeAnalysis?.id]);

  // Sync planet preference if user profile changes
  useEffect(() => {
    if (user?.planet_preference) {
      setSelectedPlanet(user.planet_preference);
    }
  }, [user?.planet_preference]);

  const handleLoadSample = (sample: SampleImage) => {
    setSelectedPlanet(sample.planet);
    setActiveTab('analysis');
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col relative selection:bg-nasa-cyan/30 selection:text-white">
      {/* 3D Cosmic Starfield & Nebula Canvas */}
      <CosmicBackground />

      {/* Floating Transparent Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPlanet={selectedPlanet}
        setSelectedPlanet={setSelectedPlanet}
        analyzedCount={dashboardStats?.images_analyzed || 1284}
        isProcessing={isProcessing}
        onOpenAbout={() => setAboutModalOpen(true)}
      />

      {/* Main Mission Control Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 z-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={dashboardStats}
            onNavigate={setActiveTab}
            onLoadSample={handleLoadSample}
            samples={samples}
            selectedPlanet={selectedPlanet}
          />
        )}

        {activeTab === 'analysis' && (
          <ImageAnalysis
            samples={samples}
            selectedPlanet={selectedPlanet}
            setSelectedPlanet={setSelectedPlanet}
            activeAnalysis={activeAnalysis}
            setActiveAnalysis={setActiveAnalysis}
            onNavigate={setActiveTab}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}

        {activeTab === 'detection' && (
          <CraterDetection
            activeAnalysis={activeAnalysis}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'spatial' && (
          <SpatialAnalysis
            activeAnalysis={activeAnalysis}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'map' && (
          <PlanetaryMap
            selectedPlanet={selectedPlanet}
            setSelectedPlanet={setSelectedPlanet}
            samples={samples}
            onSelectSampleForAnalysis={handleLoadSample}
          />
        )}

        {activeTab === 'model' && <ModelPerformance />}
        {activeTab === 'dataset' && <Dataset />}

        {activeTab === 'history' && (
          <AnalysisHistory
            onSelectAnalysis={setActiveAnalysis}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            activeAnalysis={activeAnalysis}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'personnel' && <AdminPersonnel />}
      </main>

      {/* Scientific Disclaimer & Information Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 my-4 z-10">
        <DisclaimerBanner />
      </div>

      {/* Minimal Scientific Application Footer with Watermark */}
      <Footer onNavigate={setActiveTab} />

      {/* Modals */}
      <AboutModal
        isOpen={aboutModalOpen || activeTab === 'about'}
        onClose={() => {
          setAboutModalOpen(false);
          if (activeTab === 'about') setActiveTab('dashboard');
        }}
      />
      <AuthModal />
      <AccountSettingsModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
