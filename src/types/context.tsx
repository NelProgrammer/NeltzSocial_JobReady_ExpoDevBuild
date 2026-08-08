export interface AuthContextType {
  user: any | null;
  profiles: any[];
  loading: boolean;
  login: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (name: string, socialLinks?: any) => Promise<any>;
  deleteProfile: (profileId: string) => Promise<void>;
  quickStart: () => Promise<any>;
  autoUpgradeGuestToLocal: (payload: {
    firstName: string;
    middleName?: string | null;
    surname: string;
    idNumber: string;
    dob: string;
  }) => Promise<any>;
  changeProfilePassword: (profileId: string, newPassword: string) => Promise<void>;
  backendUrl: string;
}

export interface ResumeContextType {
  resume: any | null;
  loading: boolean;
  fetchResume: () => Promise<void>;
  updateResume: (data: any) => Promise<void>;
}
