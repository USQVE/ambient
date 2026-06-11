import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Measure,
  valueFunction,
  kappa,
  integratedInformation,
  activePatterns,
  preferenceTopology,
  totalFunctional,
  gradientStep,
  createInitialMeasure,
  randomHistory,
  addHistoryToMeasure,
  V
} from '../../models/Simulation';
import { AgentGraph } from './AgentGraph';
import { Pattern } from '../../models/Simulation';
import { useAtmosphereSound } from '../../hooks/useAtmosphereSound';
import { TopologyHeatmap } from '../Atoms/TopologyHeatmap';
import { MeasureLandscape } from './MeasureLandscape';

export const SimulationDashboard: React.FC = () => {
  const demoHistories: History[] = [
    ['α', 'β', 'α', 'γ'],
    ['β', 'γ', 'δ', 'ε', 'α'],
    ['α', 'α', 'β', 'β', 'γ', 'γ'],
    ['δ', 'ε', 'ε', 'δ', 'α', 'β'],
  ];
  const [measure, setMeasure] = useState<Measure>(() => createInitialMeasure(demoHistories));
  const [alpha, setAlpha] = useState(0.5);
  const [tau, setTau] = useState(0.2);
  const [beta, setBeta] = useState(0.3);
  const [currentTopology, setCurrentTopology] = useState<number[]>(() => preferenceTopology(demoHistories[0]));
  const [functionalValue, setFunctionalValue] = useState(0);
  const [autoStep, setAutoStep] = useState(false);
  const [stepInterval, setStepInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const { playResonance } = useAtmosphereSound();
  const prevFunctionalRef = useRef(functionalValue);

  // Подсчёт функционала
  useEffect(() => {
    const val = totalFunctional(measure, alpha, tau, beta, currentTopology);
    setFunctionalValue(val);
  }, [measure, alpha, tau, beta, currentTopology]);

  // Резонанс при росте функционала
  useEffect(() => {
    if (functionalValue > prevFunctionalRef.current && functionalValue - prevFunctionalRef.current > 0.01) {
      const intensity = Math.min(1, (functionalValue - prevFunctionalRef.current) * 2);
      playResonance(intensity);
    }
    prevFunctionalRef.current = functionalValue;
  }, [functionalValue, playResonance]);

  // Функция шага градиента
  const performStep = () => {
    setMeasure(prevMeasure => {
      const newMeasure = gradientStep(prevMeasure, alpha, tau, beta, currentTopology, 0.2);
      // Обновляем топологию
      let totalWeight = 0;
      const sumTop = new Array(V.length).fill(0);
      for (const [histJson, w] of newMeasure.weights.entries()) {
        const hist = JSON.parse(histJson) as History;
        const top = preferenceTopology(hist);
        for (let i=0; i<V.length; i++) sumTop[i] += w * top[i];
        totalWeight += w;
      }
      if (totalWeight > 0) {
        const newTop = sumTop.map(s => s / totalWeight);
        setCurrentTopology(newTop);
      }
      return newMeasure;
    });
  };

  // Авто-шаг: управление интервалом
  useEffect(() => {
    if (autoStep) {
      const interval = setInterval(() => {
        performStep();
      }, 500);
      setStepInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (stepInterval) clearInterval(stepInterval);
      setStepInterval(null);
    }
  }, [autoStep, alpha, tau, beta, currentTopology]);

  // Добавление случайной истории
  const handleAddRandomHistory = () => {
    const newHistory = randomHistory();
    setMeasure(prev => addHistoryToMeasure(prev, newHistory, 0.2));
    // Небольшой звуковой щелчок через Web Audio (опционально)
    playResonance(0.2);
  };

  // Получение лучшей истории
  let bestHistory: History | null = null;
  let bestWeight = -1;
  for (const [histJson, w] of measure.weights.entries()) {
    if (w > bestWeight) {
      bestWeight = w;
      bestHistory = JSON.parse(histJson);
    }
  }
  const patterns = bestHistory ? activePatterns(bestHistory) : [];

  const handlePatternClick = (pattern: Pattern) => {
    alert(`Паттерн ${pattern.agents.join(',')}\nΦ* = ${integratedInformation(pattern).toFixed(3)}`);
  };

  return (
    <div className="bg-amber-50/80 rounded-lg p-4 border border-amber-400 shadow-inner font-serif">
      <h3 className="text-xl font-bold text-amber-900 border-b border-amber-600 mb-3">⚙️ Вариационный движок «Амбиент»</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-amber-800">α (предпочтения)</label>
          <input type="range" min="0" max="2" step="0.05" value={alpha} onChange={e=>setAlpha(+e.target.value)} className="w-full" />
          <span className="text-amber-900">{alpha.toFixed(2)}</span>
        </div>
        <div>
          <label className="block text-amber-800">τ (KL‑штраф)</label>
          <input type="range" min="0" max="2" step="0.05" value={tau} onChange={e=>setTau(+e.target.value)} className="w-full" />
          <span className="text-amber-900">{tau.toFixed(2)}</span>
        </div>
        <div>
          <label className="block text-amber-800">β (геодезия)</label>
          <input type="range" min="0" max="2" step="0.05" value={beta} onChange={e=>setBeta(+e.target.value)} className="w-full" />
          <span className="text-amber-900">{beta.toFixed(2)}</span>
        </div>
        <div className="col-span-2 flex gap-2">
          <button onClick={performStep} className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 rounded shadow text-sm">
            ▶️ Шаг
          </button>
          <button onClick={handleAddRandomHistory} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded shadow text-sm">
            🎲 Случайная история
          </button>
          <label className="flex items-center gap-2 text-amber-800 text-sm">
            <input type="checkbox" checked={autoStep} onChange={e => setAutoStep(e.target.checked)} className="w-4 h-4" />
            🔄 Авто-шаг
          </label>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-amber-700">Текущий функционал: <strong>{functionalValue.toFixed(4)}</strong></p>
        </div>
      </div>

      <div className="mt-4">
        <TopologyHeatmap topology={currentTopology} labels={V} />
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-amber-900 mb-1">🌐 Граф субагентов и паттернов</h4>
        <AgentGraph patterns={patterns} onPatternClick={handlePatternClick} />
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-amber-900 mb-1">🏔️ Ландшафт меры μ (3D)</h4>
        <MeasureLandscape measure={measure} histories={Array.from(measure.weights.keys()).map(k => JSON.parse(k) as History)} />
        <p className="text-xs text-amber-600 mt-1">Ось X: κ(H), ось Z: ⟨Φ⟩, высота: вес истории</p>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-amber-900">Лучшая история (max вес)</h4>
        {bestHistory && (
          <div className="bg-amber-100 p-2 rounded mt-1 font-mono text-sm">
            {bestHistory.join(' → ')}
            <div className="text-xs text-amber-600 mt-1">
              κ = {kappa(bestHistory).toFixed(3)}, F = {valueFunction(bestHistory).toFixed(3)}
            </div>
          </div>
        )}
        <h4 className="font-semibold text-amber-900 mt-3">Активные паттерны (Φ*)</h4>
        {patterns.map(p => (
          <div key={p.id} className="text-xs text-amber-700">
            {p.agents.join(',')} → Φ = {integratedInformation(p).toFixed(3)}
          </div>
        ))}
      </div>
    </div>
  );
};
