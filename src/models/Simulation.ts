import pako from 'pako';

// ------------------------------
// 1. Базовые типы
// ------------------------------
export type MicroEvent = string; // например, 'A', 'B', 'C'
export type History = MicroEvent[];

export interface Pattern {
  id: string;
  agents: string[];       // подмножество V
  causalLinks?: number[][];
}

export interface Measure {
  // простая дискретная мера: история -> вес (не нормирован)
  weights: Map<string, number>;
}

// Глобальное множество субагентов V (для демо)
export const V = ['α', 'β', 'γ', 'δ', 'ε'];

// ------------------------------
// 2. Алгоритмическая несжимаемость κ(H)
// ------------------------------
export function kolmogorovComplexity(history: History): number {
  const json = JSON.stringify(history);
  const compressed = pako.deflate(json);
  return compressed.length; // число байт после сжатия
}

export const S_MAX = 1000; // максимальная энтропия для нормировки (демо)

export function kappa(history: History): number {
  const k = kolmogorovComplexity(history);
  return Math.min(1, k / S_MAX);
}

// ------------------------------
// 3. Интегрированная причинная сложность Φ*(R)
//    (упрощённая версия: чем больше связей внутри паттерна, тем выше)
// ------------------------------
export function integratedInformation(pattern: Pattern): number {
  // Демо: Φ = количество связей / (размер паттерна * (размер-1))
  const n = pattern.agents.length;
  if (n < 2) return 0;
  const links = pattern.causalLinks?.flat().filter(x => x > 0).length ?? 0;
  const maxLinks = n * (n - 1);
  return links / maxLinks;
}

export const PHI_MIN = 0.3; // порог значимости

// ------------------------------
// 4. Целевая функция F(H)
// ------------------------------
export function activePatterns(history: History): Pattern[] {
  // Демо: из истории извлекаем уникальные пары агентов как "паттерны"
  const agentsSeen = new Set<string>();
  for (const ev of history) {
    if (V.includes(ev)) agentsSeen.add(ev);
  }
  const agentsList = Array.from(agentsSeen);
  const patterns: Pattern[] = [];
  for (let i = 0; i < agentsList.length; i++) {
    for (let j = i+1; j < agentsList.length; j++) {
      patterns.push({
        id: `${agentsList[i]}-${agentsList[j]}`,
        agents: [agentsList[i], agentsList[j]],
        causalLinks: [[0,1],[1,0]]
      });
    }
  }
  return patterns;
}

export function valueFunction(history: History): number {
  const k = kappa(history);
  const patterns = activePatterns(history);
  if (patterns.length === 0) return 0;
  const avgPhi = patterns.reduce((sum, p) => sum + integratedInformation(p), 0) / patterns.length;
  return k * avgPhi;
}

// ------------------------------
// 5. Дивергенция Дженсена‑Шеннона (геодезический штраф)
// ------------------------------
function klDivergence(p: number[], q: number[]): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0 && q[i] > 0) sum += p[i] * Math.log(p[i] / q[i]);
  }
  return sum;
}

export function jsDivergence(p: number[], q: number[]): number {
  const m = p.map((_, i) => (p[i] + q[i]) / 2);
  return 0.5 * klDivergence(p, m) + 0.5 * klDivergence(q, m);
}

// Топология предпочтений как распределение по микро-событиям
export function preferenceTopology(history: History): number[] {
  const counts = new Array(V.length).fill(0);
  for (const ev of history) {
    const idx = V.indexOf(ev);
    if (idx !== -1) counts[idx]++;
  }
  const total = counts.reduce((a,b) => a+b, 0);
  if (total === 0) return new Array(V.length).fill(1/V.length);
  return counts.map(c => c / total);
}

// ------------------------------
// 6. Вариационный функционал (цель)
// ------------------------------
export function totalFunctional(
  mu: Measure,
  alpha: number,
  tau: number,
  beta: number,
  currentTopology: number[]
): number {
  let expectationF = 0;
  let expectationPref = 0;
  let expectationGeo = 0;
  let totalWeight = 0;

  for (const [histJson, weight] of mu.weights.entries()) {
    const history = JSON.parse(histJson) as History;
    const f = valueFunction(history);
    const prefTop = preferenceTopology(history);
    const geo = jsDivergence(currentTopology, prefTop);
    expectationF += weight * f;
    expectationPref += weight * (prefTop.reduce((a,b)=>a+b,0) / prefTop.length);
    expectationGeo += weight * geo;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  expectationF /= totalWeight;
  expectationPref /= totalWeight;
  expectationGeo /= totalWeight;

  // KL-дивергенция меры mu относительно базовой борновской (здесь равномерная)
  let kl = 0;
  const totalW = totalWeight;
  for (const w of mu.weights.values()) {
    const p = w / totalW;
    const q = 1 / mu.weights.size; // равномерная база
    if (p > 0) kl += p * Math.log(p / q);
  }

  return expectationF + alpha * expectationPref - tau * kl + beta * expectationGeo;
}

// ------------------------------
// 7. Простой шаг градиентного подъёма (демо)
// ------------------------------
export function gradientStep(mu: Measure, alpha: number, _tau: number, beta: number, currentTopology: number[], stepSize = 0.1): Measure {
  const newWeights = new Map<string, number>();
  for (const [histJson, weight] of mu.weights.entries()) {
    const history = JSON.parse(histJson) as History;
    const f = valueFunction(history);
    const prefTop = preferenceTopology(history);
    const geo = jsDivergence(currentTopology, prefTop);
    const gradient = f + alpha * (prefTop.reduce((a,b)=>a+b,0)/prefTop.length) + beta * geo;
    // добавляем регуляризацию, чтобы не улетать
    const newWeight = weight * Math.exp(stepSize * gradient);
    newWeights.set(histJson, newWeight);
  }
  return { weights: newWeights };
}

// Вспомогательная: создать начальную меру из нескольких историй
export function createInitialMeasure(histories: History[]): Measure {
  const weights = new Map<string, number>();
  for (const h of histories) {
    weights.set(JSON.stringify(h), 1);
  }
  return { weights };
}

// Генерация случайной истории (длина от 3 до 8 событий)
export function randomHistory(): History {
  const length = 3 + Math.floor(Math.random() * 6);
  const hist: History = [];
  for (let i = 0; i < length; i++) {
    const randomAgent = V[Math.floor(Math.random() * V.length)];
    hist.push(randomAgent);
  }
  return hist;
}

// Добавить новую историю в меру с начальным весом 0.1
export function addHistoryToMeasure(measure: Measure, history: History, initialWeight = 0.1): Measure {
  const newWeights = new Map(measure.weights);
  const key = JSON.stringify(history);
  if (!newWeights.has(key)) {
    newWeights.set(key, initialWeight);
  } else {
    newWeights.set(key, newWeights.get(key)! + initialWeight);
  }
  return { weights: newWeights };
}

// Состояние для сохранения
export interface SavedState {
  measureWeights: [string, number][];
  alpha: number;
  tau: number;
  beta: number;
  atmosphere: string;
  version: number;
}

export function saveState(measure: Measure, alpha: number, tau: number, beta: number, atmosphere: string): SavedState {
  return {
    measureWeights: Array.from(measure.weights.entries()),
    alpha,
    tau,
    beta,
    atmosphere,
    version: 1,
  };
}

export function loadState(saved: SavedState): { measure: Measure; alpha: number; tau: number; beta: number; atmosphere: string } {
  return {
    measure: { weights: new Map(saved.measureWeights) },
    alpha: saved.alpha,
    tau: saved.tau,
    beta: saved.beta,
    atmosphere: saved.atmosphere,
  };
}
