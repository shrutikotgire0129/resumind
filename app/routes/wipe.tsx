import { useAuth } from "@clerk/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { deleteResume, getAllResumes } from "~/lib/resume-db";

const WipeApp = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const navigate = useNavigate();
    const [resumeCount, setResumeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const loadResumes = async () => {
        try {
            const resumes = await getAllResumes();
            setResumeCount(resumes.length);
        } catch (error) {
            console.error("Failed to load resumes:", error);
            setError("Failed to load resume data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            navigate("/auth?next=/wipe", { replace: true });
            return;
        }

        loadResumes();
    }, [isLoaded, isSignedIn, navigate]);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            setError("");

            const resumes = await getAllResumes();

            await Promise.all(
                resumes.map((resume) => deleteResume(resume.id)),
            );

            await loadResumes();
        } catch (error) {
            console.error("Failed to wipe resume data:", error);
            setError("Failed to delete resume data.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isLoaded || isLoading) {
        return <div>Loading...</div>;
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <div>
            Authenticated with Clerk
            <div>Existing resumes: {resumeCount}</div>

            {error && <div>Error: {error}</div>}

            <div>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Wiping..." : "Wipe App Data"}
                </button>
            </div>
        </div>
    );
};

export default WipeApp;