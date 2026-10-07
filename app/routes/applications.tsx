import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react-router";
import { useNavigate } from "react-router";
import {
  deleteApplication,
  getAllApplications,
  getAllResumes,
  saveApplication,
  updateApplication,
} from "~/lib/resume-db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

const statuses: JobApplication["status"][] = [
  "Wishlist",
  "Applied",
  "OA / Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

const Applications = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    JobApplication["status"] | "All"
  >("All");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "company" | "jobTitle" | "priority"
  >("newest");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState<JobApplication["status"]>("Wishlist");
  const [priority, setPriority] =
    useState<JobApplication["priority"]>("Medium");
  const [appliedDate, setAppliedDate] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [editingApplicationId, setEditingApplicationId] = useState<
    string | null
  >(null);
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterLinkedIn, setRecruiterLinkedIn] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] =
    useState<JobApplication["interviewType"]>("Video");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [jobType, setJobType] =
    useState<JobApplication["jobType"]>("Full-time");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [applicationToDelete, setApplicationToDelete] =
    useState<JobApplication | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 5;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/auth?next=/applications", {
        replace: true,
      });
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [applicationData, resumeData] = await Promise.all([
          getAllApplications(),
          getAllResumes(),
        ]);

        setApplications(
          applicationData.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        setResumes(
          resumeData.sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime(),
          ),
        );
      } catch (error) {
        console.error("Failed to load application data:", error);

        setError("Failed to load job application data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const getResumeLabel = (resume: Resume) => {
    const version = resume.versionNumber ? `V${resume.versionNumber}` : "V1";

    const role = resume.jobTitle || "Untitled Resume";

    const company = resume.companyName ? ` — ${resume.companyName}` : "";

    return `${version} — ${role}${company}`;
  };

  const handleAddApplication = async () => {
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    if (!jobTitle.trim()) {
      setError("Job title is required.");
      return;
    }

    if (!resumeId) {
      setError("Please select the resume version you used.");
      return;
    }

    if (
      recruiterEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recruiterEmail.trim())
    ) {
      setError("Please enter a valid recruiter email address.");
      return;
    }

    if (recruiterLinkedIn.trim()) {
      try {
        const linkedinUrl = new URL(recruiterLinkedIn.trim());

        if (
          linkedinUrl.protocol !== "https:" ||
          !linkedinUrl.hostname.toLowerCase().includes("linkedin.com")
        ) {
          setError("Please enter a valid LinkedIn URL.");
          return;
        }
      } catch {
        setError("Please enter a valid LinkedIn URL.");
        return;
      }
    }

    if (interviewTime && !interviewDate) {
      setError(
        "Please select an interview date when entering an interview time.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const now = new Date().toISOString();

      if (editingApplicationId) {
        const existingApplication = applications.find(
          (application) => application.id === editingApplicationId,
        );

        if (!existingApplication) {
          setError("Application could not be found.");
          return;
        }

        const statusHistory = existingApplication.statusHistory ?? [];

        const hasStatusChanged = existingApplication.status !== status;

        const updatedStatusHistory = hasStatusChanged
          ? [
              ...statusHistory,
              {
                status,
                date: now,
              },
            ]
          : statusHistory;

        const updatedApplication: JobApplication = {
          ...existingApplication,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          status,
          appliedDate: appliedDate || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          jobUrl: jobUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          resumeId,
          statusHistory: updatedStatusHistory,
          updatedAt: now,
          priority,
          recruiterName: recruiterName.trim() || undefined,
          recruiterEmail: recruiterEmail.trim() || undefined,
          recruiterLinkedIn: recruiterLinkedIn.trim() || undefined,
          interviewDate: interviewDate || undefined,
          interviewTime: interviewTime || undefined,
          interviewType: interviewDate ? interviewType : undefined,
          interviewNotes: interviewNotes.trim() || undefined,
          jobType: jobType || undefined,
          tags: tags.length > 0 ? tags : undefined,
        };

        await updateApplication(updatedApplication);

        setApplications((current) =>
          current.map((application) =>
            application.id === editingApplicationId
              ? updatedApplication
              : application,
          ),
        );
      } else {
        const application: JobApplication = {
          id: crypto.randomUUID(),
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          status,
          appliedDate: appliedDate || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          jobUrl: jobUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          resumeId,
          priority,
          statusHistory: [
            {
              status,
              date: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
          recruiterName: recruiterName.trim() || undefined,
          recruiterEmail: recruiterEmail.trim() || undefined,
          recruiterLinkedIn: recruiterLinkedIn.trim() || undefined,
          interviewDate: interviewDate || undefined,
          interviewTime: interviewTime || undefined,
          interviewType: interviewDate ? interviewType : undefined,
          interviewNotes: interviewNotes.trim() || undefined,
          jobType: jobType || undefined,
          tags: tags.length > 0 ? tags : undefined,
        };

        await saveApplication(application);

        setApplications((current) => [application, ...current]);
      }

      setEditingApplicationId(null);
      setCompanyName("");
      setJobTitle("");
      setStatus("Wishlist");
      setAppliedDate("");
      setNextFollowUpDate("");
      setJobUrl("");
      setNotes("");
      setResumeId("");
      setPriority("Medium");
      setRecruiterName("");
      setRecruiterEmail("");
      setRecruiterLinkedIn("");
      setInterviewDate("");
      setInterviewTime("");
      setInterviewType("Video");
      setInterviewNotes("");
      setJobType("Full-time");
      setTags([]);
    } catch (error) {
      console.error("Failed to save application:", error);

      setError(
        editingApplicationId
          ? "Failed to update job application."
          : "Failed to save job application.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportApplications = () => {
    if (applications.length === 0) {
      setError("There are no applications to export.");
      return;
    }

    const escapeCsvValue = (value: unknown) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Company",
      "Job Title",
      "Status",
      "Priority",
      "Job Type",
      "Applied Date",
      "Next Follow-up",
      "Recruiter",
      "Recruiter Email",
      "Recruiter LinkedIn",
      "Interview Date",
      "Interview Time",
      "Interview Type",
      "Interview Notes",
      "Resume Version",
      "Tags",
      "Job URL",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const rows = applications.map((application) => {
      const linkedResume = resumes.find(
        (resume) => resume.id === application.resumeId,
      );

      return [
        application.companyName,
        application.jobTitle,
        application.status,
        application.priority ?? "Medium",
        application.jobType ?? "",
        application.appliedDate ?? "",
        application.nextFollowUpDate ?? "",
        application.recruiterName ?? "",
        application.recruiterEmail ?? "",
        application.recruiterLinkedIn ?? "",
        application.interviewDate ?? "",
        application.interviewTime ?? "",
        application.interviewType ?? "",
        application.interviewNotes ?? "",
        linkedResume ? getResumeLabel(linkedResume) : "",
        application.tags?.join(", ") ?? "",
        application.jobUrl ?? "",
        application.notes ?? "",
        application.createdAt,
        application.updatedAt,
      ];
    });

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `resumind-job-applications-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const getStatusHistory = (
    application: JobApplication,
  ): JobApplicationStatusHistory[] => {
    if (application.statusHistory && application.statusHistory.length > 0) {
      return application.statusHistory;
    }

    return [
      {
        status: application.status,
        date: application.appliedDate || application.createdAt,
      },
    ];
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      setError("");

      await deleteApplication(id);

      setApplications((current) =>
        current.filter((application) => application.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete application:", error);

      setError("Failed to delete job application.");
    }
  };

  const handleEditApplication = (application: JobApplication) => {
    setEditingApplicationId(application.id);
    setCompanyName(application.companyName);
    setJobTitle(application.jobTitle);
    setStatus(application.status);
    setAppliedDate(application.appliedDate || "");
    setNextFollowUpDate(application.nextFollowUpDate || "");
    setJobUrl(application.jobUrl || "");
    setNotes(application.notes || "");
    setResumeId(application.resumeId || "");
    setError("");
    setPriority(application.priority ?? "Medium");
    setRecruiterName(application.recruiterName ?? "");
    setRecruiterEmail(application.recruiterEmail ?? "");
    setRecruiterLinkedIn(application.recruiterLinkedIn ?? "");
    setInterviewDate(application.interviewDate ?? "");
    setInterviewTime(application.interviewTime ?? "");
    setInterviewType(application.interviewType ?? "Video");
    setInterviewNotes(application.interviewNotes ?? "");
    setJobType(application.jobType ?? "Full-time");
    setTags(application.tags ?? []);
    setTagInput("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingApplicationId(null);
    setCompanyName("");
    setJobTitle("");
    setStatus("Wishlist");
    setAppliedDate("");
    setNextFollowUpDate("");
    setJobUrl("");
    setNotes("");
    setResumeId("");
    setPriority("Medium");
    setError("");
    setRecruiterName("");
    setRecruiterEmail("");
    setRecruiterLinkedIn("");
    setInterviewDate("");
    setInterviewTime("");
    setInterviewType("Video");
    setInterviewNotes("");
    setJobType("Full-time");
    setTags([]);
    setTagInput("");
  };

  const getLinkedResume = (application: JobApplication) => {
    if (!application.resumeId) {
      return undefined;
    }

    return resumes.find((resume) => resume.id === application.resumeId);
  };

  const filteredApplications = [...applications]
    .filter((application) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        application.companyName.toLowerCase().includes(query) ||
        application.jobTitle.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "company":
          return a.companyName.localeCompare(b.companyName);

        case "jobTitle":
          return a.jobTitle.localeCompare(b.jobTitle);

        case "priority": {
          const priorityOrder = {
            High: 0,
            Medium: 1,
            Low: 2,
          };

          return (
            priorityOrder[a.priority ?? "Medium"] -
            priorityOrder[b.priority ?? "Medium"]
          );
        }

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage,
  );

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * applicationsPerPage,
    currentPage * applicationsPerPage,
  );

  const totalApplications = applications.length;

  const wishlistCount = applications.filter(
    (application) => application.status === "Wishlist",
  ).length;

  const appliedCount = applications.filter(
    (application) => application.status === "Applied",
  ).length;

  const assessmentCount = applications.filter(
    (application) => application.status === "OA / Assessment",
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status === "Interview",
  ).length;

  const offerCount = applications.filter(
    (application) => application.status === "Offer",
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "Rejected",
  ).length;

  const activeApplications = totalApplications - offerCount - rejectedCount;

  const interviewRate =
    totalApplications > 0
      ? Math.round((interviewCount / totalApplications) * 100)
      : 0;

  const offerRate =
    totalApplications > 0
      ? Math.round((offerCount / totalApplications) * 100)
      : 0;

  const rejectionRate =
    totalApplications > 0
      ? Math.round((rejectedCount / totalApplications) * 100)
      : 0;

  const getFollowUpStatus = (followUpDate?: string) => {
    if (!followUpDate) {
      return {
        label: "Not scheduled",
        classes: "text-gray-400",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUp = new Date(`${followUpDate}T00:00:00`);

    const differenceInDays = Math.round(
      (followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (differenceInDays < 0) {
      return {
        label: "Overdue",
        classes: "text-red-600",
      };
    }

    if (differenceInDays === 0) {
      return {
        label: "Due today",
        classes: "text-amber-600",
      };
    }

    if (differenceInDays === 1) {
      return {
        label: "Due tomorrow",
        classes: "text-amber-600",
      };
    }

    return {
      label: "Upcoming",
      classes: "text-emerald-600",
    };
  };

  const getStatusClasses = (applicationStatus: JobApplication["status"]) => {
    switch (applicationStatus) {
      case "Wishlist":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Applied":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "OA / Assessment":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Interview":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Offer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9FD] px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-80 rounded-lg bg-gray-200" />
            <div className="h-5 w-96 rounded-lg bg-gray-200" />
            <div className="h-56 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FAF9FD] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6247AA]">
              Career Management
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Job Application Tracker
            </h1>

            <p className="mt-3 text-base leading-7 text-gray-500">
              Track your applications, manage your progress, and keep every job
              search detail organized in one place.
            </p>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalApplications}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Wishlist</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {wishlistCount}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">Applied</p>
            <p className="mt-2 text-3xl font-bold text-blue-800">
              {appliedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 shadow-sm">
            <p className="text-sm font-medium text-purple-700">Interviews</p>
            <p className="mt-2 text-3xl font-bold text-purple-800">
              {interviewCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Offers</p>
            <p className="mt-2 text-3xl font-bold text-emerald-800">
              {offerCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-800">
              {rejectedCount}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl w-full border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 w-full">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#6247AA]">
              Application Insights
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Job Search Performance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Understand how your applications are progressing through the
              hiring pipeline.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-h-[150px] rounded-2xl border border-gray-100 bg-[#FAF9FD] p-6">
              <p className="text-sm text-gray-500">Active Applications</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {activeApplications}
              </p>
            </div>

            <div className="min-h-[150px] rounded-2xl border border-gray-100 bg-[#FAF9FD] p-6">
              <p className="text-sm text-gray-500">Interview Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {interviewRate}%
              </p>
            </div>

            <div className="min-h-[150px] rounded-2xl border border-gray-100 bg-[#FAF9FD] p-6">
              <p className="text-sm text-gray-500">Offer Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {offerRate}%
              </p>
            </div>

            <div className="min-h-[150px] rounded-2xl border border-gray-100 bg-[#FAF9FD] p-6">
              <p className="text-sm text-gray-500">Rejection Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {rejectionRate}%
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">
                Application Status Distribution
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                See how your applications are distributed across the hiring
                pipeline.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: "Wishlist", count: wishlistCount },
                { label: "Applied", count: appliedCount },
                { label: "OA / Assessment", count: assessmentCount },
                { label: "Interview", count: interviewCount },
                { label: "Offer", count: offerCount },
                { label: "Rejected", count: rejectedCount },
              ].map((item) => {
                const percentage =
                  totalApplications > 0
                    ? Math.round((item.count / totalApplications) * 100)
                    : 0;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#6247AA] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-[#F8F6FF] to-white px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingApplicationId
                    ? "Edit Application"
                    : "Add Application"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingApplicationId
                    ? "Update your application details and resume version."
                    : "Record a new job application and link the resume version you used."}
                </p>
              </div>

              {editingApplicationId && (
                <span className="w-fit rounded-full bg-[#F0EDFF] px-3 py-1.5 text-xs font-semibold text-[#6247AA]">
                  Editing application
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="company-name"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Company
                </label>

                <input
                  id="company-name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Google"
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="job-title"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Job Title
                </label>

                <input
                  id="job-title"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Software Engineer"
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="application-status"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Status
                </label>

                <select
                  id="application-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as JobApplication["status"])
                  }
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-3 focus:ring-[#6247AA]/10"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Priority
                </label>

                <select
                  id="priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as JobApplication["priority"],
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-3 focus:ring-[#6247AA]/10"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="applied-date"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Applied Date
                </label>

                <input
                  id="applied-date"
                  type="date"
                  value={appliedDate}
                  onChange={(event) => setAppliedDate(event.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="next-follow-up-date"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Next Follow-up
                </label>

                <input
                  id="next-follow-up-date"
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(event) => setNextFollowUpDate(event.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="job-type"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Job Type
                </label>

                <select
                  id="job-type"
                  value={jobType}
                  onChange={(event) =>
                    setJobType(event.target.value as JobApplication["jobType"])
                  }
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="application-tags"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Tags
                </label>

                <div className="flex gap-2">
                  <input
                    id="application-tags"
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();

                        const newTag = tagInput
                          .trim()
                          .replace(/\s+/g, " ")
                          .replace(/\b\w/g, (character) =>
                            character.toUpperCase(),
                          );

                        if (
                          newTag &&
                          !tags.some(
                            (tag) => tag.toLowerCase() === newTag.toLowerCase(),
                          )
                        ) {
                          setTags([...tags, newTag]);
                          setTagInput("");
                        }
                      }
                    }}
                    placeholder="e.g. Remote, Referral, Startup"
                    className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const newTag = tagInput
                        .trim()
                        .replace(/\s+/g, " ")
                        .replace(/\b\w/g, (character) =>
                          character.toUpperCase(),
                        );

                      if (
                        newTag &&
                        !tags.some(
                          (tag) => tag.toLowerCase() === newTag.toLowerCase(),
                        )
                      ) {
                        setTags([...tags, newTag]);
                        setTagInput("");
                      }
                    }}
                    className="h-12 rounded-xl bg-[#6247AA] px-4 text-sm font-semibold text-white transition hover:bg-[#563b99]"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full bg-[#6247AA]/10 px-3 py-1.5 text-xs font-semibold text-[#6247AA]"
                      >
                        {tag}

                        <button
                          type="button"
                          onClick={() =>
                            setTags(
                              tags.filter((currentTag) => currentTag !== tag),
                            )
                          }
                          className="font-bold text-[#6247AA] transition hover:text-red-600"
                          aria-label={`Remove ${tag} tag`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="resume-version"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Resume Version Used
                </label>

                <select
                  id="resume-version"
                  value={resumeId}
                  onChange={(event) => setResumeId(event.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                >
                  <option value="">Select the resume version you used</option>

                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {getResumeLabel(resume)}
                    </option>
                  ))}
                </select>

                {resumes.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No resumes are available yet. Upload a resume first.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="job-url"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Job URL
                </label>

                <input
                  id="job-url"
                  type="url"
                  value={jobUrl}
                  onChange={(event) => setJobUrl(event.target.value)}
                  placeholder="https://company.com/jobs/..."
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recruiterName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Recruiter Name
                  </label>

                  <input
                    id="recruiterName"
                    type="text"
                    value={recruiterName}
                    onChange={(event) => setRecruiterName(event.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-2 focus:ring-[#6247AA]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="recruiterEmail"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Recruiter Email
                  </label>

                  <input
                    id="recruiterEmail"
                    type="email"
                    value={recruiterEmail}
                    onChange={(event) => setRecruiterEmail(event.target.value)}
                    placeholder="e.g. recruiter@company.com"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-2 focus:ring-[#6247AA]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="recruiterLinkedIn"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Recruiter LinkedIn
                </label>

                <input
                  id="recruiterLinkedIn"
                  type="url"
                  value={recruiterLinkedIn}
                  onChange={(event) => setRecruiterLinkedIn(event.target.value)}
                  placeholder="https://linkedin.com/in/recruiter"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-2 focus:ring-[#6247AA]/10"
                />
              </div>

              <div className="md:col-span-2">
                <p className="mb-4 text-sm font-semibold text-gray-800">
                  Interview Details
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="interview-date"
                      className="mb-2.5 block text-sm font-semibold text-gray-800"
                    >
                      Interview Date
                    </label>

                    <input
                      id="interview-date"
                      type="date"
                      value={interviewDate}
                      onChange={(event) => setInterviewDate(event.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="interview-time"
                      className="mb-2.5 block text-sm font-semibold text-gray-800"
                    >
                      Interview Time
                    </label>

                    <input
                      id="interview-time"
                      type="time"
                      value={interviewTime}
                      onChange={(event) => setInterviewTime(event.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="interview-type"
                      className="mb-2.5 block text-sm font-semibold text-gray-800"
                    >
                      Interview Type
                    </label>

                    <select
                      id="interview-type"
                      value={interviewType}
                      onChange={(event) =>
                        setInterviewType(
                          event.target.value as JobApplication["interviewType"],
                        )
                      }
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                    >
                      <option value="Phone">Phone</option>
                      <option value="Video">Video</option>
                      <option value="On-site">On-site</option>
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="interview-notes"
                      className="mb-2.5 block text-sm font-semibold text-gray-800"
                    >
                      Interview Notes
                    </label>

                    <textarea
                      id="interview-notes"
                      value={interviewNotes}
                      onChange={(event) =>
                        setInterviewNotes(event.target.value)
                      }
                      placeholder="Meeting link, preparation topics, interviewer details..."
                      rows={3}
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="application-notes"
                  className="mb-2.5 block text-sm font-semibold text-gray-800"
                >
                  Notes
                </label>

                <textarea
                  id="application-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Interview details, recruiter information, preparation notes..."
                  rows={5}
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={handleAddApplication}
                disabled={isSaving}
                className="primary-button min-w-[160px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? editingApplicationId
                    ? "Updating..."
                    : "Saving..."
                  : editingApplicationId
                    ? "Update Application"
                    : "Add Application"}
              </button>

              {editingApplicationId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredApplications.length}{" "}
                  {filteredApplications.length === 1
                    ? "application"
                    : "applications"}{" "}
                  shown
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportApplications}
                disabled={applications.length === 0}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by company or job title..."
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as JobApplication["status"] | "All",
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
              >
                <option value="All">All Statuses</option>

                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "newest"
                      | "oldest"
                      | "company"
                      | "jobTitle"
                      | "priority",
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#6247AA] focus:ring-4 focus:ring-[#6247AA]/10"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">Company A–Z</option>
                <option value="jobTitle">Job Title A–Z</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDFF] text-2xl text-[#6247AA]">
                  {applications.length === 0 ? "+" : "⌕"}
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {applications.length === 0
                    ? "No applications yet"
                    : "No matching applications"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {applications.length === 0
                    ? "Add your first job application above to start tracking your job search."
                    : "Try changing your search or status filter to find the application you're looking for."}
                </p>

                {applications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                    className="mt-5 rounded-xl bg-[#6247AA] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#53399A]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {paginatedApplications.map((application) => {
                const linkedResume = getLinkedResume(application);

                return (
                  <article
                    key={application.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold tracking-tight text-gray-900">
                            {application.jobTitle}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              application.status,
                            )}`}
                          >
                            {application.status}
                          </span>
                          {application.priority && (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                application.priority === "High"
                                  ? "bg-red-50 text-red-600"
                                  : application.priority === "Low"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {application.priority} Priority
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-base font-medium text-gray-600">
                          {application.companyName}
                        </p>
                      </div>

                      {application.jobUrl && (
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit rounded-xl border border-[#6247AA]/20 bg-[#F8F6FF] px-4 py-2.5 text-sm font-semibold text-[#6247AA] transition hover:bg-[#F0EDFF]"
                        >
                          View Job
                        </a>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-100 py-5 lg:grid-cols-5 lg:gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Applied
                        </p>

                        <p className="mt-1.5 text-sm font-medium text-gray-800">
                          {application.appliedDate || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Job Type
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-gray-800">
                          {application.jobType || "Not specified"}
                        </p>
                      </div>

                      {application.tags && application.tags.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Tags
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {application.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#6247AA]/10 px-2.5 py-1 text-xs font-semibold text-[#6247AA]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Resume Version
                        </p>

                        <p className="mt-1.5 text-sm font-medium text-gray-800">
                          {linkedResume
                            ? getResumeLabel(linkedResume)
                            : "Resume no longer available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Last Updated
                        </p>

                        <p className="mt-1.5 text-sm font-medium text-gray-800">
                          {new Date(application.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Next Follow-up
                        </p>

                        <p className="mt-1.5 text-sm font-medium text-gray-800">
                          {application.nextFollowUpDate || "Not scheduled"}
                        </p>

                        <p
                          className={`mt-1 text-xs font-semibold ${
                            getFollowUpStatus(application.nextFollowUpDate)
                              .classes
                          }`}
                        >
                          {
                            getFollowUpStatus(application.nextFollowUpDate)
                              .label
                          }
                        </p>
                      </div>

                      {application.recruiterName && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Recruiter
                          </p>

                          <p className="mt-1.5 text-sm font-medium text-gray-800">
                            {application.recruiterName}
                          </p>

                          {application.recruiterEmail && (
                            <a
                              href={`mailto:${application.recruiterEmail}`}
                              className="mt-1 block truncate text-xs text-[#6247AA] hover:underline"
                            >
                              {application.recruiterEmail}
                            </a>
                          )}

                          {application.recruiterLinkedIn && (
                            <a
                              href={application.recruiterLinkedIn}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs font-semibold text-[#6247AA] hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {application.interviewDate && (
                      <div className="mt-5 rounded-xl border border-[#6247AA]/10 bg-[#6247AA]/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6247AA]">
                          Interview
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700">
                          <span>
                            <span className="font-semibold">Date:</span>{" "}
                            {application.interviewDate}
                          </span>

                          {application.interviewTime && (
                            <span>
                              <span className="font-semibold">Time:</span>{" "}
                              {application.interviewTime}
                            </span>
                          )}

                          {application.interviewType && (
                            <span>
                              <span className="font-semibold">Type:</span>{" "}
                              {application.interviewType}
                            </span>
                          )}
                        </div>

                        {application.interviewNotes && (
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {application.interviewNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {getStatusHistory(application).length > 0 && (
                      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Application Status
                        </p>

                        <div className="mt-4 space-y-4">
                          {getStatusHistory(application).map(
                            (history, index) => {
                              const isLast =
                                index ===
                                getStatusHistory(application).length - 1;

                              return (
                                <div
                                  key={`${history.date}-${index}`}
                                  className="flex items-start gap-3"
                                >
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`mt-0.5 h-3 w-3 rounded-full ${
                                        isLast ? "bg-[#6247AA]" : "bg-gray-300"
                                      }`}
                                    />

                                    {!isLast && (
                                      <div className="mt-1 h-7 w-px bg-gray-200" />
                                    )}
                                  </div>

                                  <div className="-mt-1">
                                    <p
                                      className={`text-sm font-semibold ${
                                        isLast
                                          ? "text-[#6247AA]"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {history.status}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {new Date(history.date).toLocaleString(
                                        undefined,
                                        {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        },
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {application.notes && (
                      <div className="mt-5 rounded-2xl border border-[#EAE6F7] bg-[#FAF9FD] p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Notes
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {application.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex items-center gap-5 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() => handleEditApplication(application)}
                        className="text-sm font-semibold text-[#6247AA] transition hover:text-[#4f3990] hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplicationToDelete(application)}
                        className="text-sm font-semibold text-red-500 transition hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                      <AlertDialog
                        open={applicationToDelete !== null}
                        onOpenChange={(open) => {
                          if (!open) {
                            setApplicationToDelete(null);
                          }
                        }}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this application?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              This will permanently delete your application for{" "}
                              <span className="font-semibold text-gray-900">
                                {applicationToDelete?.jobTitle}
                              </span>{" "}
                              at{" "}
                              <span className="font-semibold text-gray-900">
                                {applicationToDelete?.companyName}
                              </span>
                              . This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>

                            <AlertDialogAction
                              onClick={async () => {
                                if (!applicationToDelete) {
                                  return;
                                }

                                const id = applicationToDelete.id;

                                await handleDeleteApplication(id);
                                setApplicationToDelete(null);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Application
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();

                          if (currentPage > 1) {
                            setCurrentPage((page) => page - 1);
                          }
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();

                          if (currentPage < totalPages) {
                            setCurrentPage((page) => page + 1);
                          }
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Applications;
