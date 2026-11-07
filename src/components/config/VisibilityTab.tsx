import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Switch, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isMetaKey } from '@jobready/core';

const KNOWN_TOP_KEYS = new Set([
  'id', 'visibility', 'personal details', 'personal', 'professional summary', 'summary',
  'professional_summary', 'professionalSummary',
  'experience', 'education', 'skills', 'Skills', 'References', 'references',
  'updatedAt', 'updatedAtMs', 'updated_at', 'updated_at_ms',
  'lastModified', 'lastModifiedAt', 'last_modified', 'last_modified_at',
  'createdAt', 'createdAtMs'
]);

const EDU_TITLES: Record<string, string> = {
  tertiary: 'Tertiary Degrees / Diplomas',
  artisanalCertifications: 'Artisanal & Trade Test (Red Seal)',
  professionalCertifications: 'Professional Certifications',
  technicalCertifications: 'Technical Certifications',
  regulatoryCertifications: 'Regulatory Certifications',
};

function humanizeKey(key: string): string {
  if (EDU_TITLES[key]) return EDU_TITLES[key];
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function flattenEduLists(node: any, path: string[] = []): Array<{ key: string; path: string[]; items: any[] }> {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) {
    return path.length ? [{ key: path[path.length - 1], path, items: node }] : [];
  }
  const out: Array<{ key: string; path: string[]; items: any[] }> = [];
  for (const [childKey, childVal] of Object.entries(node)) {
    if (!childKey || childKey.startsWith('__') || childKey === 'highschool') continue;
    if (Array.isArray(childVal)) out.push({ key: childKey, path: [...path, childKey], items: childVal });
    else if (childVal && typeof childVal === 'object') out.push(...flattenEduLists(childVal, [...path, childKey]));
  }
  return out;
}

function itemLabel(item: any, fallback: string): string {
  if (item == null) return fallback;
  if (typeof item === 'string') return item;
  return item.name || item['Qualification Name'] || item.trade || item.Role || item.role || fallback;
}

interface VisibilityTabProps {
  resumeData: any;
  activeConfig: any;
  isMain: boolean;
  isVisible: (itemId: string, itemObj?: any) => boolean;
  toggleItemVisibility: (itemId: string, category: string, index: number, itemObj?: any) => void;
  switchColors: { true: string; false: string };
  theme: any;
}

