import { GoogleGenAI } from "@google/genai";
import { prepareJobMatchInstructions } from "../../constants";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function action({request}: {request: Request}) {
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

    const {resumeUrl, jobDescription} = body;

    if (!resumeUrl || !jobDescription) {
      return new Response(
        JSON.stringify({
          error: "Resume URL and job description are required.",
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
      const errorText = await resumeResponse.text();

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
          text: prepareJobMatchInstructions({
            jobDescription,
          }),
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty job match analysis.");
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
    console.error("Job match analysis error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze the job match.",
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