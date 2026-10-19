"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

type StageStat = {
  stage: string;
  count: number;
};

export default function HiringChart({
  stageStats,
}: {
  stageStats: StageStat[];
}) {
  const data = {
    labels: stageStats.map((item) => item.stage),

    datasets: [
      {
        label: "Candidates",
        data: stageStats.map((item) => item.count),
        backgroundColor: [
          "#6366f1",
          "#8b5cf6",
          "#0ea5e9",
          "#f59e0b",
          "#10b981",
          "#f43f5e",
        ],
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },

      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}