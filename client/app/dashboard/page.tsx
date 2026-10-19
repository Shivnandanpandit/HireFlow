"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import HiringChart from "@/components/HiringChart";
import Link from "next/link";

import { getDashboardStats, getCandidates } from "@/lib/api";

type StageStat = {
  stage: string;
  count: number;
};

type Candidate = {
  _id: string;
  name: string;
  email: string;
  position: string;
  stage: string;
  createdAt: string;
};

type DashboardStats = {
  totalCandidates: number;
  activeCandidates: number;
  hiredCandidates: number;
  stageStats: StageStat[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsResponse, candidatesResponse] = await Promise.all([
          getDashboardStats(),
          getCandidates(),
        ]);

        setStats(statsResponse.stats);
        setCandidates(candidatesResponse.candidates.slice(0, 5));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const interviewCount =
    stats?.stageStats.find((item) => item.stage === "Interview")?.count ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64">
      <Sidebar />

      <main className="min-w-0 p-6 md:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Recruitment Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>

          <p className="mt-2 text-slate-500">
            Track your candidates and monitor hiring progress.
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        ) : stats ? (
          <>
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Candidates"
                value={stats.totalCandidates}
                description="All candidate records"
                icon="♙"
              />

              <StatCard
                title="Active Candidates"
                value={stats.activeCandidates}
                description="Currently in the hiring process"
                icon="◎"
              />

              <StatCard
                title="Interviews"
                value={interviewCount}
                description="Currently at interview stage"
                icon="▤"
              />

              <StatCard
                title="Hired"
                value={stats.hiredCandidates}
                description="Successfully hired candidates"
                icon="✓"
              />
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Hiring Pipeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Candidate distribution by current stage.
                  </p>
                </div>

                <HiringChart stageStats={stats.stageStats} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Pipeline Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Candidates in each stage.
                </p>

                <div className="mt-5 space-y-4">
                  {stats.stageStats.map((item) => (
                    <div
                      key={item.stage}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-slate-600">
                        {item.stage}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recent Candidates
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    The latest candidates added to HireFlow.
                  </p>
                </div>

                <Link
                  href="/candidates"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View all →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium">Position</th>
                      <th className="px-6 py-4 font-medium">Stage</th>
                      <th className="px-6 py-4 font-medium">Applied</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {candidates.map((candidate) => (
                      <tr key={candidate._id}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {candidate.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {candidate.email}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {candidate.position}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                            {candidate.stage}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          {new Date(candidate.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}

                    {candidates.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-slate-500"
                        >
                          No candidates yet. Add your first candidate to get
                          started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
