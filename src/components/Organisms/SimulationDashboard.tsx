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
  saveState,
  loadState,
  SavedState,
  V
} from '../../models/Simulation';
import { AgentGraph } from './AgentGraph';
import { Pattern } from '../../models/Simulation';
import { useAtmosphereSound } from '../../hooks/useAtmosphereSound';
import { TopologyHeatmap } from '../Atoms/TopologyHeatmap';
import { MeasureLandscape } from './MeasureLandscape';
import { useAtmosphere } from '../../hooks/useAtmosphere';

type Atmosphere = 'classic' | 'horror' | 'meditative' | 'pop-science';

export const SimulationDashboard: React.FC = () => {
  const demoHistories: History[] = [
    ['α', 'β', 'α', 'γ'],
    ['β', 'γ', 'δ', 'ε', 'α'],
    ['α', 'α', 'β', 'β', 'γ', 'γ'],
    ['δ', 'ε', 'ε', 'δ', 'α', 'β'],
  ];

  const { atmosphere, setAtmosphere } = useAtmosphere();

  // Состояния
  const [measure, setMeasure] = useState<Measure>(() => {
    // Попытка загрузить сохранённое состояние
    const saved = localStorage.getItem('ambient_state');
    if (saved) {
      try {
        const parsed: SavedState = JSON.parse(saved);
        const loaded = loadState(parsed);
        setAtmosphere(loaded.atmosphere as Atmosphere);
        return loaded.measure;
      } catch (e) { console.warn(e); }
    }
    return createInitialMeasure(demoHistories);
  });

  const [alpha, setAlpha] = useState<number>(() => {
    const saved = localStorage.getItem('ambient_state');
    if (saved) try { return JSON.parse(saved).alpha; } catch { /* ignore */ }
    return 0.5;
  });
  const [tau, setTau] = useState<number>(() => {
    const saved = localStorage.getItem('ambient_state');
    if (saved) try { return JSON.parse(saved).tau; } catch { /* ignore */ }
    return 0.2;
  });
  const [beta, setBeta] = useState<number>(() => {
    const saved = localStorage.getItem('ambient_state');
    if (saved) try { return JSON.parse(saved).beta; } catch { /* ignore */ }
    return 0.3;
  });

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

  // Сохранение состояния при изменении ключевых параметров
  useEffect(() => {
    const state = saveState(measure, alpha, tau, beta, atmosphere);
    localStorage.setItem('ambient_state', JSON.stringify(state));
  }, [measure, alpha, tau, beta, atmosphere]);

  // Функция шага градиента
  const performStep = () => {
    setMeasure(prevMeasure => {
      const newMeasure = gradientStep(prevMeasure, alpha, tau, beta, currentTopology, 0.2);
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

  // Авто-шаг
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

  const handleAddRandomHistory = () => {
    const newHistory = randomHistory();
    setMeasure(prev => addHistoryToMeasure(prev, newHistory, 0.2));
    playResonance(0.2);
  };

  const handleReset = () => {
    if (confirm('Сбросить всё к начальному состоянию?')) {
      setMeasure(createInitialMeasure(demoHistories));
      setAlpha(0.5);
      setTau(0.2);
      setBeta(0.3);
      setAtmosphere('classic');
      setCurrentTopology(preferenceTopology(demoHistories[0]));
    }
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
        <div className="col-span-2 flex flex-wrap gap-2">
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
          <button onClick={handleReset} className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded shadow text-sm ml-auto">
            🔄 Сброс
          </button>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-amber-700">Текущий функционал: <strong>{functionalValue.toFixed(4)}</strong></p>
          <p className="text-xs text-amber-500 mt-1">💾 Состояние автоматически сохраняется в браузере</p>
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
