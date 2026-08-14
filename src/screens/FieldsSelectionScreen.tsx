import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Switch, IconButton, Button, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeContext } from '../context/ResumeContext';
import { useThemeContext } from '../context/ThemeContext';
import { ResumeConfiguration } from '../types/resume';

type FieldsSelectionScreenProps = {
  navigation?: any;
};

const FieldsSelectionScreen: React.FC<FieldsSelectionScreenProps> = ({ navigation }) => {
  const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext) as any;
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  // Local configurations state (Main Resume + Targeted Resumes)
  const [configurations, setConfigurations] = useState<ResumeConfiguration[]>([
    {
      id: 'main_config',
      primaryResumeId: resumeData?.id || 'master',
      profileId: 'local_user',
      name: 'Main Resume (All Fields)',
      configType: 'main',
      visibility: {},
      certificationsVisibility: {},
      fieldParityIndicators: {},
      lastModified: new Date().toISOString()
    },
    {
      id: 'targeted_sales',
      primaryResumeId: resumeData?.id || 'master',
      profileId: 'local_user',
      name: 'Targeted Application CV',
      configType: 'targeted',
      visibility: {},
      certificationsVisibility: {},
      fieldParityIndicators: {},
      lastModified: new Date().toISOString()
    }
  ]);

  const [selectedConfigId, setSelectedConfigId] = useState<string>('targeted_sales');
  const [createDialogVisible, setCreateDialogVisible] = useState<boolean>(false);
  const [newConfigName, setNewConfigName] = useState<string>('');

  const activeConfig = configurations.find(c => c.id === selectedConfigId) || configurations[0];
  const isMain = activeConfig.configType === 'main';

  // Toggle Colour Scheme Helper
  const scheme = uiSettings?.toggleColorScheme || 'semantic';
  const getSwitchColors = () => {
    if (scheme === 'paper') {
      return { true: '#6200EE', false: '#94a3b8' };
    }
    if (scheme === 'theme') {
      return { true: theme.accent, false: '#374151' };
    }
    // Semantic (default)
    return { true: '#22c55e', false: '#ef4444' };
  };

  const switchColors = getSwitchColors();

  // Dropdown options
  const dropdownData = [
    ...configurations.map(c => ({
      label: c.configType === 'main' ? `📄 ${c.name}` : `🎯 ${c.name}`,
      value: c.id
    })),
    { label: '➕ Create Targeted Resume...', value: '__CREATE__' }
  ];

  const handleDropdownSelect = (item: any) => {
    if (item.value === '__CREATE__') {
      setNewConfigName('');
      setCreateDialogVisible(true);
    } else {
      setSelectedConfigId(item.value);
    }
  };

  const handleCreateTargeted = () => {
    if (!newConfigName.trim()) return;
    const newConfig: ResumeConfiguration = {
      id: `targeted_${Date.now()}`,
      primaryResumeId: resumeData?.id || 'master',
      profileId: 'local_user',
      name: newConfigName.trim(),
      configType: 'targeted',
      visibility: {},
      certificationsVisibility: {},
      fieldParityIndicators: {},
      lastModified: new Date().toISOString()
    };
    setConfigurations([...configurations, newConfig]);
    setSelectedConfigId(newConfig.id);
    setCreateDialogVisible(false);
  };

  const isVisible = (itemId: string, itemObj?: any) => {
    if (isMain) return true; // Main Resume stays 100% visible
    if (itemObj && itemObj.visible !== undefined) {
      return itemObj.visible !== false;
    }
    return activeConfig.visibility?.[itemId] !== false;
  };

  // Synchronized item visibility toggle
  const toggleItemVisibility = (itemId: string, category: string, index: number, itemObj?: any) => {
    if (isMain) return; // Main Resume locked ALL-ON

    const currentVis = isVisible(itemId, itemObj);
    const newStatus = !currentVis;

    // 1. Update local configuration visibility map
    const currentVisMap = activeConfig.visibility || {};
    const newVisMap = { ...currentVisMap, [itemId]: newStatus };
    const updatedConfigs = configurations.map(c => c.id === selectedConfigId ? { ...c, visibility: newVisMap } : c);
    setConfigurations(updatedConfigs);

    // 2. Persist visibility directly into resumeData in ResumeContext
    if (!resumeData || !updateResumeData) return;
    const newData = JSON.parse(JSON.stringify(resumeData));

    if (category === 'references' && newData.References && newData.References[index]) {
      newData.References[index].visible = newStatus;
    } else if (category === 'soft' && newData.skills?.Soft && newData.skills.Soft[index]) {
      newData.skills.Soft[index].visible = newStatus;
    } else if (category === 'tech' && newData.skills?.Tech && newData.skills.Tech[index]) {
      newData.skills.Tech[index].visible = newStatus;
    } else if (category === 'nonacad' && newData.skills?.NonAcadCerts && newData.skills.NonAcadCerts[index]) {
      newData.skills.NonAcadCerts[index].visible = newStatus;
    } else if (category === 'profcert' && newData.education?.professionalCertifications && newData.education.professionalCertifications[index]) {
      newData.education.professionalCertifications[index].visible = newStatus;
    } else if (category === 'techcert' && newData.education?.technicalCertifications && newData.education.technicalCertifications[index]) {
      newData.education.technicalCertifications[index].visible = newStatus;
    } else if (category === 'regcert' && newData.education?.regulatoryCertifications && newData.education.regulatoryCertifications[index]) {
      newData.education.regulatoryCertifications[index].visible = newStatus;
    } else if (category === 'tertiary' && newData.education?.tertiary && newData.education.tertiary[index]) {
      newData.education.tertiary[index].visible = newStatus;
    } else if (category === 'experience' && newData.experience && newData.experience[index]) {
      newData.experience[index].visible = newStatus;
    } else if (category === 'address' && newData.personal?.addresses && newData.personal.addresses[index]) {
      newData.personal.addresses[index].visible = newStatus;
    }

    updateResumeData(newData);
  };

  // Data helpers from Source of Truth
  const pd = resumeData?.["personal details"] || resumeData?.personal || {};
  const names = pd.names || {};
  const contact = pd.contact || {};
  const identity = pd.identity || {};
  const addresses = pd.addresses || [];
  const experiences = resumeData?.experience || [];
  const education = resumeData?.education || {};
  const tertiary = education.tertiary || [];
  const profCerts = education.professionalCertifications || [];
  const techCerts = education.technicalCertifications || [];
  const regCerts = education.regulatoryCertifications || [];
  const skills = resumeData?.skills || resumeData?.Skills || {};
  const techSkills = skills.Tech || [];
  const softSkills = skills.Soft || [];
  const nonAcadCerts = skills.NonAcadCerts || [];
  const references = resumeData?.References || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
      {/* Header Banner with Configuration Dropdown Switcher */}
      <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Editor')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 10, textAlign: 'center', marginBottom: 2 }}>ACTIVE RESUME CONFIGURATION</Text>
            <Dropdown
              style={[styles.headerDropdown, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
              dropdownPosition="auto"
              data={dropdownData}
              labelField="label"
              valueField="value"
              value={selectedConfigId}
              onChange={handleDropdownSelect}
              selectedTextStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}
              itemTextStyle={{ fontSize: 13 }}
            />
          </View>

          <View style={[styles.typeBadge, { backgroundColor: isMain ? theme.accent : '#3b82f6' }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{isMain ? 'MAIN' : 'TARGETED'}</Text>
          </View>
        </View>

        <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>
          {isMain ? "Main Resume: 100% visible (Locked ALL-ON)" : "Targeted Resume: Toggle switches below to hide/show fields for this document"}
        </Text>
      </View>

      {/* Body Card Container */}
      <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }]}>
        <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* Section 1: Personal Details */}
          <Card style={styles.sectionCard}>
            <Card.Title title="Personal Details" left={(props) => <IconButton {...props} icon="account-details" />} />
            <Card.Content>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{names.firstName || 'First Name'} {names.Surname || 'Surname'}</Text>
                  <Text style={styles.itemSub}>{contact.Email || 'No email'} · {contact.Phone || 'No phone'}</Text>
                </View>
                <Switch value={isVisible('pd_names')} onValueChange={() => toggleItemVisibility('pd_names', 'names', 0)} disabled={isMain} trackColor={switchColors} />
              </View>
              {identity.idNumber && (
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>ID Number: {identity.idMask !== false ? `${identity.idNumber.substring(0, 6)} **** ***` : identity.idNumber}</Text>
                  </View>
                  <Switch value={isVisible('pd_id')} onValueChange={() => toggleItemVisibility('pd_id', 'identity', 0)} disabled={isMain} trackColor={switchColors} />
                </View>
              )}
              {addresses.map((addr: any, idx: number) => {
                const itemId = addr.id || `addr_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>📍 {addr.addressType || 'Address'}: {addr.streetAddress || ''}</Text>
                      <Text style={styles.itemSub}>{addr.cityOrTown || ''}, {addr.province || ''}</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, addr)}
                      onValueChange={() => toggleItemVisibility(itemId, 'address', idx, addr)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section 2: Education */}
          <Card style={styles.sectionCard}>
            <Card.Title title="Education & Qualifications" left={(props) => <IconButton {...props} icon="school" />} />
            <Card.Content>
              <Text style={styles.subHeader}>Tertiary Qualifications</Text>
              {tertiary.map((item: any, idx: number) => {
                const itemId = item.id || `tert_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>🎓 {item["Qualification Name"] || 'Qualification'}</Text>
                      <Text style={styles.itemSub}>{item["Institution"]} ({item["Year"]})</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'tertiary', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 8 }} />
              <Text style={styles.subHeader}>Professional Certifications</Text>
              {profCerts.map((item: any, idx: number) => {
                const itemId = item.id || `cert_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>📜 {item.name || 'Certification'}</Text>
                      <Text style={styles.itemSub}>{item.institution} ({item.yearObtained})</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'profcert', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 8 }} />
              <Text style={styles.subHeader}>Technical Certifications</Text>
              {techCerts.map((item: any, idx: number) => {
                const itemId = item.id || `techcert_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>💻 {item.name || 'Technical Cert'}</Text>
                      <Text style={styles.itemSub}>{item.provider || ''} ({item.yearObtained || ''})</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'techcert', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 8 }} />
              <Text style={styles.subHeader}>Regulatory & Statutory Certifications</Text>
              {regCerts.map((item: any, idx: number) => {
                const itemId = item.id || `regcert_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>⚖️ {item.name || 'Regulatory Cert'}</Text>
                      <Text style={styles.itemSub}>{item.issuingBody || ''} ({item.yearObtained || ''})</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'regcert', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section 3: Work Experience */}
          <Card style={styles.sectionCard}>
            <Card.Title title="Work Experience" left={(props) => <IconButton {...props} icon="briefcase" />} />
            <Card.Content>
              {experiences.map((job: any, idx: number) => {
                const itemId = job.id || `exp_${idx}`;
                return (
                  <View key={itemId} style={styles.jobBox}>
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>💼 {job.Role} at {job.Organization}</Text>
                        <Text style={styles.itemSub}>{job["Start Date"]} – {job["End Date"]}</Text>
                      </View>
                      <Switch
                        value={isVisible(itemId, job)}
                        onValueChange={() => toggleItemVisibility(itemId, 'experience', idx, job)}
                        disabled={isMain}
                        trackColor={switchColors}
                      />
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section 4: Skills */}
          <Card style={styles.sectionCard}>
            <Card.Title title="Skills & Tools" left={(props) => <IconButton {...props} icon="tools" />} />
            <Card.Content>
              <Text style={styles.subHeader}>Technical Skills</Text>
              {techSkills.map((item: any, idx: number) => {
                const itemId = item.id || `tech_${idx}`;
                const skillName = typeof item === 'string' ? item : item.name;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>⚡ {skillName}</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'tech', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 8 }} />
              <Text style={styles.subHeader}>Soft Skills</Text>
              {softSkills.map((item: any, idx: number) => {
                const itemId = item.id || `soft_${idx}`;
                const skillName = typeof item === 'string' ? item : item.name;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <Text style={[styles.itemTitle, { flex: 1 }]}>🧠 {skillName}</Text>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'soft', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section 5: References */}
          <Card style={styles.sectionCard}>
            <Card.Title title="References" left={(props) => <IconButton {...props} icon="account-badge" />} />
            <Card.Content>
              {references.map((item: any, idx: number) => {
                const itemId = item.id || `ref_${idx}`;
                return (
                  <View key={itemId} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>👥 {item.name || item.Name}</Text>
                      <Text style={styles.itemSub}>{item.role || item.Role} at {item.company || item.Organization}</Text>
                    </View>
                    <Switch
                      value={isVisible(itemId, item)}
                      onValueChange={() => toggleItemVisibility(itemId, 'references', idx, item)}
                      disabled={isMain}
                      trackColor={switchColors}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* Section 6: Document Output Format Settings */}
          <Card style={[styles.sectionCard, { backgroundColor: '#f8fafc' }]}>
            <Card.Title title="Document Format Settings" left={(props) => <IconButton {...props} icon="format-list-bulleted" />} />
            <Card.Content>
              <View style={styles.itemRow}>
                <Text style={{ fontSize: 13, flex: 1 }}>Technical Skills Format</Text>
                <Button mode="outlined" compact onPress={() => updateUiSettings({ ...uiSettings, TechFormat: uiSettings?.TechFormat === 'comma' ? 'list' : 'comma' })}>
                  {uiSettings?.TechFormat === 'comma' ? 'Comma Paragraph' : 'Bulleted List'}
                </Button>
              </View>
              <View style={styles.itemRow}>
                <Text style={{ fontSize: 13, flex: 1 }}>Soft Skills Format</Text>
                <Button mode="outlined" compact onPress={() => updateUiSettings({ ...uiSettings, SoftFormat: uiSettings?.SoftFormat === 'comma' ? 'list' : 'comma' })}>
                  {uiSettings?.SoftFormat === 'comma' ? 'Comma Paragraph' : 'Bulleted List'}
                </Button>
              </View>
              <View style={styles.itemRow}>
                <Text style={{ fontSize: 13, flex: 1 }}>Responsibilities Format</Text>
                <Button mode="outlined" compact onPress={() => updateUiSettings({ ...uiSettings, RespFormat: uiSettings?.RespFormat === 'comma' ? 'list' : 'comma' })}>
                  {uiSettings?.RespFormat === 'comma' ? 'Comma Paragraph' : 'Bulleted List'}
                </Button>
              </View>
            </Card.Content>
          </Card>

        </ScrollView>
      </View>

      {/* Sticky Footer */}
      <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Preview')} activeOpacity={0.8}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 6 }}>Preview CV</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Editor')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Create Targeted Resume Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create Targeted Resume</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Targeted Resume Name"
              value={newConfigName}
              onChangeText={setNewConfigName}
              mode="outlined"
              placeholder="e.g. Senior Sales CV"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateTargeted}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBanner: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerDropdown: { height: 38, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subtitleCentered: { textAlign: 'center', fontSize: 11, marginTop: 6 },
  bodyCard: { flex: 1, marginHorizontal: 8, marginTop: 8, marginBottom: 60, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionCard: { marginBottom: 12, backgroundColor: '#ffffff' },
  subHeader: { fontWeight: 'bold', fontSize: 13, color: '#475569', marginBottom: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  jobBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#f8fafc' },
  itemTitle: { fontWeight: 'bold', fontSize: 13, color: '#1e293b' },
  itemSub: { fontSize: 11, color: '#64748b' },
  footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderTopWidth: 1.5, zIndex: 100, elevation: 10 },
  footerIconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
});

export default FieldsSelectionScreen;
