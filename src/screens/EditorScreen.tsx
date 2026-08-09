import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, Button, Card, IconButton, Portal, Dialog, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResumeContext } from '../context/ResumeContext';
import PersonalDetails from '../components/PersonalDetails';
import Experience from '../components/Experience';
import Education from '../components/Education';
import Skills from '../components/Skills';
import References from '../components/References';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';

const Tab = createMaterialTopTabNavigator();

type EditorScreenProps = {
  route?: { params?: { resumeId?: string } };
  navigation?: any;
};

const EditorScreen: React.FC<EditorScreenProps> = ({ route, navigation }) => {
  const { resumeId } = route?.params ?? {};
  const resumeCtx = useContext(ResumeContext) as any;
  const { resumeData, switchResume, updateResumeData, meta, renameResume, duplicateResume } = resumeCtx;
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  const [renameDialogVisible, setRenameDialogVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');

  useEffect(() => {
    if (resumeId) {
      switchResume(resumeId);
    }
  }, [resumeId]);

  const activeMeta = (meta as any)?.find((m: any) => m.id === resumeId);
  const resumeName = activeMeta ? activeMeta.name : 'Resume Editor';

  return (
    <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('ResumeHome')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{resumeName}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Resume Builder & Edit Mode</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => { setNewName(resumeName); setRenameDialogVisible(true); }}>
              <MaterialCommunityIcons name="pencil" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Edit Personal, Experience, Education, Skills & References</Text>
      </View>

      {/* Body Card Container wrapping Tab.Navigator */}
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
          <Tab.Screen name="Personal" component={PersonalDetails} />
          <Tab.Screen name="Experience" component={Experience} />
          <Tab.Screen name="Education" component={Education} />
          <Tab.Screen name="Skills" component={Skills} />
          <Tab.Screen name="References" component={References} />
        </Tab.Navigator>
      </View>

      {/* Persistent Sticky Footer Card */}
      <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border, height: 56 + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 4) }]}>
        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Preview', { resumeId })} activeOpacity={0.8}>
          <MaterialCommunityIcons name="eye" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Preview CV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub', { openSettings: true })} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog visible={renameDialogVisible} onDismiss={() => setRenameDialogVisible(false)}>
          <Dialog.Title>Rename Resume</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Resume Name" value={newName} onChangeText={setNewName} mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={() => {
                if (newName.trim()) {
                  renameResume(resumeId, newName.trim());
                }
                setRenameDialogVisible(false);
              }}
            >
              Save
            </Button>
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
});

export default EditorScreen;
