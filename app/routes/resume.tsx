import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react-router";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import { getResume } from "~/lib/resume-db";
import ResumeImprovement from "~/components/ResumeImprovement";

export const meta = () => [
  { title: "Resumind | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/auth?next=/resume/${id}`, { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate, id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !id) return;

    const loadResume = async () => {
      try {
        const data = await getResume(id);

        if (!data) {
          navigate("/");
          return;
        }

        setResume(data);
      } catch (error) {
        console.error("Failed to load resume:", error);
        navigate("/");
      } finally {
        setIsLoadingResume(false);
      }
    };

    loadResume();
  }, [id, isLoaded, isSignedIn, navigate]);

  if (!isLoaded || isLoadingResume) {
    return (
      <main className="!pt-0">
        <nav className="resume-nav">
          <Link to="/" className="back-button">
            <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
            <span className="text-gray-800 text-sm font-semibold">
              Back to Homepage
            </span>
          </Link>
        </nav>

        <div className="flex flex-row w-full max-lg:flex-col-reverse">
          <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
            <img
              src="/images/resume-scan-2.gif"
              className="w-full max-w-md"
              alt="Loading resume"
            />
          </section>

          <section className="feedback-section">
            <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
            <img
              src="/images/resume-scan-2.gif"
              className="w-full"
              alt="Loading resume analysis"
            />
          </section>
        </div>
      </main>
    );
  }

  if (!resume) return null;

  const versionNumber = resume.versionNumber ?? 1;

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>

        <div className="flex items-center gap-3 mr-6">
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F0EDFF] px-3 py-1 text-sm font-semibold text-[#6247AA]">
            Version {versionNumber}
          </span>

          <Link
            to={`/upload?versionOf=${resume.id}`}
            className="primary-button"
          >
            Create New Version
          </Link>
        </div>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {resume.imageUrl && resume.resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a
                href={resume.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={resume.imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl !text-black font-bold">Resume Review</h2>

              {(resume.companyName || resume.jobTitle) && (
                <div className="mt-2">
                  {resume.companyName && (
                    <p className="text-lg font-semibold text-gray-800">
                      {resume.companyName}
                    </p>
                  )}

                  {resume.jobTitle && (
                    <p className="text-sm text-gray-500">{resume.jobTitle}</p>
                  )}
                </div>
              )}
            </div>

            <span className="shrink-0 rounded-full bg-[#F0EDFF] px-5 py-1 text-sm font-semibold text-[#6247AA]">
              v{versionNumber}
            </span>
          </div>

          {resume.feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={resume.feedback} />

              <ATS
                score={resume.feedback.ATS?.score || 0}
                suggestions={resume.feedback.ATS?.tips || []}
              />

              <Details feedback={resume.feedback} />

              <ResumeImprovement
                jobTitle={resume.jobTitle}
                jobDescription={resume.jobDescription}
                feedback={resume.feedback}
                resumeUrl={resume.resumeUrl}
              />

              {resume.resumeUrl && (
                <div className="flex justify-center pb-6">
                  <a
                    href={resume.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button w-auto justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    View Full Resume PDF
                  </a>
                </div>
              )}
            </div>
          ) : (
            <img
              src="/images/resume-scan-2.gif"
              className="w-full"
              alt="Analyzing resume"
            />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
