import { type FormEvent, useEffect, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { useAuth } from "@clerk/react-router";
import { useNavigate, useSearchParams } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { getResume, getAllResumes, saveResume } from "~/lib/resume-db";
import { uploadToCloudinary } from "~/lib/cloudinary";

const Upload = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const versionOf = searchParams.get("versionOf");

  const [versionGroupId, setVersionGroupId] = useState<string | null>(null);
  const [versionNumber, setVersionNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/auth?next=/upload`, { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !versionOf) return;

    const loadVersionInfo = async () => {
      try {
        const originalResume = await getResume(versionOf);

        if (!originalResume) {
          console.error("Original resume not found");
          return;
        }

        const groupId = originalResume.versionGroupId || originalResume.id;

        const currentVersion = Number(originalResume.versionNumber) || 1;

        const resumes = await getAllResumes();

        const groupResumes = resumes.filter(
          (resume) => (resume.versionGroupId || resume.id) === groupId,
        );

        const highestVersion = groupResumes.reduce(
          (highest, resume) =>
            Math.max(highest, Number(resume.versionNumber) || 1),
          currentVersion,
        );

        setVersionGroupId(groupId);
        setVersionNumber(highestVersion + 1);
      } catch (error) {
        console.error("Failed to load version information:", error);
      }
    };

    loadVersionInfo();
  }, [versionOf, isLoaded, isSignedIn]);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    try {
      setStatusText("Uploading the resume...");

      const uploadedFile = await uploadToCloudinary(file);

      if (!uploadedFile?.secure_url) {
        throw new Error("Failed to upload resume to Cloudinary");
      }

      setStatusText("Converting resume to image...");

      const imageFile = await convertPdfToImage(file);

      if (!imageFile.file) {
        throw new Error("Failed to convert PDF to image");
      }

      setStatusText("Uploading resume preview...");

      const uploadedImage = await uploadToCloudinary(imageFile.file);

      if (!uploadedImage?.secure_url) {
        throw new Error("Failed to upload resume preview to Cloudinary");
      }

      setStatusText("Preparing data...");

      const uuid = generateUUID();

      const data: Resume = {
        id: uuid,
        resumeUrl: uploadedFile.secure_url,
        resumePublicId: uploadedFile.public_id,
        imageUrl: uploadedImage.secure_url,
        imagePublicId: uploadedImage.public_id,
        companyName,
        jobTitle,
        jobDescription,
        versionGroupId: versionGroupId || uuid,
        versionNumber,
        createdAt: new Date().toISOString(),
        feedback: {} as Feedback,
      };

      await saveResume(data);

      setStatusText("Analyzing resume...");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("jobTitle", jobTitle);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/resume-analysis", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze resume");
      }

      if (!result.result) {
        throw new Error("No resume analysis result was returned.");
      }

      const feedbackText =
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result);

      data.feedback = JSON.parse(feedbackText);

      await saveResume(data);

      setStatusText("Analysis complete, redirecting...");

      console.log(data);

      navigate(`/resume/${uuid}`);
    } catch (error) {
      console.error("Resume analysis error:", error);

      setStatusText(
        `Error: ${
          error instanceof Error ? error.message : "Something went wrong"
        }`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) {
      setStatusText("Please upload a resume first.");
      return;
    }

    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };

  if (!isLoaded) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Smart feedback for your dream job</h1>
            <h2>Loading...</h2>
          </div>
        </section>
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>

              <img
                src="/images/resume-scan.gif"
                className="w-full"
                alt="Analyzing resume"
              />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>

                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>

                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>

                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>

                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;