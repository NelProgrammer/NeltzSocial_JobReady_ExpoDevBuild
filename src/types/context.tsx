export interface AuthContextType {
  user: any | null;
  profiles: any[];
  loading: boolean;
  login: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (name: string, socialLinks?: any) => Promise<void>;
}

export interface ResumeContextType {
  resume: any | null;
  loading: boolean;
  fetchResume: () => Promise<void>;
  updateResume: (data: any) => Promise<void>;
}
