interface Resume {
  id: string;
  resumePath?: string;
  imagePath?: string;
  resumeUrl?: string;
  resumePublicId?: string;
  imageUrl?: string;
  imagePublicId?: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  versionGroupId?: string;
  versionNumber?: number;
  createdAt?: string;
  feedback: Feedback;
  jobMatchHistory?: JobMatchHistory[];
}

interface JobMatchHistory {
  id: string;
  jobTitle: string;
  jobDescription: string;
  analyzedAt: string;
  analysis: JobMatchAnalysis;
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

interface JobMatchAnalysis {
    matchScore: number;
    summary: string;
    matchingSkills: string[];
    missingSkills: string[];
    matchingKeywords: string[];
    missingKeywords: string[];
    experienceMatch: {
        score: number;
        explanation: string;
    };
    atsCompatibility: {
        score: number;
        tips: string[];
    };
    recommendations: string[];
}

interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  status:
    | "Wishlist"
    | "Applied"
    | "OA / Assessment"
    | "Interview"
    | "Offer"
    | "Rejected";
  appliedDate?: string;
  jobUrl?: string;
  notes?: string;
  resumeId?: string;
  createdAt: string;
  updatedAt: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  nextFollowUpDate?: string;
  statusHistory?: JobApplicationStatusHistory[];
  priority?: "High" | "Medium" | "Low";
  interviewDate?: string;
  interviewTime?: string;
  interviewType?:
    | "Phone"
    | "Video"
    | "On-site"
    | "Technical"
    | "HR"
    | "Other";
  interviewNotes?: string;
  jobType?: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  tags?: string[];
}

interface JobApplicationStatusHistory {
  status: JobApplication["status"];
  date: string;
}