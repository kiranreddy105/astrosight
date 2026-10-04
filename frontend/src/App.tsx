import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
  const [systemStatus, setSystemStatus] = useState<string>('ONLINE');

  // Load telemetry stats & bundled samples on mount or user change
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
    <div className="min-h-screen bg-space-950 text-slate-100 flex relative">
      {/* 3D Cosmic Starfield & Nebula Background */}
      <CosmicBackground />

      {/* Fixed NASA Mission Control Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        hasActiveAnalysis={activeAnalysis !== null}
      />

      {/* Main Content Area (offset by sidebar width 64 = 16rem) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Mission Control Header */}
        <Header
          selectedPlanet={selectedPlanet}
          setSelectedPlanet={setSelectedPlanet}
          analyzedCount={dashboardStats?.images_analyzed || 1284}
          isProcessing={isProcessing}
        />

        {/* Dynamic View Viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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

          {activeTab === 'performance' && <ModelPerformance />}

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

        {/* Scientific Disclaimer Footer */}
        <DisclaimerBanner />
      </div>

      {/* Authentication & Account Modals */}
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
