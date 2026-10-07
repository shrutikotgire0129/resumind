import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
  apiKey,
});

interface ImprovementRequest {
  section: string;
  content: string;
  instruction: string;
  jobTitle?: string;
  jobDescription?: string;
}

const prepareImprovementInstructions = ({
  section,
  content,
  instruction,
  jobTitle,
  jobDescription,
}: ImprovementRequest) => `
You are an expert resume writer, ATS optimization specialist, and technical recruiter.

Your task is to improve a specific section of a candidate's resume.

SECTION:
${section}

ORIGINAL CONTENT:
${content}

USER'S REQUEST:
${instruction}

${jobTitle ? `TARGET JOB TITLE:\n${jobTitle}` : ""}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ""}

INSTRUCTIONS:
- Preserve the candidate's factual information.
- Never invent companies, projects, technologies, responsibilities, achievements, metrics, or experience.
- Improve clarity, conciseness, professionalism, and impact.
- Use strong action verbs where appropriate.
- Optimize naturally for ATS readability and relevant keywords.
- If a job description is provided, tailor the content to relevant requirements and terminology.
- Do not keyword-stuff.
- Keep the writing appropriate for a professional software engineering resume.
- Return only valid JSON.
- Do not use markdown code fences.

Return exactly this JSON structure:

{
  "original": "the original content",
  "improved": "the improved content",
  "whyItIsBetter": [
    "specific reason",
    "specific reason",
    "specific reason"
  ],
  "changes": [
    "specific change",
    "specific change",
    "specific change"
  ]
}
`;

export async function action({
  request,
}: {
  request: Request;
}) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const body = await request.json();

    const {
      section,
      content,
      instruction,
      jobTitle,
      jobDescription,
    } = body as ImprovementRequest;

    if (
      typeof section !== "string" ||
      !section.trim()
    ) {
      return new Response(
        JSON.stringify({
          error: "Resume section is required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return new Response(
        JSON.stringify({
          error: "Resume content is required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (
      typeof instruction !== "string" ||
      !instruction.trim()
    ) {
      return new Response(
        JSON.stringify({
          error: "Improvement instruction is required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          text: prepareImprovementInstructions({
            section,
            content,
            instruction,
            jobTitle:
              typeof jobTitle === "string"
                ? jobTitle
                : undefined,
            jobDescription:
              typeof jobDescription === "string"
                ? jobDescription
                : undefined,
          }),
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error(
        "Gemini returned an empty improvement response.",
      );
    }

    return new Response(
      JSON.stringify({
        result: response.text,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Resume improvement error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to improve resume content.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}