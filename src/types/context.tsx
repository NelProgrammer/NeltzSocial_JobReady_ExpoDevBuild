export interface AuthContextType {
  user: any | null;
  profiles: any[];
  loading: boolean;
  login: (profileId: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  createProfile: (name: string, socialLinks?: any) => Promise<any>;
  quickStart: () => Promise<any>;
  autoUpgradeGuestToLocal: (payload: {
    firstName: string;
    middleName?: string | null;
    surname: string;
    idNumber: string;
    dob: string;
  }) => Promise<any>;
  changeProfilePassword: (profileId: string, newPassword: string) => Promise<void>;
  renameProfile: (profileId: string, newName: string) => Promise<void>;
  backendUrl: string;
  setCustomBackendUrl?: (url: string) => Promise<void>;
}

export interface ResumeContextType {
  resume?: any | null;
  resumeData?: any | null;
  loading: boolean;
  meta?: any[];
  activeResumeId?: string | null;
  setActiveResumeId?: (id: string) => void;
  uiSettings?: any;
  updateUiSettings?: (key: string, value: any) => Promise<void>;
  fetchResume?: () => Promise<void>;
  updateResume?: (data: any) => Promise<void>;
  updateResumeData?: (data: any) => Promise<void>;
  targetedResumes?: any[];
  recruitmentShares?: any[];
  syncUiSettings?: () => Promise<void>;
  toggleTargetedItemSelection?: (sectionName: string, itemId: string, isSelected: boolean) => Promise<void>;
}
