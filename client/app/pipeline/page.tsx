"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Candidate = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  experience: number;
  skills: string[];
  stage: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const stages = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

const stageStyles: Record<string, string> = {
  Applied: "border-t-blue-500",
  Screening: "border-t-violet-500",
  Interview: "border-t-amber-500",
  Offer: "border-t-cyan-500",
  Hired: "border-t-emerald-500",
  Rejected: "border-t-red-500",
};

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch candidates from the backend
  async function loadCandidates() {
    try {
      // FIX: Read the JWT token stored after login
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/candidates`, {
        cache: "no-store",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load candidates");
      }

      const result = await response.json();
      setCandidates(result.candidates);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load candidates",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  // Update a candidate's stage in MongoDB
  async function handleStageChange(id: string, stage: string) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/candidates/${id}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // FIX: Send JWT token to the protected API
          ...(localStorage.getItem("token")
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
        body: JSON.stringify({ stage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update hiring stage");
      }

      // Update the board with the latest database data
      await loadCandidates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update hiring stage",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64">
      <Sidebar />

      <main className="min-w-0 p-6 md:p-10">
        {/* Page heading */}
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Recruitment Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Hiring Pipeline
          </h1>

          <p className="mt-2 text-slate-500">
            Track candidates through every stage of recruitment.
          </p>
        </header>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stages.map((stage) => {
            const count = candidates.filter(
              (candidate) => candidate.stage === stage,
            ).length;

            return (
              <div
                key={stage}
                className={`rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm ${
                  stageStyles[stage]
                }`}
              >
                <p className="text-sm text-slate-500">{stage}</p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {count}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {count === 1 ? "Candidate" : "Candidates"}
                </p>
              </div>
            );
          })}
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading hiring pipeline...
          </div>
        ) : (
          /* Kanban board */
          <section className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter(
                (candidate) => candidate.stage === stage,
              );

              return (
                <div
                  key={stage}
                  className={`overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-slate-100 ${
                    stageStyles[stage]
                  }`}
                >
                  {/* Column heading */}
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
                    <h2 className="font-bold text-slate-800">{stage}</h2>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {stageCandidates.length}
                    </span>
                  </div>

                  {/* Candidate cards */}
                  <div className="min-h-40 space-y-3 p-3">
                    {stageCandidates.map((candidate) => (
                      <article
                        key={candidate._id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="break-words font-semibold text-slate-900">
                              {candidate.name}
                            </h3>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              {candidate.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-sm font-medium text-slate-700">
                            {candidate.position}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {candidate.experience} years of experience
                          </p>

                          {candidate.skills?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {candidate.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Move candidate to another stage */}
                        <div className="mt-4">
                          <label
                            htmlFor={`stage-${candidate._id}`}
                            className="mb-2 block text-xs font-medium text-slate-500"
                          >
                            Move to stage
                          </label>

                          <select
                            id={`stage-${candidate._id}`}
                            value={candidate.stage}
                            disabled={updatingId === candidate._id}
                            onChange={(event) =>
                              handleStageChange(
                                candidate._id,
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                          >
                            {stages.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>

                          {updatingId === candidate._id && (
                            <p className="mt-2 text-xs text-indigo-600">
                              Updating stage...
                            </p>
                          )}
                        </div>
                      </article>
                    ))}

                    {/* Empty column */}
                    {stageCandidates.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center">
                        <p className="text-sm text-slate-400">No candidates</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
