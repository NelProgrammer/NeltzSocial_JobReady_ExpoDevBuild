export interface AuthContextType {
  user: any | null;
  profiles: any[];
  loading: boolean;
  login: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (name: string, socialLinks?: any) => Promise<any>;
  deleteProfile?: (profileId: string) => Promise<void>;
  quickStart?: () => Promise<any>;
  backendUrl?: string;
  updateBackendUrl?: (url: string) => Promise<void>;
  testBackendConnection?: (url?: string) => Promise<{ success: boolean; message: string }>;
  connectProfileToServer?: (profileId: string) => Promise<{ success: boolean; message: string }>;
}

export interface ResumeContextType {
  resume: any | null;
  loading: boolean;
  fetchResume: () => Promise<void>;
  updateResume: (data: any) => Promise<void>;
}
