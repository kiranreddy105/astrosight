import React, { useState, useEffect } from 'react';
import {
  Cpu,
  BarChart2,
  TrendingUp,
  Layers,
  CheckCircle2,
  Activity,
  Zap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ModelPerformanceData } from '../../types';
import { api } from '../../services/api';

export const ModelPerformance: React.FC = () => {
  const [data, setData] = useState<ModelPerformanceData | null>(null);
  const [activeChart, setActiveChart] = useState<'accuracy' | 'loss'>('accuracy');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getModelPerformance()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 font-mono text-xs">
        <Activity className="w-8 h-8 text-nasa-cyan animate-spin mx-auto" />
        <p className="text-slate-300">Retrieving Neural Network Telemetry & Model Weights...</p>
      </div>
    );
  }

  const { metrics, confusion_matrix, training_history } = data.performance;
  const { model_info } = data;

  // Compute SVG coordinates for interactive charts
  const history = training_history || [];
  const svgW = 600;
  const svgH = 260;
  const padL = 45;
  const padR = 20;
  const padT = 25;
  const padB = 35;

  const nEpochs = history.length;
  const xStep = (svgW - padL - padR) / (nEpochs - 1);

  // Accuracy coordinates (range 65% to 100%)
  const accMin = 65;
  const accMax = 100;
  const getYAcc = (val: number) =>
    padT + (svgH - padT - padB) * (1 - (val - accMin) / (accMax - accMin));

  const trainAccPath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${getYAcc(h.train_accuracy)}`)
    .join(' ');

  const valAccPath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${getYAcc(h.val_accuracy)}`)
    .join(' ');

  // Loss coordinates (range 0.05 to 0.70)
  const lossMin = 0.05;
  const lossMax = 0.70;
  const getYLoss = (val: number) =>
    padT + (svgH - padT - padB) * (1 - (val - lossMin) / (lossMax - lossMin));

  const trainLossPath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${getYLoss(h.train_loss)}`)
    .join(' ');

  const valLossPath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${getYLoss(h.val_loss)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>NEURAL NETWORK ARCHITECTURE & BENCHMARKS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              {model_info.model_name}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical validation benchmarks, training loss convergence curves, and confusion matrix classification metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-nasa-emerald flex items-center gap-1.5 px-3 py-1 rounded bg-nasa-emerald/10 border border-nasa-emerald/30">
            <ShieldCheck className="w-4 h-4" />
            <span>OPERATIONAL STATUS: ACTIVE</span>
          </span>
        </div>
      </div>

      {/* KPI Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Overall Accuracy', val: `${metrics.accuracy}%`, color: 'text-nasa-cyan', sub: 'Balanced Test Set' },
          { label: 'Precision', val: `${metrics.precision}%`, color: 'text-blue-400', sub: 'Low False Positives' },
          { label: 'Recall (Sensitivity)', val: `${metrics.recall}%`, color: 'text-nasa-emerald', sub: 'High Crater Recovery' },
          { label: 'F1 Score', val: `${metrics.f1_score}%`, color: 'text-indigo-400', sub: 'Harmonic Mean' },
          { label: 'Val Loss (Cross-Entropy)', val: `${metrics.val_loss}`, color: 'text-nasa-amber', sub: 'Optimal Convergence' },
          { label: 'AUC-ROC', val: `${metrics.auc_roc}`, color: 'text-emerald-400', sub: 'Area Under Curve' },
        ].map((m, idx) => (
          <div key={idx} className="glass-panel p-4 rounded-xl border border-space-700/80 flex flex-col justify-between">
            <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-tight block">
              {m.label}
            </span>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${m.color} tracking-tight`}>
                {m.val}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Row: Training Curves Chart on Left, Confusion Matrix on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Convergence Curves (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-space-700/60 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-nasa-cyan" />
                <span>Training & Validation History (25 Epochs)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stochastic gradient descent with AdamW optimizer and CosineAnnealing learning rate.
              </p>
            </div>

            {/* Toggle Acc vs Loss */}
            <div className="flex items-center gap-1 bg-space-850 p-1 rounded-lg border border-space-700">
              <button
                onClick={() => setActiveChart('accuracy')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  activeChart === 'accuracy'
                    ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Accuracy
              </button>
              <button
                onClick={() => setActiveChart('loss')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  activeChart === 'loss'
                    ? 'bg-nasa-amber/20 text-nasa-amber border border-nasa-amber/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Loss
              </button>
            </div>
          </div>

          {/* SVG Vector Chart */}
          <div className="relative bg-space-950/80 rounded-xl p-3 border border-space-800">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const yPos = padT + (svgH - padT - padB) * frac;
                const labelVal =
                  activeChart === 'accuracy'
                    ? `${Math.round(accMax - frac * (accMax - accMin))}%`
                    : `${(lossMax - frac * (lossMax - lossMin)).toFixed(2)}`;
                return (
                  <g key={idx}>
                    <line
                      x1={padL}
                      y1={yPos}
                      x2={svgW - padR}
                      y2={yPos}
                      stroke="rgba(0, 240, 255, 0.1)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padL - 8}
                      y={yPos + 4}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Epoch ticks */}
              {[1, 5, 10, 15, 20, 25].map((ep) => {
                const xPos = padL + (ep - 1) * xStep;
                return (
                  <text
                    key={ep}
                    x={xPos}
                    y={svgH - 12}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Ep {ep}
                  </text>
                );
              })}

              {/* Paths */}
              {activeChart === 'accuracy' ? (
                <>
                  <path
                    d={trainAccPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={valAccPath}
                    fill="none"
                    stroke="#00e676"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 3"
                  />
                </>
              ) : (
                <>
                  <path
                    d={trainLossPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={valLossPath}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 3"
                  />
                </>
              )}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-3 text-xs font-mono text-slate-400">
              {activeChart === 'accuracy' ? (
                <>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-sky-400" /> Training Accuracy (98.3%)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-emerald-400 border-dashed" /> Validation Accuracy (96.5%)
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-amber-400" /> Training Loss (0.072)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-red-400 border-dashed" /> Validation Loss (0.118)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Confusion Matrix & Model Specifications (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Confusion Matrix (Section 12) */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono text-white flex items-center justify-between border-b border-space-700/60 pb-2">
              <span>CONFUSION MATRIX (2,000 TEST PATCHES)</span>
              <span className="text-nasa-cyan text-[10px]">TEST BENCHMARK</span>
            </h3>

            {/* 2x2 Matrix Grid */}
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
                <div />
                <div className="font-semibold text-slate-300">PREDICTED CRATER</div>
                <div className="font-semibold text-slate-300">PREDICTED REGOLITH</div>
              </div>

              {/* Actual Crater Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-center font-semibold text-[10px] text-slate-300 p-2">
                  ACTUAL CRATER
                </div>
                <div className="p-3 rounded-lg bg-nasa-emerald/15 border border-nasa-emerald/40 text-center">
                  <span className="text-nasa-emerald font-bold text-base block">
                    {confusion_matrix.true_positive}
                  </span>
                  <span className="text-[10px] text-slate-400">True Positive (97.1%)</span>
                </div>
                <div className="p-3 rounded-lg bg-nasa-red/10 border border-nasa-red/30 text-center">
                  <span className="text-nasa-red font-bold text-base block">
                    {confusion_matrix.false_negative}
                  </span>
                  <span className="text-[10px] text-slate-400">False Negative (2.9%)</span>
                </div>
              </div>

              {/* Actual Non-Crater Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-center font-semibold text-[10px] text-slate-300 p-2">
                  ACTUAL REGOLITH
                </div>
                <div className="p-3 rounded-lg bg-nasa-amber/10 border border-nasa-amber/30 text-center">
                  <span className="text-nasa-amber font-bold text-base block">
                    {confusion_matrix.false_positive}
                  </span>
                  <span className="text-[10px] text-slate-400">False Positive (4.2%)</span>
                </div>
                <div className="p-3 rounded-lg bg-nasa-emerald/15 border border-nasa-emerald/40 text-center">
                  <span className="text-nasa-emerald font-bold text-base block">
                    {confusion_matrix.true_negative}
                  </span>
                  <span className="text-[10px] text-slate-400">True Negative (95.8%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Specification Details */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 font-mono text-xs">
            <h3 className="font-bold text-white border-b border-space-700/60 pb-2 flex items-center justify-between">
              <span>CRATERNET-V2 SPECIFICATIONS</span>
              <span className="text-nasa-cyan text-[10px]">PYTORCH CORE</span>
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-space-800">
                <span className="text-slate-400">Architecture:</span>
                <span className="text-white font-semibold">4-Stage Deep Conv2D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-800">
                <span className="text-slate-400">Parameters:</span>
                <span className="text-white">{model_info.total_parameters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-800">
                <span className="text-slate-400">Input Dimensions:</span>
                <span className="text-white">{model_info.input_resolution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-800">
                <span className="text-slate-400">Device Target:</span>
                <span className="text-nasa-cyan">{model_info.device.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Operating Mode:</span>
                <span className="text-nasa-emerald">{model_info.operational_mode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