export const VisibilityTab: React.FC<VisibilityTabProps> = ({
  resumeData,
  activeConfig,
  isMain,
  isVisible,
  toggleItemVisibility,
  switchColors,
  theme,
}) => {
  // Accordion expand states (collapsed by default for clean UX)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: false,
    education: false,
    experience: false,
    skills: false,
    references: false,
  });

  // Level 2 sub-accordions for addresses & jobs
  const [expandedSubItems, setExpandedSubItems] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSubItem = (id: string) => {
    setExpandedSubItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Source of truth data
  const pd = resumeData?.["personal details"] || resumeData?.personal || {};
  const names = pd.names || {};
  const contact = pd.contact || {};
  const identity = pd.identity || {};
  const demographics = pd.demographics || {};
  const licensing = pd.licensing || {};
  const addresses = pd.addresses || [];
  const languages = pd.languages || [];
  const experiences = resumeData?.experience || [];
  const education = resumeData?.education || {};
  const highschool = education.highschool || {};
  const eduLists = flattenEduLists(education);
  const skills = resumeData?.skills || resumeData?.Skills || {};
  const skillBuckets = Object.entries(skills).filter(([key]) => key && !key.startsWith('__'));
  const references = resumeData?.References || resumeData?.references || [];
  const extraSections = Object.entries(resumeData || {}).filter(([key]) => (
    !KNOWN_TOP_KEYS.has(key) && !isMetaKey(key)
  ));
  const professionalSummary = String(
    resumeData?.["professional summary"] || resumeData?.professional_summary || resumeData?.summary || ''
  ).trim();

  return (
    <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* 1. Personal Details Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="👤 Personal Details"
          subtitle={`${names.firstName || 'Names'} · ${contact.Email ? 'Contact' : 'No Contact'} · ${addresses.length} Address(es)`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="account-details" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.personal ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('personal')}
            />
          )}
        />
        {expandedSections.personal && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />

            {/* Sub-group A: Names */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>👤 Names Visibility</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>First Name ({names.firstName || 'N/A'})</Text>
                <Switch value={isVisible('pd_name_first')} onValueChange={() => toggleItemVisibility('pd_name_first', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Middle Name ({names.middleName || names.MiddleName || 'N/A'})</Text>
                <Switch value={isVisible('pd_name_middle')} onValueChange={() => toggleItemVisibility('pd_name_middle', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Maiden Name ({names.MaidenName || 'N/A'})</Text>
                <Switch value={isVisible('pd_name_maiden')} onValueChange={() => toggleItemVisibility('pd_name_maiden', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Surname ({names.Surname || 'N/A'})</Text>
                <Switch value={isVisible('pd_name_surname')} onValueChange={() => toggleItemVisibility('pd_name_surname', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
            </View>

            {/* Sub-group B: Contact Details */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>✉️ Contact Channels</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Email Address ({contact.Email || 'N/A'})</Text>
                <Switch value={isVisible('pd_contact_email')} onValueChange={() => toggleItemVisibility('pd_contact_email', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Mobile Phone ({contact.Phone || 'N/A'})</Text>
                <Switch value={isVisible('pd_contact_phone')} onValueChange={() => toggleItemVisibility('pd_contact_phone', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Alternative Phone ({contact.AltPhone || contact.AlternativePhone || 'N/A'})</Text>
                <Switch value={isVisible('pd_contact_alt_phone')} onValueChange={() => toggleItemVisibility('pd_contact_alt_phone', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>LinkedIn Profile ({contact.LinkedIn || 'N/A'})</Text>
                <Switch value={isVisible('pd_contact_linkedin')} onValueChange={() => toggleItemVisibility('pd_contact_linkedin', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Portfolio / Website ({contact.Website || contact.Portfolio || 'N/A'})</Text>
                <Switch value={isVisible('pd_contact_website')} onValueChange={() => toggleItemVisibility('pd_contact_website', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
            </View>

            {/* Sub-group C: Individual Addresses (Accordion per Address) */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>📍 Addresses ({addresses.length})</Text>
              {addresses.length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic' }}>No addresses configured in Career Data.</Text>
              ) : (
                addresses.map((addr: any, index: number) => {
                  const addrId = addr.id || `addr_${index}`;
                  const isExpanded = !!expandedSubItems[addrId];
                  const summary = addr.streetName
                    ? `${addr.streetNumber || ''} ${addr.streetName}, ${addr.suburbOrTownship || addr.cityOrTown || ''}`
                    : (addr.buildingName ? `${addr.unitOrFlatNo || ''} ${addr.buildingName}` : (addr.suburbOrTownship || addr.cityOrTown || 'Address entry'));

                  return (
                    <View key={addrId} style={[styles.nestedItemBox, { borderColor: theme.border, backgroundColor: theme.bgSurface }]}>
                      <View style={styles.nestedHeaderRow}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleSubItem(addrId)} activeOpacity={0.7}>
                          <Text style={[styles.nestedItemTitle, { color: theme.textPrimary }]}>
                            {addr.addressType || 'Physical Address'} #{index + 1}
                          </Text>
                          <Text style={[styles.nestedItemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {summary}
                          </Text>
                        </TouchableOpacity>
                        <IconButton
                          icon={isExpanded ? "chevron-up" : "chevron-down"}
                          iconColor={theme.textSecondary}
                          size={18}
                          onPress={() => toggleSubItem(addrId)}
                        />
                        <Switch
                          value={isVisible(`pd_addr_${index}`, addr)}
                          onValueChange={() => toggleItemVisibility(`pd_addr_${index}`, 'address', index, addr)}
                          disabled={isMain}
                          trackColor={switchColors}
                        />
                      </View>

                      {isExpanded && (
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                          <View style={styles.itemRow}>
                            <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Show Stand / Erf Number</Text>
                            <Switch
                              value={isVisible(`pd_addr_stand_${index}`)}
                              onValueChange={() => toggleItemVisibility(`pd_addr_stand_${index}`, 'pd', index)}
                              disabled={isMain}
                              trackColor={switchColors}
                            />
                          </View>
                          <View style={styles.itemRow}>
                            <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Mask Street / House / Stand No.</Text>
                            <Switch
                              value={isVisible(`pd_addr_mask_${index}`)}
                              onValueChange={() => toggleItemVisibility(`pd_addr_mask_${index}`, 'pd', index)}
                              disabled={false}
                              trackColor={switchColors}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Sub-group D: Identity & Demographics */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>🪪 Identity & Demographics</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>ID / Passport Number</Text>
                <Switch value={isVisible('pd_identity_number')} onValueChange={() => toggleItemVisibility('pd_identity_number', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Mask ID Number (e.g. 950101 **** 088)</Text>
                <Switch value={isVisible('pd_identity_mask')} onValueChange={() => toggleItemVisibility('pd_identity_mask', 'pd', 0)} disabled={false} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Date of Birth</Text>
                <Switch value={isVisible('pd_identity_dob')} onValueChange={() => toggleItemVisibility('pd_identity_dob', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Nationality ({demographics.Nationality || 'N/A'})</Text>
                <Switch value={isVisible('pd_identity_nationality')} onValueChange={() => toggleItemVisibility('pd_identity_nationality', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Gender ({demographics.Gender || 'N/A'})</Text>
                <Switch value={isVisible('pd_identity_gender')} onValueChange={() => toggleItemVisibility('pd_identity_gender', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Race / EE Equity ({demographics.Race || 'N/A'})</Text>
                <Switch value={isVisible('pd_identity_race')} onValueChange={() => toggleItemVisibility('pd_identity_race', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Marital Status ({demographics.MaritalStatus || 'N/A'})</Text>
                <Switch value={isVisible('pd_identity_marital')} onValueChange={() => toggleItemVisibility('pd_identity_marital', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Criminal Record Clearance</Text>
                <Switch value={isVisible('pd_identity_criminal')} onValueChange={() => toggleItemVisibility('pd_identity_criminal', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
            </View>

            {/* Sub-group E: Driving & Licensing */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>🚗 Driving & Licensing</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Driver's License ({licensing.Drivers || 'None'})</Text>
                <Switch value={isVisible('pd_license_drivers')} onValueChange={() => toggleItemVisibility('pd_license_drivers', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Professional Driving Permit (PrDP)</Text>
                <Switch value={isVisible('pd_license_prdp')} onValueChange={() => toggleItemVisibility('pd_license_prdp', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Own Reliable Vehicle</Text>
                <Switch value={isVisible('pd_license_vehicle')} onValueChange={() => toggleItemVisibility('pd_license_vehicle', 'pd', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
            </View>

            {/* Sub-group F: Languages */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>🗣️ Languages ({languages.length})</Text>
              {languages.length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic' }}>No languages configured.</Text>
              ) : (
                languages.map((lang: any, index: number) => (
                  <View key={`lang_${index}`} style={styles.itemRow}>
                    <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>{(lang.Language === 'Other' ? (lang.customLanguage || 'Other') : lang.Language) || `Language #${index + 1}`} ({lang.proficiency || 'Competency'})</Text>
                    <Switch value={isVisible(`lang_${index}`, lang)} onValueChange={() => toggleItemVisibility(`lang_${index}`, 'language', index, lang)} disabled={isMain} trackColor={switchColors} />
                  </View>
                ))
              )}
            </View>
          </Card.Content>
        )}
      </Card>

      {/* 2. Professional Summary Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="📝 Professional Summary"
          subtitle={professionalSummary ? professionalSummary : 'No summary added'}
          subtitleNumberOfLines={2}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="text-box-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.summary ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('summary')}
            />
          )}
        />
        {expandedSections.summary && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />
            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Display Executive Summary in Document</Text>
              <Switch value={isVisible('summary_visibility')} onValueChange={() => toggleItemVisibility('summary_visibility', 'summary', 0)} disabled={isMain} trackColor={switchColors} />
            </View>
          </Card.Content>
        )}
      </Card>

      {/* 3. Education & Certifications Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🎓 Education & Qualifications"
          subtitle={`Matric · ${eduLists.length} qualification list(s)`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="school-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.education ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('education')}
            />
          )}
        />
        {expandedSections.education && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />

            {/* High School */}
            <View style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
              <Text style={[styles.subGroupHeader, { color: theme.accent }]}>🏫 Secondary School</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Matric / High School ({highschool["Province Department"] || 'High School'})</Text>
                <Switch value={isVisible('edu_highschool', highschool)} onValueChange={() => toggleItemVisibility('edu_highschool', 'highschool', 0, highschool)} disabled={isMain} trackColor={switchColors} />
              </View>
            </View>

            {eduLists.map((list) => (
              <View key={list.path.join('.')} style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                <Text style={[styles.subGroupHeader, { color: theme.accent }]}>{humanizeKey(list.key)} ({list.items.length})</Text>
                {list.items.length === 0 ? (
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic' }}>No items configured.</Text>
                ) : (
                  list.items.map((item: any, index: number) => (
                    <View key={`${list.path.join('.')}-${item?.id || index}`} style={styles.itemRow}>
                      <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>{itemLabel(item, `${humanizeKey(list.key)} #${index + 1}`)}</Text>
                      <Switch
                        value={isVisible(`edu_${list.key}_${index}`, item)}
                        onValueChange={() => toggleItemVisibility(`edu_${list.key}_${index}`, `edu:${list.path.join('.')}`, index, item)}
                        disabled={isMain}
                        trackColor={switchColors}
                      />
                    </View>
                  ))
                )}
              </View>
            ))}
          </Card.Content>
        )}
      </Card>

      {/* 4. Work Experience Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="💼 Work Experience"
          subtitle={`${experiences.length} Position(s) recorded`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="briefcase-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.experience ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('experience')}
            />
          )}
        />
        {expandedSections.experience && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />
            {experiences.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic' }}>No work experience entries configured.</Text>
            ) : (
              experiences.map((job: any, index: number) => {
                const jobId = job.id || `exp_${index}`;
                const isExpanded = !!expandedSubItems[jobId];

                return (
                  <View key={jobId} style={[styles.nestedItemBox, { borderColor: theme.border, backgroundColor: theme.bgDark }]}>
                    <View style={styles.nestedHeaderRow}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleSubItem(jobId)} activeOpacity={0.7}>
                        <Text style={[styles.nestedItemTitle, { color: theme.textPrimary }]}>
                          {job.Role || `Position #${index + 1}`}
                        </Text>
                        <Text style={[styles.nestedItemSub, { color: theme.textSecondary }]}>
                          {job.Organization ? `${job.Organization} · ` : ''}{job["Start Date"] || ''} - {job["End Date"] || 'Present'}
                        </Text>
                      </TouchableOpacity>
                      <IconButton
                        icon={isExpanded ? "chevron-up" : "chevron-down"}
                        iconColor={theme.textSecondary}
                        size={18}
                        onPress={() => toggleSubItem(jobId)}
                      />
                      <Switch
                        value={isVisible(`exp_${index}`, job)}
                        onValueChange={() => toggleItemVisibility(`exp_${index}`, 'experience', index, job)}
                        disabled={isMain}
                        trackColor={switchColors}
                      />
                    </View>

                    {isExpanded && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <View style={styles.itemRow}>
                          <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Key Responsibilities</Text>
                          <Switch
                            value={isVisible(`exp_resp_${index}`)}
                            onValueChange={() => toggleItemVisibility(`exp_resp_${index}`, 'experience_sub', index)}
                            disabled={isMain}
                            trackColor={switchColors}
                          />
                        </View>
                        <View style={styles.itemRow}>
                          <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Achievements</Text>
                          <Switch
                            value={isVisible(`exp_ach_${index}`)}
                            onValueChange={() => toggleItemVisibility(`exp_ach_${index}`, 'experience_sub', index)}
                            disabled={isMain}
                            trackColor={switchColors}
                          />
                        </View>
                        <View style={styles.itemRow}>
                          <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Systems Used</Text>
                          <Switch
                            value={isVisible(`exp_sys_${index}`)}
                            onValueChange={() => toggleItemVisibility(`exp_sys_${index}`, 'experience_sub', index)}
                            disabled={isMain}
                            trackColor={switchColors}
                          />
                        </View>
                        <View style={styles.itemRow}>
                          <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Reason for Leaving</Text>
                          <Switch
                            value={isVisible(`exp_reason_${index}`)}
                            onValueChange={() => toggleItemVisibility(`exp_reason_${index}`, 'experience_sub', index)}
                            disabled={isMain}
                            trackColor={switchColors}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Card.Content>
        )}
      </Card>

      {/* 5. Skills & Systems Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🛠️ Skills & Competencies"
          subtitle={`${skillBuckets.length} skill bucket(s)`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="tools" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.skills ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('skills')}
            />
          )}
        />
        {expandedSections.skills && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />

            {skillBuckets.map(([key, val]) => {
              const items = Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : []);
              return (
                <View key={`skill-bucket-${key}`} style={[styles.subGroupCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                  <Text style={[styles.subGroupHeader, { color: theme.accent }]}>{humanizeKey(key)} ({items.length})</Text>
                  {items.map((skill: any, index: number) => (
                    <View key={skill?.id || `${key}_${index}`} style={styles.itemRow}>
                      <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>{itemLabel(skill, `${humanizeKey(key)} #${index + 1}`)}</Text>
                      <Switch
                        value={isVisible(`skill_${key}_${index}`, typeof skill === 'object' ? skill : undefined)}
                        onValueChange={() => toggleItemVisibility(`skill_${key}_${index}`, `skill:${key}`, index, typeof skill === 'object' ? skill : undefined)}
                        disabled={isMain}
                        trackColor={switchColors}
                      />
                    </View>
                  ))}
                </View>
              );
            })}
          </Card.Content>
        )}
      </Card>

      {/* 6. References Accordion */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="👥 References"
          subtitle={`${references.length} Reference(s) configured`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="account-supervisor-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.references ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('references')}
            />
          )}
        />
        {expandedSections.references && (
          <Card.Content>
            <Divider style={{ marginBottom: 12, backgroundColor: theme.border }} />
            {references.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: 'italic' }}>No references configured.</Text>
            ) : (
              references.map((ref: any, index: number) => {
                const refId = ref.id || `ref_${index}`;
                const isExpanded = !!expandedSubItems[refId];

                return (
                  <View key={`ref-vis-${refId}-${index}`} style={[styles.nestedItemBox, { borderColor: theme.border, backgroundColor: theme.bgDark }]}>
                    <View style={styles.nestedHeaderRow}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleSubItem(refId)} activeOpacity={0.7}>
                        <Text style={[styles.nestedItemTitle, { color: theme.textPrimary }]}>
                          {ref.name || ref.Name || `Reference #${index + 1}`}
                        </Text>
                        <Text style={[styles.nestedItemSub, { color: theme.textSecondary }]}>
                          {ref.role || ref.Role ? `${ref.role || ref.Role} · ` : ''}{ref.organization || ref.Organization || ref.company || ''}
                        </Text>
                      </TouchableOpacity>
                      <IconButton
                        icon={isExpanded ? "chevron-up" : "chevron-down"}
                        iconColor={theme.textSecondary}
                        size={18}
                        onPress={() => toggleSubItem(refId)}
                      />
                      <Switch
                        value={isVisible(`ref_${index}`, ref)}
                        onValueChange={() => toggleItemVisibility(`ref_${index}`, 'references', index, ref)}
                        disabled={isMain}
                        trackColor={switchColors}
                      />
                    </View>

                    {isExpanded && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <View style={styles.itemRow}>
                          <Text style={[styles.itemSubLabel, { color: theme.textSecondary }]}>Display Direct Contact Numbers / Email</Text>
                          <Switch
                            value={isVisible(`ref_contact_${index}`)}
                            onValueChange={() => toggleItemVisibility(`ref_contact_${index}`, 'ref_contact', index)}
                            disabled={isMain}
                            trackColor={switchColors}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Card.Content>
        )}
      </Card>

      {extraSections.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Card.Title
            title="➕ Additional Sections"
            subtitle={`${extraSections.length} extra top-level section(s)`}
            titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
            subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
            left={(props) => <IconButton {...props} icon="plus-box-outline" iconColor={theme.accent} />}
            right={(props) => (
              <IconButton
                {...props}
                icon={expandedSections.extras ? "chevron-up" : "chevron-down"}
                iconColor={theme.textSecondary}
                onPress={() => toggleSection('extras')}
              />
            )}
          />
          {expandedSections.extras && extraSections.map(([key]) => (
            <Card.Content key={`extra-${key}`}>
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>{humanizeKey(key)}</Text>
                <Switch
                  value={isVisible(`section_${key}`)}
                  onValueChange={() => toggleItemVisibility(`section_${key}`, 'extra_section', 0)}
                  disabled={isMain}
                  trackColor={switchColors}
                />
              </View>
            </Card.Content>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 11 },
  subGroupCard: { padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
  subGroupHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  itemLabel: { fontSize: 12, fontWeight: '500', flex: 1, marginRight: 8 },
  itemSubLabel: { fontSize: 11, flex: 1, marginRight: 8 },
  nestedItemBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  nestedHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nestedItemTitle: { fontSize: 13, fontWeight: 'bold' },
  nestedItemSub: { fontSize: 11 },
});
