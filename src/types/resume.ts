export {
  type CompositeAddressItem,
  type SkillItem,
  type TechSkillItem,
  type SoftSkillItem,
  type NonAcadCertItem,
  type SystemUsedItem,
  type ProfessionalCertItem,
  type TechCertItem,
  type RegulatoryCertItem,
  type ArtisanalCertItem,
  type SubExperienceItem,
  type ExperienceItem,
  type WorkExperience,
  type ResumeSkills,
  type ReferenceItem,
  type ResumeData,
  type PersonalDetails,
  type TertiaryEducationItem,
  type FormattingSettings
} from '@jobready/core';

export type ResumeType = 'source_of_truth' | 'main' | 'targeted';

/** Local Fields Selection overlay. Outstanding: persist Core ConfigurationItem instead. */
export interface ResumeConfiguration {
  id: string;
  primaryResumeId: string;
  profileId: string;
  name: string;
  configType: 'main' | 'targeted';
  visibility?: Record<string, boolean>;
  personalDetailsVisibility?: Record<string, boolean>;
  skillsVisibility?: Record<string, boolean>;
  certificationsVisibility?: Record<string, boolean>;
  experienceVisibility?: Record<string, boolean>;
  educationVisibility?: Record<string, boolean>;
  referencesVisibility?: Record<string, boolean>;
  languagesVisibility?: Record<string, boolean>;
  tertiaryEducationVisibility?: Record<string, boolean>;
  fieldParityIndicators?: Record<string, 'synced' | 'new_master_field' | 'modified_master_field' | 'contradiction'>;
  lastModified: string;
}
