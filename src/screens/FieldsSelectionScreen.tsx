import React, { useContext, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeContext } from '../context/ResumeContext';
import { useThemeContext } from '../context/ThemeContext';
import { ResumeConfiguration } from '../types/resume';
import { VisibilityTab } from '../components/config/VisibilityTab';
import { FormattingTab } from '../components/config/FormattingTab';

type FieldsSelectionScreenProps = {
  navigation?: any;
};

const FieldsSelectionScreen: React.FC<FieldsSelectionScreenProps> = ({ navigation }) => {
  const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext) as any;
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  // Top Segmented Tab State
  const [activeTab, setActiveTab] = useState<'visibility' | 'formatting'>('visibility');

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
      visibility: resumeData?.visibility || {},
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
    // Active configuration visibility map is authoritative
    if (activeConfig.visibility && activeConfig.visibility[itemId] !== undefined) {
      return activeConfig.visibility[itemId] !== false;
    }
    if (itemObj && itemObj.visible !== undefined) {
      return itemObj.visible !== false;
    }
    return true;
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
    } else if (category === 'system' && newData.skills?.SystemsUsed && newData.skills.SystemsUsed[index]) {
      newData.skills.SystemsUsed[index].visible = newStatus;
    } else if (category === 'profcert' && newData.education?.professionalCertifications && newData.education.professionalCertifications[index]) {
      newData.education.professionalCertifications[index].visible = newStatus;
    } else if (category === 'techcert' && newData.education?.technicalCertifications && newData.education.technicalCertifications[index]) {
      newData.education.technicalCertifications[index].visible = newStatus;
    } else if (category === 'regcert' && newData.education?.regulatoryCertifications && newData.education.regulatoryCertifications[index]) {
      newData.education.regulatoryCertifications[index].visible = newStatus;
    } else if (category === 'artisanal' && newData.education?.artisanalCertifications && newData.education.artisanalCertifications[index]) {
      newData.education.artisanalCertifications[index].visible = newStatus;
    } else if (category === 'tertiary' && newData.education?.tertiary && newData.education.tertiary[index]) {
      newData.education.tertiary[index].visible = newStatus;
    } else if (category === 'experience' && newData.experience && newData.experience[index]) {
      newData.experience[index].visible = newStatus;
    }

    // Ensure personal details collections (addresses and languages) are updated in both 'personal details' and 'personal'
    ['personal details', 'personal'].forEach(pdKey => {
      if (newData[pdKey]) {
        if (category === 'address' && newData[pdKey].addresses && newData[pdKey].addresses[index]) {
          newData[pdKey].addresses[index].visible = newStatus;
        } else if (category === 'language' && newData[pdKey].languages && newData[pdKey].languages[index]) {
          newData[pdKey].languages[index].visible = newStatus;
        }
      }
    });

    // Persist full visibility map onto newData for document previewers
    newData.visibility = newVisMap;

    updateResumeData(newData);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
      {/* Header Banner with Configuration Switcher & Top Segmented Control */}
      <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Editor')}
            activeOpacity={0.7}
          >
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
              selectedTextStyle={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 13 }}
              itemTextStyle={{ fontSize: 13, color: theme.textPrimary }}
              containerStyle={{ backgroundColor: theme.bgSurface, borderColor: theme.border }}
            />
          </View>

          <View style={[styles.typeBadge, { backgroundColor: isMain ? theme.accent : '#3b82f6' }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{isMain ? 'MAIN' : 'TARGETED'}</Text>
          </View>
        </View>

        <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>
          {isMain ? "Main Resume: 100% visible (Locked ALL-ON)" : "Targeted Resume: Customize field visibility and document formatting below"}
        </Text>

        {/* Top Segmented Control Tabs */}
        <View style={[styles.segmentContainer, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'visibility' && { backgroundColor: theme.accent }
            ]}
            onPress={() => setActiveTab('visibility')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="eye-outline"
              size={16}
              color={activeTab === 'visibility' ? '#ffffff' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'visibility' ? '#ffffff' : theme.textSecondary }
              ]}
            >
              Field Visibility
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'formatting' && { backgroundColor: theme.accent }
            ]}
            onPress={() => setActiveTab('formatting')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="palette-outline"
              size={16}
              color={activeTab === 'formatting' ? '#ffffff' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'formatting' ? '#ffffff' : theme.textSecondary }
              ]}
            >
              Formatting & Layout
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Card Container hosting active tab */}
      <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }]}>
        {activeTab === 'visibility' ? (
          <VisibilityTab
            resumeData={resumeData}
            activeConfig={activeConfig}
            isMain={isMain}
            isVisible={isVisible}
            toggleItemVisibility={toggleItemVisibility}
            switchColors={switchColors}
            theme={theme}
          />
        ) : (
          <FormattingTab
            uiSettings={uiSettings}
            updateUiSettings={updateUiSettings}
            theme={theme}
            switchColors={switchColors}
            isMain={isMain}
          />
        )}
      </View>

      {/* Sticky Footer Card adhering to Universal Screen Safety */}
      <View style={[
        styles.footerCard,
        {
          backgroundColor: theme.bgSurface,
          borderColor: theme.border,
          height: 56 + Math.max(insets.bottom, 0),
          paddingBottom: Math.max(insets.bottom, 4)
        }
      ]}>
        <TouchableOpacity
          style={[styles.footerIconBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Hub')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Preview')}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 6 }}>Preview CV</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerIconBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Editor')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Create Targeted Resume Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)} style={{ backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1 }}>
          <Dialog.Title style={{ color: theme.textPrimary }}>Create Targeted Resume</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Targeted Resume Name"
              value={newConfigName}
              onChangeText={setNewConfigName}
              mode="outlined"
              placeholder="e.g. Senior Sales CV"
              textColor={theme.textPrimary}
              style={{ backgroundColor: theme.bgDark }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={theme.textSecondary} onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={theme.accent} onPress={handleCreateTargeted}>Create</Button>
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
  subtitleCentered: { textAlign: 'center', fontSize: 11, marginTop: 6, marginBottom: 8 },
  segmentContainer: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 3 },
  segmentTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentText: { fontSize: 12, fontWeight: 'bold' },
  bodyCard: { flex: 1, marginHorizontal: 8, marginTop: 8, marginBottom: 60, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderTopWidth: 1.5, zIndex: 100, elevation: 10 },
  footerIconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
});

export default FieldsSelectionScreen;
