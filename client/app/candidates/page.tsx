"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { getCandidates } from "@/lib/api";
import { useRouter } from "next/navigation";

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
  notes?: string;
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

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  // Controls the Add Candidate modal
  const [showModal, setShowModal] = useState(false);

  // Tracks form submission
  const [submitting, setSubmitting] = useState(false);

  // Displays success or error messages
  const [formMessage, setFormMessage] = useState("");
  // Controls the Edit Candidate modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Stores the candidate currently being edited
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null,
  );

  // Tracks the Edit form submission state
  const [editSubmitting, setEditSubmitting] = useState(false);

  const router = useRouter();

  // Fetch candidates from the backend
  async function loadCandidates() {
    try {
      setLoading(true);

      const response = await getCandidates();

      setCandidates(response.candidates);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load candidates",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  // Update a candidate's hiring stage
  async function updateStage(id: string, stage: string) {
    try {
      const response = await fetch(`${API_URL}/api/candidates/${id}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ stage }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hiring stage");
      }

      await loadCandidates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // Delete a candidate
  async function deleteCandidate(id: string) {
    if (!window.confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/candidates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete candidate");
      }

      await loadCandidates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // Create a new candidate
  async function handleAddCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormMessage("");

    const formData = new FormData(event.currentTarget);

    const candidateData = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      position: String(formData.get("position") || "").trim(),
      experience: Number(formData.get("experience") || 0),
      skills: String(formData.get("skills") || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      stage: String(formData.get("stage") || "Applied"),
      notes: String(formData.get("notes") || "").trim(),
    };

    // Validate required fields before sending the request
    if (!candidateData.name) {
      setFormMessage("Please enter the candidate's name.");
      return;
    }

    if (!candidateData.email) {
      setFormMessage("Please enter the candidate's email.");
      return;
    }

    // Validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(candidateData.email)) {
      setFormMessage("Please enter a valid email address.");
      return;
    }

    if (!candidateData.position) {
      setFormMessage("Please enter the position.");
      return;
    }

    // Validate experience
    const experienceInput = formData.get("experience");

    // Validate experience range and half-year increments
    if (
      experienceInput === null ||
      String(experienceInput).trim() === "" ||
      !Number.isFinite(candidateData.experience) ||
      candidateData.experience < 0 ||
      candidateData.experience > 60 ||
      candidateData.experience * 2 !== Math.round(candidateData.experience * 2)
    ) {
      setFormMessage(
        "Enter experience between 0 and 60 years in 0.5-year increments.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(candidateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add candidate");
      }

      // Refresh the table with the newly created candidate
      await loadCandidates();

      setFormMessage("Candidate added successfully!");

      // Close the modal after successful creation
      setShowModal(false);
    } catch (err) {
      setFormMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Open the Edit Candidate modal with existing candidate details
  function handleEditClick(candidate: Candidate) {
    setEditingCandidate(candidate);
    setFormMessage("");
    setShowEditModal(true);
  }

  // Save changes to an existing candidate
  async function handleUpdateCandidate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingCandidate) return;

    setFormMessage("");

    const formData = new FormData(event.currentTarget);

    const candidateData = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      position: String(formData.get("position") || "").trim(),
      experience: Number(formData.get("experience") || 0),
      skills: String(formData.get("skills") || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      stage: String(formData.get("stage") || "Applied"),
      notes: String(formData.get("notes") || "").trim(),
    };

    // Validate required fields before updating
    if (!candidateData.name) {
      setFormMessage("Please enter the candidate's name.");
      return;
    }

    if (!candidateData.email) {
      setFormMessage("Please enter the candidate's email.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(candidateData.email)) {
      setFormMessage("Please enter a valid email address.");
      return;
    }

    if (!candidateData.position) {
      setFormMessage("Please enter the position.");
      return;
    }

    // Validate experience range and increments
    const experienceInput = formData.get("experience");

    if (
      experienceInput === null ||
      String(experienceInput).trim() === "" ||
      !Number.isFinite(candidateData.experience) ||
      candidateData.experience < 0 ||
      candidateData.experience > 60 ||
      candidateData.experience * 2 !== Math.round(candidateData.experience * 2)
    ) {
      setFormMessage(
        "Enter experience between 0 and 60 years in 0.5-year increments.",
      );
      return;
    }

    setEditSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/candidates/${editingCandidate._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(candidateData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update candidate");
      }

      // Refresh the list with updated database information
      await loadCandidates();

      setShowEditModal(false);
      setEditingCandidate(null);
      setFormMessage("");
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the candidate",
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  // Apply search and stage filters
  const filteredCandidates = candidates.filter((candidate) => {
    const query = search.toLowerCase();

    const matchesSearch =
      candidate.name.toLowerCase().includes(query) ||
      candidate.email.toLowerCase().includes(query);

    const matchesStage =
      stageFilter === "All" || candidate.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64">
      <Sidebar />

      <main className="min-w-0 p-6 md:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Recruitment Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">Candidates</h1>

          <p className="mt-2 text-slate-500">
            Manage applicants and track their hiring progress.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Candidates</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage candidate profiles and hiring stages.
            </p>
          </div>

          <button
            onClick={() => {
              setFormMessage("");
              setShowModal(true);
            }}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Add Candidate
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All stages</option>

            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Total candidates:{" "}
            <span className="ml-2 font-bold text-slate-900">
              {candidates.length}
            </span>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-slate-600">
            Loading candidates...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Candidate</th>
                    <th className="px-6 py-4 font-medium">Position</th>
                    <th className="px-6 py-4 font-medium">Experience</th>
                    <th className="px-6 py-4 font-medium">Stage</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate) => (
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

                      <td className="px-6 py-4 text-slate-600">
                        {candidate.experience} years
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={candidate.stage}
                          onChange={(event) =>
                            updateStage(candidate._id, event.target.value)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          {stages.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(candidate)}
                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteCandidate(candidate._id)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/candidates/${candidate._id}`)
                            }
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No matching candidates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      {/* Add Candidate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Candidate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the candidates information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="candidate-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Full Name *
                  </label>

                  <input
                    id="candidate-name"
                    name="name"
                    required
                    maxLength={100}
                    placeholder="Rahul Kumar"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="candidate-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email *
                  </label>

                  <input
                    id="candidate-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="shivnandan@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="candidate-phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>

                  <input
                    id="candidate-phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="candidate-position"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Job Position *
                  </label>

                  <input
                    id="candidate-position"
                    name="position"
                    required
                    maxLength={100}
                    placeholder="Full Stack Developer"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="candidate-experience"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Experience (years)
                  </label>

                  <input
                    id="candidate-experience"
                    name="experience"
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    defaultValue="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="candidate-stage"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Hiring Stage
                  </label>

                  <select
                    id="candidate-stage"
                    name="stage"
                    defaultValue="Applied"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="candidate-skills"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Skills
                </label>

                <input
                  id="candidate-skills"
                  name="skills"
                  placeholder="React, Node.js, MongoDB"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Separate skills with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="candidate-notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Recruiter Notes
                </label>

                <textarea
                  id="candidate-notes"
                  name="notes"
                  rows={3}
                  maxLength={2000}
                  placeholder="Add relevant notes about this candidate..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {formMessage && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {formMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Candidate Modal */}
      {showEditModal && editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Candidate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the candidate's information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCandidate(null);
                  setFormMessage("");
                }}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close edit modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateCandidate} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name *
                  </label>

                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editingCandidate.name}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email *
                  </label>

                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    defaultValue={editingCandidate.email}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingCandidate.phone || ""}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job Position *
                  </label>

                  <input
                    name="position"
                    required
                    maxLength={100}
                    defaultValue={editingCandidate.position}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Experience (years)
                  </label>

                  <input
                    name="experience"
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    defaultValue={editingCandidate.experience}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Hiring Stage
                  </label>

                  <select
                    name="stage"
                    defaultValue={editingCandidate.stage}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skills
                </label>

                <input
                  name="skills"
                  defaultValue={editingCandidate.skills.join(", ")}
                  placeholder="React, Node.js, MongoDB"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Separate skills with commas.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recruiter Notes
                </label>

                <textarea
                  name="notes"
                  rows={3}
                  maxLength={2000}
                  defaultValue={editingCandidate.notes || ""}
                  placeholder="Add relevant notes about this candidate..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 opacity-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {formMessage && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {formMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={editSubmitting}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCandidate(null);
                    setFormMessage("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
