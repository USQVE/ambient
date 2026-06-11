import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface TopologyHeatmapProps {
  topology: number[];
  labels: string[];
}

export const TopologyHeatmap: React.FC<TopologyHeatmapProps> = ({ topology, labels }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Вес предпочтения',
        data: topology,
        backgroundColor: '#b45309',
        borderRadius: 8,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${(ctx.raw * 100).toFixed(1)}%` } },
    },
    scales: {
      y: { beginAtZero: true, max: 1, title: { display: true, text: 'вероятность', color: '#78350f' } },
      x: { ticks: { color: '#78350f' } },
    },
  };

  return (
    <div className="bg-amber-100/40 p-2 rounded-lg border border-amber-300">
      <p className="text-xs font-serif text-amber-800 mb-1">Топология предпочтений (μₛ)</p>
      <Bar data={data} options={options} height={120} />
    </div>
  );
};
