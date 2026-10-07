import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@clerk/react-router";
import { getAllResumes, saveResume } from "~/lib/resume-db";

const JobAnalyzer = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<JobMatchAnalysis | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/auth?next=/job-analyzer", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadResumes = async () => {
      setIsLoadingResumes(true);

      try {
        const storedResumes = await getAllResumes();

        storedResumes.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          return dateB - dateA;
        });

        setResumes(storedResumes);

        if (storedResumes.length > 0) {
          setSelectedResumeId(storedResumes[0].id);
        }
      } catch (error) {
        console.error("Failed to load resumes:", error);
        setResumes([]);
      } finally {
        setIsLoadingResumes(false);
      }
    };

    loadResumes();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="main-section flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const resume = resumes.find((item) => item.id === selectedResumeId);

    if (!resume) {
      setError("Please select a resume.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysisError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/job-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeUrl: resume.resumeUrl,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze the job match.");
      }

      if (!data.result) {
        throw new Error("No analysis result was returned.");
      }

      const result =
        typeof data.result === "string" ? JSON.parse(data.result) : data.result;

      const jobMatchHistoryEntry: JobMatchHistory = {
        id: crypto.randomUUID(),
        jobTitle: resume.jobTitle || "Job Match Analysis",
        jobDescription,
        analyzedAt: new Date().toISOString(),
        analysis: result,
      };

      const updatedResume: Resume = {
        ...resume,
        jobMatchHistory: [
          ...(resume.jobMatchHistory ?? []),
          jobMatchHistoryEntry,
        ],
      };

      await saveResume(updatedResume);

      setResumes((currentResumes) =>
        currentResumes.map((item) =>
          item.id === updatedResume.id ? updatedResume : item,
        ),
      );

      setAnalysisResult(result);
    } catch (error) {
      console.error("Job match analysis error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to analyze the job match.";

      setError(message);
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover">
      <section className="main-section">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            <span>←</span>
            Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="mb-4 inline-flex items-center rounded-full bg-[#F0EDFF] px-4 py-2 text-sm font-semibold text-[#6247AA]">
              AI Career Tool
            </div>

            <h1 className="!text-4xl !font-bold !text-gray-900 md:!text-5xl">
              Job Description Analyzer
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-500">
              Compare your resume against any job description and discover the
              skills, keywords, and experience you need to improve your chances
              of getting shortlisted.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="border-b border-gray-100 px-6 py-6 md:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EDFF] text-lg font-bold text-[#6247AA]">
                  1
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Choose your resume
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select the version you want to compare against the job
                    description.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {isLoadingResumes ? (
                <div className="flex min-h-40 items-center justify-center">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#6247AA]" />
                    Loading your resumes...
                  </div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDFF] text-2xl">
                    📄
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    No resumes available
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    Upload and analyze a resume first before using the Job
                    Description Analyzer.
                  </p>

                  <Link
                    to="/upload"
                    className="primary-button mt-6 inline-flex w-fit"
                  >
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {resumes.map((resume) => {
                    const isSelected = selectedResumeId === resume.id;

                    const score =
                      typeof resume.feedback?.overallScore === "number"
                        ? resume.feedback.overallScore
                        : null;

                    return (
                      <button
                        key={resume.id}
                        type="button"
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={`group relative w-full rounded-2xl border p-7 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#6247AA] bg-[#FAF9FF] shadow-[0_10px_35px_rgba(98,71,170,0.12)]"
                            : "border-gray-200 bg-white hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#6247AA] text-sm font-bold text-white">
                            ✓
                          </div>
                        )}

                        <div className="pr-12">
                          <div className="flex items-start justify-between gap-5">
                            <div className="min-w-0">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Resume
                              </p>

                              <h3 className="break-words text-xl font-bold leading-7 text-gray-900">
                                {resume.companyName || "Resume"}
                              </h3>

                              <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                                {resume.jobTitle || "No job title"}
                              </p>
                            </div>

                            <span className="mt-1 shrink-0 rounded-full bg-[#F0EDFF] px-3.5 py-1.5 text-xs font-semibold text-[#6247AA]">
                              Version {resume.versionNumber ?? 1}
                            </span>
                          </div>

                          <div className="my-7 h-px bg-gray-100" />

                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Resume Score
                              </p>

                              <p className="mt-2 text-3xl font-bold leading-none text-gray-900">
                                {score !== null ? `${score}%` : "—"}
                              </p>
                            </div>

                            {resume.createdAt && (
                              <div className="text-right">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                  Created
                                </p>

                                <p className="mt-2 text-sm font-medium text-gray-500">
                                  {new Date(
                                    resume.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-7">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-400">
                                Overall score
                              </span>

                              {score !== null && (
                                <span className="text-xs font-semibold text-gray-500">
                                  {score}/100
                                </span>
                              )}
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                              {score !== null && (
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#6247AA] to-[#9B8AFB] transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      Math.max(score, 0),
                                      100,
                                    )}%`,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {resumes.length > 0 && (
                <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Selected resume
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {resumes.find((resume) => resume.id === selectedResumeId)
                        ?.companyName || "Resume"}{" "}
                      ·{" "}
                      {resumes.find((resume) => resume.id === selectedResumeId)
                        ?.jobTitle || "No job title"}
                    </p>
                  </div>

                  <div className="flex h-10 items-center rounded-full bg-[#6247AA] px-5 text-sm font-semibold text-white">
                    Ready for analysis
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="border-b border-gray-100 px-6 py-6 md:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EDFF] text-lg font-bold text-[#6247AA]">
                  2
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add the job description
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Paste the job description you're applying for.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <textarea
                rows={12}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder={`Paste the complete job description here...

For example:
   • Job responsibilities
   • Required skills
   • Qualifications
   • Experience requirements
   • Preferred skills
   • Technologies and tools`}
                className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:bg-white focus:ring-4 focus:ring-[#6247AA]/10"
              />

              {analysisError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {analysisError}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Include the complete job description for a more accurate
                  analysis.
                </p>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    !selectedResumeId || !jobDescription.trim() || isAnalyzing
                  }
                  className="primary-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Job Match"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {analysisResult && (
          <div className="mt-8 flex flex-col gap-8">
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="border-b border-gray-100 px-6 py-6 md:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center rounded-full bg-[#F0EDFF] px-3 py-1 text-xs font-semibold text-[#6247AA]">
                      AI Analysis
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">
                      Job Match Results
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Here's how well your resume matches this job.
                    </p>
                  </div>

                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-8 border-[#F0EDFF]">
                    <span className="text-2xl font-bold text-[#6247AA]">
                      {analysisResult.matchScore}
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="rounded-2xl bg-[#FAF9FF] p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    Match Summary
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-gray-600">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                    <h3 className="text-lg font-bold text-green-800">
                      Matching Skills
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysisResult.matchingSkills.length > 0 ? (
                        analysisResult.matchingSkills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-green-700">
                          No matching skills identified.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                    <h3 className="text-lg font-bold text-red-800">
                      Missing Skills
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysisResult.missingSkills.length > 0 ? (
                        analysisResult.missingSkills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-red-700">
                          No major missing skills identified.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <h3 className="text-lg font-bold text-blue-800">
                      Matching Keywords
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysisResult.matchingKeywords.length > 0 ? (
                        analysisResult.matchingKeywords.map(
                          (keyword, index) => (
                            <span
                              key={`${keyword}-${index}`}
                              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm"
                            >
                              {keyword}
                            </span>
                          ),
                        )
                      ) : (
                        <p className="text-sm text-blue-700">
                          No matching keywords identified.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <h3 className="text-lg font-bold text-amber-800">
                      Missing Keywords
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysisResult.missingKeywords.length > 0 ? (
                        analysisResult.missingKeywords.map((keyword, index) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-amber-700">
                          No major missing keywords identified.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Experience Match
                      </h3>

                      <span className="text-lg font-bold text-[#6247AA]">
                        {analysisResult.experienceMatch.score}/100
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#6247AA]"
                        style={{
                          width: `${Math.min(
                            Math.max(analysisResult.experienceMatch.score, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {analysisResult.experienceMatch.explanation}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        ATS Compatibility
                      </h3>

                      <span className="text-lg font-bold text-[#6247AA]">
                        {analysisResult.atsCompatibility.score}/100
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#6247AA]"
                        style={{
                          width: `${Math.min(
                            Math.max(analysisResult.atsCompatibility.score, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {analysisResult.atsCompatibility.tips.map(
                        (tip, index) => (
                          <div
                            key={`${tip}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-1 text-[#6247AA]">•</span>
                            <p className="text-sm leading-6 text-gray-600">
                              {tip}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#E8E2FF] bg-[#FAF9FF] p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    Recommendations
                  </h3>

                  <div className="mt-4 flex flex-col gap-3">
                    {analysisResult.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={`${recommendation}-${index}`}
                          className="flex items-start gap-3 rounded-xl bg-white p-4"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F0EDFF] text-xs font-bold text-[#6247AA]">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-gray-600">
                            {recommendation}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default JobAnalyzer;
