import React, { useContext, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, Button, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResumeContext } from '../context/ResumeContext';
import PersonalDetails from '../components/PersonalDetails';
import Education from '../components/Education';
import Experience from '../components/Experience';
import References from '../components/References';
import Skills from '../components/Skills';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';
import { createMockResumeData } from '../testing/testUtils';

const Tab = createMaterialTopTabNavigator();

type EditorScreenProps = {
  route?: { params?: { resumeId?: string } };
  navigation?: any;
};

const EditorScreen: React.FC<EditorScreenProps> = ({ route, navigation }) => {
  const resumeCtx = useContext(ResumeContext) as any;
  const { resumeData, updateResumeData, uiSettings, updateUiSettings } = resumeCtx;
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [settingsDialogVisible, setSettingsDialogVisible] = useState<boolean>(false);

  const toggleColorScheme = uiSettings?.toggleColorScheme || 'semantic';

  // Atomic Rollback Guarantee for Reset Career Data
  const handleResetCareerData = () => {
    Alert.alert(
      "Reset Career Data",
      "Are you sure you want to clear your Source of Truth career data? An empty template will be generated on the spot.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const backupData = JSON.parse(JSON.stringify(resumeData || {}));
            try {
              const emptyTemplate = createMockResumeData({
                id: resumeData?.id || 'source_of_truth',
                personal: { names: { firstName: '', Surname: '' }, contact: { Email: '', Phone: '' }, addresses: [] },
                experience: [],
                education: { tertiary: [], professionalCertifications: [], highschool: {} },
                skills: { Tech: [], Soft: [], NonAcadCerts: [], SystemsUsed: [] },
                References: []
              });
              updateResumeData(emptyTemplate);
              Alert.alert("Success", "Career data reset successfully. Empty template regenerated on the spot.");
              setSettingsDialogVisible(false);
            } catch (err) {
              // ATOMIC ROLLBACK GUARANTEE
              updateResumeData(backupData);
              Alert.alert("Error", "Failed to reset career data. Operation rolled back to preserve existing data.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Career Data</Text>
            <Text style={{ color: isEditMode ? '#10b981' : '#f87171', fontSize: 11, fontWeight: '600' }}>
              {isEditMode ? "📝 Edit Mode — Type fields or manage entries" : "🔒 Read Only Mode — Tap Pencil to unlock inputs"}
            </Text>
          </View>

          {/* Edit Mode Toggle Button (Green = Edit Mode Unlocked / Red = Read Only Locked) */}
          <TouchableOpacity
            style={[
              styles.navBtn,
              {
                backgroundColor: isEditMode ? '#10b981' : '#ef4444',
                borderColor: isEditMode ? '#059669' : '#dc2626'
              }
            ]}
            onPress={() => setIsEditMode(!isEditMode)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={isEditMode ? "pencil" : "pencil-off"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitleCentered, { color: isEditMode ? '#10b981' : '#f87171', fontWeight: 'bold' }]}>
          {isEditMode ? "Edit Mode Active: Form inputs unlocked for typing" : "Read Only Mode Active: Inputs locked. Tap Pencil above to edit"}
        </Text>
      </View>

      {/* Body Card Container wrapping Top Tab Navigator */}
      <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginBottom: 60 + Math.max(insets.bottom, 0) }]}>
        <Tab.Navigator
          screenOptions={{
            tabBarScrollEnabled: true,
            tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'none', color: theme.textPrimary },
            tabBarItemStyle: { width: 'auto', paddingHorizontal: 12 },
            tabBarIndicatorStyle: { backgroundColor: theme.accent, height: 3 },
            tabBarStyle: { backgroundColor: theme.bgDark, borderBottomWidth: 1, borderBottomColor: theme.border },
          }}
        >
          {/* Exact Tab Order: Personal -> Education -> Experience -> References -> Skills */}
          <Tab.Screen name="Personal">
            {() => <PersonalDetails isEditMode={isEditMode} />}
          </Tab.Screen>
          <Tab.Screen name="Education">
            {() => <Education isEditMode={isEditMode} />}
          </Tab.Screen>
          <Tab.Screen name="Experience">
            {() => <Experience isEditMode={isEditMode} />}
          </Tab.Screen>
          <Tab.Screen name="References">
            {() => <References isEditMode={isEditMode} />}
          </Tab.Screen>
          <Tab.Screen name="Skills">
            {() => <Skills isEditMode={isEditMode} />}
          </Tab.Screen>
        </Tab.Navigator>
      </View>

      {/* Persistent Sticky Footer Card */}
      <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('FieldsSelection')} activeOpacity={0.8}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 6 }}>Configure Fields</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setSettingsDialogVisible(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Settings Gear Modal */}
      <Portal>
        <Dialog visible={settingsDialogVisible} onDismiss={() => setSettingsDialogVisible(false)}>
          <Dialog.Title>Resume Builder Settings</Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>Toggle Colour Scheme Preference</Text>
            <RadioButton.Group
              onValueChange={value => updateUiSettings && updateUiSettings({ ...uiSettings, toggleColorScheme: value })}
              value={toggleColorScheme}
            >
              <View style={styles.radioRow}>
                <RadioButton value="semantic" />
                <Text style={{ fontSize: 13 }}>Semantic (Green = ON, Red = OFF)</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="paper" />
                <Text style={{ fontSize: 13 }}>Paper Default (Purple = ON, Grey = OFF)</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="theme" />
                <Text style={{ fontSize: 13 }}>Theme Accent (Accent = ON, Dark Grey = OFF)</Text>
              </View>
            </RadioButton.Group>

            <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 }} />

            <Text style={{ fontWeight: 'bold', marginBottom: 6, color: '#b91c1c' }}>Career Data Management</Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              Clearing Source of Truth career data will regenerate an empty template on the spot with atomic rollback safety.
            </Text>
            <Button mode="contained" buttonColor="#ef4444" textColor="#fff" icon="delete-sweep" onPress={handleResetCareerData}>
              Clear / Reset Career Data
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsDialogVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleCentered: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  bodyCard: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 60,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  footerCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1.5,
    zIndex: 100,
    elevation: 10,
  },
  footerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
});

export default EditorScreen;
