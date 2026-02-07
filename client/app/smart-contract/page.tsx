"use client";

import { useState } from "react";

type Match = {
  employeeId: number;
  name: string;
  similarity: number;
  salary: number;
  reasons: string[];
};

type Stats = {
  average: number;
  median: number;
  min: number;
  max: number;
};

type Recommendation = {
  minimum: number;
  target: number;
  maximum: number;
  reasoning: string[];
  confidence: number;
};

type Equity = {
  status: "PASS" | "WARNING" | "FAIL";
  compressionRisk: "none" | "low" | "medium" | "high";
  impactedEmployees: Array<{ name: string; issue: string }>;
  message: string;
};

type AnalysisResult = {
  candidate: {
    id: number;
    name: string;
    email: string;
    role: string;
    salary: number;
    country: string;
  };
  comparisons: {
    matches: Match[];
    stats: Stats;
  };
  recommendation: Recommendation;
  equity: Equity;
};

export default function SmartContractPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [email, setEmail] = useState("hazim@company.com");
  const [bandMin, setBandMin] = useState("");
  const [bandMax, setBandMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [offerLetter, setOfferLetter] = useState<string | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const parseNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  };

  const analyze = async () => {
    if (!email.trim()) {
      setError("Please enter an employee email");
      return;
    }

    const minValue = parseNumber(bandMin);
    const maxValue = parseNumber(bandMax);

    if (bandMin && minValue === undefined) {
      setError("Minimum salary must be a number");
      return;
    }
    if (bandMax && maxValue === undefined) {
      setError("Maximum salary must be a number");
      return;
    }
    if (
      minValue !== undefined &&
      maxValue !== undefined &&
      minValue > maxValue
    ) {
      setError("Minimum salary cannot exceed maximum salary");
      return;
    }

    setLoading(true);
    setError(null);
    setOfferLetter(null);
    setOfferError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/smart-contract/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          salaryBand:
            minValue !== undefined || maxValue !== undefined
              ? { min: minValue ?? 0, max: maxValue ?? Number.MAX_SAFE_INTEGER }
              : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || "Failed to analyze smart contract");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const generateOfferLetter = async () => {
    if (!result) {
      setOfferError("Run the smart analysis first");
      return;
    }

    setOfferLoading(true);
    setOfferError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/offer-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.candidate.email,
          salary: result.recommendation.target,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOfferLetter(data.offerLetter);
      } else {
        throw new Error(data.error || "Failed to generate offer letter");
      }
    } catch (err: any) {
      setOfferError(err.message || "Something went wrong");
      setOfferLetter(null);
    } finally {
      setOfferLoading(false);
    }
  };

  const openOfferLetter = () => {
    if (!offerLetter || typeof window === "undefined") return;
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(offerLetter);
      newWindow.document.close();
    }
  };

  const downloadOfferPdf = async () => {
    if (!offerLetter || !result) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/contract/render-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: offerLetter,
          filename: `offer-letter-${result.candidate.name.replace(/\s+/g, "-").toLowerCase()}`,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to render PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "offer-letter.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setOfferError(err.message || "Failed to download PDF");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Smart Contract</h1>
        <p className="text-gray-600">
          Multi-agent analysis for salary recommendations, equity checks, and
          benchmarking.
        </p>
      </div>

      <div className="card mb-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="e.g., hazim@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Band Min (optional)
            </label>
            <input
              type="number"
              value={bandMin}
              onChange={(e) => setBandMin(e.target.value)}
              className="input-field"
              placeholder="9000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Band Max (optional)
            </label>
            <input
              type="number"
              value={bandMax}
              onChange={(e) => setBandMax(e.target.value)}
              className="input-field"
              placeholder="12000"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button onClick={analyze} className="btn-primary" disabled={loading}>
            {loading ? "Analyzing..." : "Run Smart Analysis"}
          </button>
          <p className="text-sm text-gray-500">
            Uses existing employees as benchmarks and returns a recommended
            range.
          </p>
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Candidate
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium text-gray-900">
                {result.candidate.name}
              </p>
              <p>{result.candidate.email}</p>
              <p>{result.candidate.role}</p>
              <p>{result.candidate.country}</p>
              <p>Current Salary: {result.candidate.salary}</p>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recommendation
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Minimum</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.recommendation.minimum}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-xs text-blue-600">Target</p>
                <p className="text-2xl font-bold text-blue-700">
                  {result.recommendation.target}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Maximum</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.recommendation.maximum}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Confidence: {result.recommendation.confidence}%
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {result.recommendation.reasoning.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Benchmarks
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.comparisons.stats.average}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Median</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.comparisons.stats.median}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Min</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.comparisons.stats.min}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500">Max</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.comparisons.stats.max}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {result.comparisons.matches.length === 0 ? (
                <p className="text-sm text-gray-600">No similar staff found.</p>
              ) : (
                result.comparisons.matches.map((match) => (
                  <div
                    key={match.employeeId}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {match.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Salary: {match.salary}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        {match.similarity}% match
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                      {match.reasons.map((reason, idx) => (
                        <span
                          key={`${match.employeeId}-${idx}`}
                          className="bg-gray-100 px-2 py-1 rounded"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Equity Check
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                Status:{" "}
                <span
                  className={
                    result.equity.status === "PASS"
                      ? "text-green-600"
                      : "text-orange-600"
                  }
                >
                  {result.equity.status}
                </span>
              </p>
              <p>Risk: {result.equity.compressionRisk}</p>
              <p>{result.equity.message}</p>
            </div>
            {result.equity.impactedEmployees.length > 0 && (
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                {result.equity.impactedEmployees.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="border border-orange-200 bg-orange-50 p-2 rounded"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-orange-700">{item.issue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card lg:col-span-3">
            <div className="flex flex-col gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Offer Letter
              </h2>
              <p className="text-sm text-gray-600">
                Generate an offer letter using the recommended target salary.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={generateOfferLetter}
                className="btn-primary"
                disabled={offerLoading}
              >
                {offerLoading ? "Generating..." : "Generate Offer Letter"}
              </button>
              <button
                onClick={openOfferLetter}
                className="btn-secondary"
                disabled={!offerLetter}
              >
                Open Preview
              </button>
              <button
                onClick={downloadOfferPdf}
                className="btn-secondary"
                disabled={!offerLetter}
              >
                Download PDF
              </button>
            </div>
            {offerError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                {offerError}
              </div>
            )}
            {offerLetter && (
              <div className="mt-4 border border-gray-200 rounded bg-white p-4 max-h-[600px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: offerLetter }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
