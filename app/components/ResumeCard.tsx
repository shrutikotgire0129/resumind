import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useState } from "react";
import { deleteResume } from "~/lib/resume-db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

const ResumeCard = ({
  resume: {
    id,
    companyName,
    jobTitle,
    feedback,
    imageUrl,
    versionNumber,
  },
  onDeleted,
}: {
  resume: Resume;
  onDeleted?: (id: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteResume(id);

      setIsDialogOpen(false);
      onDeleted?.(id);
    } catch (error) {
      console.error("Failed to delete resume:", error);
      window.alert("Failed to delete the resume. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative resume-card animate-in fade-in duration-1000">
      <Link to={`/resume/${id}`} className="block">
        <div className="resume-card-header">
          <div className="flex flex-col gap-2 pr-10">
            {companyName && (
              <h2 className="!text-black font-bold break-words">
                {companyName}
              </h2>
            )}

            {jobTitle && (
              <h3 className="text-lg break-words text-gray-500">
                {jobTitle}
              </h3>
            )}

            {!companyName && !jobTitle && (
              <h2 className="!text-black font-bold">Resume</h2>
            )}

            <span className="w-fit rounded-full bg-[#F0EDFF] px-3 py-1 text-xs font-semibold text-[#6247AA]">
              Version {versionNumber ?? 1}
            </span>
          </div>

          <div className="flex-shrink-0">
            <ScoreCircle score={feedback.overallScore} />
          </div>
        </div>

        {imageUrl && (
          <div className="gradient-border animate-in fade-in duration-1000">
            <div className="w-full h-full">
              <img
                src={imageUrl}
                alt="resume"
                className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
              />
            </div>
          </div>
        )}
      </Link>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete this resume and its uploaded
              files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Resume"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDialogOpen(true);
        }}
        disabled={isDeleting}
        aria-label="Delete resume"
        title="Delete resume"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ResumeCard;