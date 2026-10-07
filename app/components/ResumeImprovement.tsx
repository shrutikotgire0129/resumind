import { useState } from "react";

interface ImprovementResult {
  original: string;
  improved: string;
  whyItIsBetter: string[];
  changes: string[];
}

interface ResumeImprovementProps {
  jobTitle: string;
  jobDescription: string;
  feedback: Feedback;
  resumeUrl?: string;
}

const sections = [
  "Professional Summary",
  "Experience",
  "Projects",
  "Skills",
  "Education",
  "Custom",
];

const instructions = [
  "Make it more ATS-friendly",
  "Make it more concise",
  "Make it more impactful",
  "Use stronger action verbs",
  "Tailor it to the job description",
];

const ResumeImprovement = ({
  jobTitle,
  jobDescription,
  feedback,
  resumeUrl,
}: ResumeImprovementProps) => {
  const feedbackSectionMap: Record<string, string> = {
    ATS: "Skills",
    "Tone & Style": "Professional Summary",
    Content: "Experience",
    Structure: "Professional Summary",
    Skills: "Skills",
  };

  const feedbackSuggestions = [
    ...feedback.ATS.tips.map((item) => ({
      section: feedbackSectionMap.ATS,
      suggestion: item.tip,
    })),
    ...feedback.toneAndStyle.tips.map((item) => ({
      section: feedbackSectionMap["Tone & Style"],
      suggestion: item.tip,
    })),
    ...feedback.content.tips.map((item) => ({
      section: feedbackSectionMap.Content,
      suggestion: item.tip,
    })),
    ...feedback.structure.tips.map((item) => ({
      section: feedbackSectionMap.Structure,
      suggestion: item.tip,
    })),
    ...feedback.skills.tips.map((item) => ({
      section: feedbackSectionMap.Skills,
      suggestion: item.tip,
    })),
  ];

  const [section, setSection] = useState("Professional Summary");
  const [content, setContent] = useState("");
  const [instruction, setInstruction] = useState("Make it more ATS-friendly");
  const [customInstruction, setCustomInstruction] = useState("");
  const [result, setResult] = useState<ImprovementResult | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!resumeUrl) {
      setError("Resume PDF is not available.");
      return;
    }

    try {
      setIsExtracting(true);
      setError("");

      const response = await fetch("/api/resume-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeUrl,
          section,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract resume content.");
      }

      if (!data.result) {
        throw new Error(
          `Could not find the ${section} section in your resume.`,
        );
      }

      setContent(data.result);
    } catch (error) {
      console.error("Resume extraction failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to extract resume content.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImprove = async () => {
    if (!content.trim()) {
      setError("Please enter the resume content you want to improve.");
      return;
    }

    const finalInstruction =
      instruction === "Custom" ? customInstruction.trim() : instruction;

    if (!finalInstruction) {
      setError("Please enter an improvement instruction.");
      return;
    }

    try {
      setIsImproving(true);
      setError("");
      setResult(null);

      const response = await fetch("/api/resume-improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          content,
          instruction: finalInstruction,
          jobTitle,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve resume content.");
      }

      if (!data.result) {
        throw new Error("No improvement result was returned.");
      }

      const parsedResult =
        typeof data.result === "string" ? JSON.parse(data.result) : data.result;

      setResult(parsedResult);
    } catch (error) {
      console.error("Resume improvement failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to improve resume content.",
      );
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.improved) return;

    try {
      await navigator.clipboard.writeText(result.improved);
    } catch (error) {
      console.error("Failed to copy improvement:", error);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          AI Resume Improvement
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Improve individual resume sections with AI-powered suggestions
          tailored to your target role.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {feedbackSuggestions.length > 0 && (
          <div className="rounded-xl border border-[#E8E3F5] bg-[#FAF9FF] p-5">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                AI Improvement Suggestions
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Based on the feedback from your resume analysis.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {feedbackSuggestions.slice(0, 6).map((item, index) => (
                <div
                  key={`${item.section}-${item.suggestion}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item.suggestion}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Suggested section: {item.section}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setInstruction("Custom");
                      setCustomInstruction(item.suggestion);
                      setSection(item.section);
                      setContent("");
                      setError("");

                      if (!resumeUrl) {
                        setError("Resume PDF is not available.");
                        return;
                      }

                      try {
                        setIsExtracting(true);

                        const response = await fetch("/api/resume-extract", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            resumeUrl,
                            section: item.section,
                          }),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(
                            data.error || "Failed to extract resume content.",
                          );
                        }

                        if (!data.result) {
                          throw new Error(
                            `Could not find the ${item.section} section in your resume.`,
                          );
                        }

                        setContent(data.result);
                      } catch (error) {
                        console.error("Resume extraction failed:", error);

                        setError(
                          error instanceof Error
                            ? error.message
                            : "Failed to extract resume content.",
                        );
                      } finally {
                        setIsExtracting(false);
                      }
                    }}
                    className="shrink-0 text-sm font-semibold text-[#6247AA] hover:underline"
                  >
                    Improve This
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="resume-section"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Resume Section
          </label>

          <select
            id="resume-section"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#6247AA]"
          >
            {sections.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="resume-content"
              className="block text-sm font-semibold text-gray-700"
            >
              Content to Improve
            </label>

            {resumeUrl && (
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className="text-sm font-semibold text-[#6247AA] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExtracting ? "Extracting..." : "Extract from Resume"}
              </button>
            )}
          </div>

          <textarea
            id="resume-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste the resume content you want AI to improve..."
            rows={7}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#6247AA]"
          />
        </div>

        <div>
          <label
            htmlFor="improvement-instruction"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Improvement Goal
          </label>

          <div className="mb-3 flex flex-wrap gap-2">
            {instructions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setInstruction(item)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  instruction === item
                    ? "border-[#6247AA] bg-[#F0EDFF] text-[#6247AA]"
                    : "border-gray-300 bg-white text-gray-600 hover:border-[#6247AA] hover:text-[#6247AA]"
                }`}
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setInstruction("Custom")}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                instruction === "Custom"
                  ? "border-[#6247AA] bg-[#F0EDFF] text-[#6247AA]"
                  : "border-gray-300 bg-white text-gray-600 hover:border-[#6247AA] hover:text-[#6247AA]"
              }`}
            >
              Custom
            </button>
          </div>

          <select
            id="improvement-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#6247AA]"
          >
            {instructions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}

            <option value="Custom">Custom instruction</option>
          </select>
        </div>

        {instruction === "Custom" && (
          <div>
            <label
              htmlFor="custom-instruction"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Custom Instruction
            </label>

            <input
              id="custom-instruction"
              value={customInstruction}
              onChange={(event) => setCustomInstruction(event.target.value)}
              placeholder="Example: Highlight leadership and measurable impact"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#6247AA]"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleImprove}
          disabled={isImproving}
          className="primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImproving ? "Improving with AI..." : "Improve with AI"}
        </button>

        {result && (
          <div className="mt-4 flex flex-col gap-5 border-t border-gray-200 pt-6">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-gray-900">
                  Improved Version
                </h4>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>

              <div className="rounded-lg bg-[#F8F7FC] p-4 text-sm leading-6 text-gray-800">
                {result.improved}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-lg font-bold text-gray-900">
                Why It Is Better
              </h4>

              <ul className="flex flex-col gap-2">
                {result.whyItIsBetter.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="text-sm leading-6 text-gray-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-lg font-bold text-gray-900">
                Changes Made
              </h4>

              <ul className="flex flex-col gap-2">
                {result.changes.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="text-sm leading-6 text-gray-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResumeImprovement;
