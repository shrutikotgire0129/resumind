import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
  apiKey,
});

interface ExtractRequest {
  resumeUrl: string;
  section: string;
}

const prepareExtractionInstructions = ({
  section,
}: {
  section: string;
}) => `
You are an expert resume parser.

Extract the candidate's "${section}" section from the provided resume PDF.

Rules:
- Return only the extracted resume content.
- Preserve the candidate's original facts.
- Do not rewrite, improve, summarize, or add information.
- Do not invent missing information.
- If the requested section does not exist, return an empty string.
- Preserve bullet points when they exist.
- Preserve important wording and technical terms.
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
    const { resumeUrl, section } = body as ExtractRequest;

    if (
      typeof resumeUrl !== "string" ||
      !resumeUrl.trim()
    ) {
      return new Response(
        JSON.stringify({
          error: "Resume URL is required.",
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

    const resumeResponse = await fetch(resumeUrl);

    if (!resumeResponse.ok) {
      throw new Error(
        `Failed to fetch the resume PDF from Cloudinary (${resumeResponse.status}).`,
      );
    }

    const resumeBuffer = await resumeResponse.arrayBuffer();
    const base64File = Buffer.from(resumeBuffer).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64File,
          },
        },
        {
          text: prepareExtractionInstructions({
            section,
          }),
        },
      ],
      config: {
        responseMimeType: "text/plain",
      },
    });

    return new Response(
      JSON.stringify({
        result: response.text?.trim() || "",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Resume extraction error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract resume content.",
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