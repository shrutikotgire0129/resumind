import { useAuth } from "@clerk/react-router";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { getAllResumes } from "~/lib/resume-db";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Analytics = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const atsScoreHistory = [...resumes]
    .sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
    )
    .map((resume, index) => ({
      version: `v${resume.versionNumber ?? index + 1}`,
      score: resume.feedback.ATS.score,
    }));

  const keywordCoverageData = resumes.flatMap((resume) =>
    (resume.jobMatchHistory ?? []).map((history) => {
      const matchingKeywords = history.analysis.matchingKeywords.length;
      const missingKeywords = history.analysis.missingKeywords.length;
      const totalKeywords = matchingKeywords + missingKeywords;

      const coverage =
        totalKeywords > 0
          ? Math.round((matchingKeywords / totalKeywords) * 100)
          : 0;

      return {
        resumeVersion: `v${resume.versionNumber ?? 1}`,
        coverage,
      };
    }),
  );

  const averageKeywordCoverage =
    keywordCoverageData.length > 0
      ? Math.round(
          keywordCoverageData.reduce(
            (total, item) => total + item.coverage,
            0,
          ) / keywordCoverageData.length,
        )
      : 0;

  const skillCoverageData = resumes.flatMap((resume) =>
    (resume.jobMatchHistory ?? []).map((history) => {
      const matchingSkills = history.analysis.matchingSkills.length;
      const missingSkills = history.analysis.missingSkills.length;
      const totalSkills = matchingSkills + missingSkills;

      const coverage =
        totalSkills > 0 ? Math.round((matchingSkills / totalSkills) * 100) : 0;

      return {
        resumeVersion: `v${resume.versionNumber ?? 1}`,
        coverage,
      };
    }),
  );

  const averageSkillCoverage =
    skillCoverageData.length > 0
      ? Math.round(
          skillCoverageData.reduce((total, item) => total + item.coverage, 0) /
            skillCoverageData.length,
        )
      : 0;

  const jobSpecificScores = resumes.flatMap((resume) =>
    (resume.jobMatchHistory ?? []).map((history) => ({
      id: history.id,
      resumeVersion: `v${resume.versionNumber ?? 1}`,
      jobTitle: history.jobTitle,
      matchScore: history.analysis.matchScore,
      analyzedAt: history.analyzedAt,
    })),
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const loadResumes = async () => {
      try {
        const storedResumes = await getAllResumes();

        const sortedResumes = [...storedResumes].sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime(),
        );

        setResumes(sortedResumes);
      } catch (error) {
        console.error("Failed to load resumes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResumes();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth?next=/analytics" replace />;
  }

  return (
    <main className="min-h-screen bg-[#FAF9FD] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6247AA]">
            Resume Analytics
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Resume Performance
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
            Track how your resume versions improve over time and understand how
            they perform against different opportunities.
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No resume data yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Upload and analyze a resume to start tracking your resume
              performance.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                ATS Score History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track how your ATS score changes across resume versions.
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={atsScoreHistory}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="version" tickLine={false} axisLine={false} />

                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />

                  <Tooltip
                    formatter={(value) => [`${value}`, "ATS Score"]}
                    labelFormatter={(label) => `Resume ${label}`}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6247AA"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Keyword Coverage
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Average job-specific keyword coverage across your analyzed
                    opportunities.
                  </p>
                </div>

                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[#F0EDFF]">
                  <span className="text-2xl font-bold text-[#6247AA]">
                    {averageKeywordCoverage}%
                  </span>

                  <span className="text-xs font-medium text-gray-400">
                    coverage
                  </span>
                </div>
              </div>

              {keywordCoverageData.length > 0 ? (
                <div className="mt-8 flex flex-col gap-4">
                  {keywordCoverageData.map((item, index) => (
                    <div
                      key={`${item.resumeVersion}-${index}`}
                      className="rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-gray-700">
                          Resume {item.resumeVersion}
                        </span>

                        <span className="text-sm font-bold text-[#6247AA]">
                          {item.coverage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#6247AA] transition-all duration-500"
                          style={{
                            width: `${item.coverage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    Run a Job Match Analysis to start tracking keyword coverage.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Skill Coverage
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Average coverage of skills required by your analyzed job
                    opportunities.
                  </p>
                </div>

                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[#F0EDFF]">
                  <span className="text-2xl font-bold text-[#6247AA]">
                    {averageSkillCoverage}%
                  </span>

                  <span className="text-xs font-medium text-gray-400">
                    coverage
                  </span>
                </div>
              </div>

              {skillCoverageData.length > 0 ? (
                <div className="mt-8 flex flex-col gap-4">
                  {skillCoverageData.map((item, index) => (
                    <div
                      key={`${item.resumeVersion}-${index}`}
                      className="rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-gray-700">
                          Resume {item.resumeVersion}
                        </span>

                        <span className="text-sm font-bold text-[#6247AA]">
                          {item.coverage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#6247AA] transition-all duration-500"
                          style={{
                            width: `${item.coverage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    Run a Job Match Analysis to start tracking skill coverage.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
            Job-Specific Scores
        </h2>

        <p className="mt-1 text-sm text-gray-500">
            See how your resume versions perform against the jobs you've
            analyzed.
        </p>
    </div>

    {jobSpecificScores.length > 0 ? (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100 text-left">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Job
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Resume
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Match Score
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Analyzed
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {jobSpecificScores.map((item) => (
                        <tr
                            key={item.id}
                            className="border-b border-gray-50 last:border-0"
                        >
                            <td className="px-4 py-4">
                                <p className="font-semibold text-gray-900">
                                    {item.jobTitle}
                                </p>
                            </td>

                            <td className="px-4 py-4">
                                <span className="rounded-full bg-[#F0EDFF] px-3 py-1.5 text-xs font-semibold text-[#6247AA]">
                                    {item.resumeVersion}
                                </span>
                            </td>

                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-[#6247AA]"
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(
                                                        item.matchScore,
                                                        0,
                                                    ),
                                                    100,
                                                )}%`,
                                            }}
                                        />
                                    </div>

                                    <span className="text-sm font-bold text-gray-900">
                                        {item.matchScore}%
                                    </span>
                                </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-500">
                                {new Date(
                                    item.analyzedAt,
                                ).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ) : (
        <div className="rounded-2xl bg-gray-50 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">
                Run a Job Match Analysis to start tracking job-specific
                performance.
            </p>
        </div>
    )}
</div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Analytics;
