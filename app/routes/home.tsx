import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { useAuth } from "@clerk/react-router";
import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { getAllResumes } from "~/lib/resume-db";
import { BarChart3, BriefcaseBusiness, ClipboardList } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind | Dashboard" },
    {
      name: "description",
      content: "Track and improve your resumes with AI-powered feedback.",
    },
  ];
}

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/auth?next=/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadResumes = async () => {
      setLoadingResumes(true);

      try {
        const parsedResumes = await getAllResumes();

        parsedResumes.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          return dateB - dateA;
        });

        setResumes(parsedResumes);
      } catch (error) {
        console.error("Failed to load resumes:", error);
        setResumes([]);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [isLoaded, isSignedIn]);

  const statistics = useMemo(() => {
    if (resumes.length === 0) {
      return {
        totalResumes: 0,
        averageScore: 0,
        bestScore: 0,
        averageATS: 0,
      };
    }

    const overallScores = resumes
      .map((resume) => resume.feedback?.overallScore)
      .filter((score): score is number => typeof score === "number");

    const atsScores = resumes
      .map((resume) => resume.feedback?.ATS?.score)
      .filter((score): score is number => typeof score === "number");

    const averageScore =
      overallScores.length > 0
        ? Math.round(
            overallScores.reduce((total, score) => total + score, 0) /
              overallScores.length,
          )
        : 0;

    const bestScore = overallScores.length > 0 ? Math.max(...overallScores) : 0;

    const averageATS =
      atsScores.length > 0
        ? Math.round(
            atsScores.reduce((total, score) => total + score, 0) /
              atsScores.length,
          )
        : 0;

    return {
      totalResumes: resumes.length,
      averageScore,
      bestScore,
      averageATS,
    };
  }, [resumes]);

  const recentResumes = useMemo(() => {
    return resumes;
  }, [resumes]);

  const scoreOverview = useMemo(() => {
    return [...resumes].sort(
      (a, b) =>
        (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0),
    );
  }, [resumes]);

  const handleResumeDeleted = (id: string) => {
    setResumes((currentResumes) =>
      currentResumes.filter((resume) => resume.id !== id),
    );
  };

  if (!isLoaded) {
    return (
      <main className="main-section flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="main-section flex items-center justify-center">
        <p className="text-gray-500">Signing out...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-12">
          <h1>Resume Dashboard</h1>
          <h2>
            Track your resumes, ATS scores, and AI-powered feedback in one
            place.
          </h2>
        </div>

        {loadingResumes ? (
          <div className="flex flex-col items-center justify-center py-20">
            <img
              src="/images/resume-scan-2.gif"
              alt="Loading resumes"
              className="w-[200px]"
            />

            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="gradient-border">
                <div className="flex h-full flex-col gap-2 rounded-2xl bg-white p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Total Resumes
                  </p>

                  <h3 className="text-4xl font-bold text-black">
                    {statistics.totalResumes}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Resume versions analyzed
                  </p>
                </div>
              </div>

              <div className="gradient-border">
                <div className="flex h-full flex-col gap-2 rounded-2xl bg-white p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Average Score
                  </p>

                  <h3 className="text-4xl font-bold text-black">
                    {statistics.averageScore}
                    <span className="text-xl">%</span>
                  </h3>

                  <p className="text-sm text-gray-500">
                    Across all analyzed resumes
                  </p>
                </div>
              </div>

              <div className="gradient-border">
                <div className="flex h-full flex-col gap-2 rounded-2xl bg-white p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Best Score
                  </p>

                  <h3 className="text-4xl font-bold text-black">
                    {statistics.bestScore}
                    <span className="text-xl">%</span>
                  </h3>

                  <p className="text-sm text-gray-500">
                    Your highest resume score
                  </p>
                </div>
              </div>

              <div className="gradient-border">
                <div className="flex h-full flex-col gap-2 rounded-2xl bg-white p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Average ATS
                  </p>

                  <h3 className="text-4xl font-bold text-black">
                    {statistics.averageATS}
                    <span className="text-xl">%</span>
                  </h3>

                  <p className="text-sm text-gray-500">
                    ATS compatibility score
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Link
                  to="/job-analyzer"
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#6247AA]">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Analyzer
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Compare your resume with a job description and discover
                    matching skills, missing keywords, and your overall job
                    match score.
                  </p>

                  <span className="mt-5 inline-block text-sm font-semibold text-[#6247AA] transition-transform duration-200 group-hover:translate-x-1">
                    Analyze a Job →
                  </span>
                </Link>

                <Link
                  to="/applications"
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#6247AA]">
                    <ClipboardList className="h-6 w-6" />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Application Tracker
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Organize your applications, track interview progress,
                    follow-ups, priorities, and the resume version used for each
                    opportunity.
                  </p>

                  <span className="mt-5 inline-block text-sm font-semibold text-[#6247AA] transition-transform duration-200 group-hover:translate-x-1">
                    Track Applications →
                  </span>
                </Link>

                <Link
                  to="/analytics"
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#6247AA]">
                    <BarChart3 className="h-6 w-6" />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Resume Analytics
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Track ATS compatibility, keyword alignment, skill coverage, skill alignment
                    and job-specific scores across all your resume versions.
                  </p>

                  <span className="mt-5 inline-block text-sm font-semibold text-[#6247AA] transition-transform duration-200 group-hover:translate-x-1">
                    View Analytics →
                  </span>
                </Link>
              </div>
            </section>

            {scoreOverview.length > 0 && (
              <section className="mt-10 w-full">
                <div className="gradient-border">
                  <div className="rounded-2xl bg-white p-6 sm:p-8">
                    <div className="mb-6">
                      <h2 className="!text-black text-2xl font-bold">
                        Score Overview
                      </h2>

                      <p className="mt-1 text-gray-500">
                        Compare the overall performance of your analyzed
                        resumes.
                      </p>
                    </div>

                    <div className="flex flex-col gap-5">
                      {scoreOverview.map((resume) => {
                        const score =
                          typeof resume.feedback?.overallScore === "number"
                            ? resume.feedback.overallScore
                            : null;

                        const resumeName =
                          resume.companyName || resume.jobTitle || "Resume";

                        return (
                          <Link
                            key={resume.id}
                            to={`/resume/${resume.id}`}
                            className="group"
                          >
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-800 group-hover:text-black">
                                  {resumeName}
                                </p>

                                {resume.companyName && resume.jobTitle && (
                                  <p className="truncate text-sm text-gray-500">
                                    {resume.jobTitle}
                                  </p>
                                )}
                              </div>

                              <span className="flex-shrink-0 font-bold text-gray-800">
                                {score !== null ? `${score}%` : "Not scored"}
                              </span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                              {score !== null && (
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#9B8AFB] transition-all duration-700"
                                  style={{
                                    width: `${Math.min(
                                      Math.max(score, 0),
                                      100,
                                    )}%`,
                                  }}
                                />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-12">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="!text-black text-2xl font-bold">
                    Recent Resumes
                  </h2>

                  <p className="mt-1 text-gray-500">
                    Your latest resume analyses.
                  </p>
                </div>

                {resumes.length > 0 && (
                  <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                  </Link>
                )}
              </div>

              {recentResumes.length > 0 ? (
                <div className="resumes-section">
                  {recentResumes.map((resume) => (
                    <ResumeCard
                      key={resume.id}
                      resume={resume}
                      onDeleted={handleResumeDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="gradient-border">
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white px-6 py-16 text-center">
                    <h2 className="!text-black text-2xl font-bold">
                      No resumes yet
                    </h2>

                    <p className="max-w-xl text-gray-500">
                      Upload your first resume and get an AI-powered ATS score,
                      detailed feedback, and personalized improvement
                      suggestions.
                    </p>

                    <Link
                      to="/upload"
                      className="primary-button w-fit text-lg font-semibold"
                    >
                      Upload Your First Resume
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
