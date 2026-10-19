const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Get the saved authentication token
function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

// Fetch dashboard statistics
export async function getDashboardStats() {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/dashboard/stats`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics");
  }

  return response.json();
}

// Fetch candidates
export async function getCandidates() {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/api/candidates`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch candidates");
  }

  return response.json();
}