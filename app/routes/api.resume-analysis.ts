import { GoogleGenAI } from "@google/genai";
import { prepareInstructions } from "../../constants";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
  apiKey,
});

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
    const formData = await request.formData();

    const file = formData.get("file");
    const jobTitle = formData.get("jobTitle");
    const jobDescription = formData.get("jobDescription");

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({
          error: "Resume PDF is required.",
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
      typeof jobTitle !== "string" ||
      typeof jobDescription !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "Job title and job description are required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType: file.type || "application/pdf",
            data: base64File,
          },
        },
        {
          text: prepareInstructions({
            jobTitle,
            jobDescription,
          }),
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty analysis.");
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
    console.error("Resume analysis error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze resume.",
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