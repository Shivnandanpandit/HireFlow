"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Candidate = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  experience: number;
  skills: string[];
  stage: string;
  notes?: string;
  createdAt: string;
};

export default function CandidateDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError("");

        // FIX: Get the JWT token saved during login
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/api/candidates/${id}`, {
          cache: "no-store",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load candidate.");
        }

        setCandidate(data.candidate || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCandidate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 md:ml-64">
        <Sidebar />
        <main className="p-8">
          <p className="text-slate-600">Loading candidate details...</p>
        </main>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-slate-50 md:ml-64">
        <Sidebar />
        <main className="p-8">
          <button
            onClick={() => router.push("/candidates")}
            className="mb-6 text-sm font-semibold text-indigo-600"
          >
            ← Back to Candidates
          </button>

          <div className="rounded-xl border border-red-200 bg-white p-6">
            <h1 className="text-xl font-bold text-slate-900">
              Unable to load candidate
            </h1>
            <p className="mt-2 text-red-600">
              {error || "Candidate not found."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const details = [
    { label: "Email", value: candidate.email || "Not provided" },
    { label: "Phone", value: candidate.phone || "Not provided" },
    { label: "Position", value: candidate.position || "Not provided" },
    {
      label: "Experience",
      value: `${candidate.experience ?? 0} years`,
    },
    { label: "Current Stage", value: candidate.stage },
    {
      label: "Added On",
      value: candidate.createdAt
        ? new Date(candidate.createdAt).toLocaleDateString()
        : "Not available",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64">
      <Sidebar />

      <main className="min-w-0 p-5 md:p-8">
        <button
          onClick={() => router.push("/candidates")}
          className="mb-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Candidates
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                {candidate.name?.charAt(0).toUpperCase() || "C"}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                {candidate.name}
              </h1>

              <p className="mt-1 text-slate-500">Candidate profile</p>
            </div>

            <span className="w-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {candidate.stage}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{detail.label}</p>
                <p className="mt-2 break-words font-semibold text-slate-900">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Skills</h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.skills?.length ? (
                candidate.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-slate-500">No skills added.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">
              Recruiter Notes
            </h2>

            <div className="mt-3 rounded-xl border border-slate-200 p-4">
              <p className="whitespace-pre-wrap text-slate-700">
                {candidate.notes?.trim() || "No notes added."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
