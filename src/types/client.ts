export interface TrackedJob {
  id: string;
  company: string;
  role: string;
  status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date?: string;
  job_url?: string;
  tailored_resume_url?: string;
  createdAt: string;
}

export interface PrepTask {
  id: string;
  label: string;
  done: boolean;
  points: number;
}

export interface StarLog {
  id: string;
  company: string;
  position: string;
  date: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface AtsScanResult {
  score: number;
  level: string;
  matched: string[];
  missing: string[];
  recommendations: string[];
}

export interface InterviewFeedback {
  score: number;
  badge: string;
  passedArgs: string[];
  suggestions: string;
}
