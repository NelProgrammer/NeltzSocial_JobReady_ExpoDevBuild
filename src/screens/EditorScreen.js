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

const Tab = createMaterialTopTabNavigator();

const EditorScreen = ({ route, navigation }) => {
    const { resumeId } = route.params;
    const { resumeData, switchResume, updateResumeData, meta, renameResume, duplicateResume } = useContext(ResumeContext);
    const insets = useSafeAreaInsets();
    
    const [renameDialogVisible, setRenameDialogVisible] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (resumeId) {
            switchResume(resumeId);
        }
    }, [resumeId]);

    useEffect(() => {
        const activeMeta = meta.find(m => m.id === resumeId);
        const resumeName = activeMeta ? activeMeta.name : 'Resume Editor';

        navigation.setOptions({
            title: resumeName,
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton 
                        icon="content-copy" 
                        iconColor="#fff" 
                        size={20} 
                        style={{ margin: 0 }}
                        onPress={() => {
                            Alert.alert('Duplicate CV', 'Create a copy of this Resume?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Copy', onPress: async () => {
                                    const newId = await duplicateResume(resumeId);
                                    if (newId) {
                                        navigation.setParams({ resumeId: newId });
                                    }
                                }}
                            ]);
                        }} 
                    />
                    <IconButton 
                        icon="pencil" 
                        iconColor="#fff" 
                        size={20} 
                        style={{ margin: 0 }}
                        onPress={() => {
                            setNewName(resumeName);
                            setRenameDialogVisible(true);
                        }} 
                    />
                    <IconButton 
                        icon="close" 
                        iconColor="#fff" 
                        size={22} 
                        style={{ margin: 0 }}
                        onPress={() => navigation.goBack()} 
                    />
                </View>
            ),
        });
    }, [navigation, meta, resumeId]);

    const currentLayout = resumeData?.Layout || 'professional';

    const changeLayout = (newLayout) => {
        updateResumeData({ ...resumeData, Layout: newLayout });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textTransform: 'none' },
                    tabForItem: ({ route }) => ({ width: 'auto' }),
                    tabBarIndicatorStyle: { backgroundColor: '#6200ee' }
                }}
            >
                <Tab.Screen name="Personal" component={PersonalDetails} />
                <Tab.Screen name="Experience" component={Experience} />
                <Tab.Screen name="Education" component={Education} />
                <Tab.Screen name="Skills" component={Skills} />
                <Tab.Screen name="References" component={References} />
            </Tab.Navigator>

            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <Button mode="contained" icon="eye" onPress={() => navigation.navigate('Preview', { resumeId })} style={styles.previewBtn} contentStyle={{ height: 50 }}>
                    Preview Resume
                </Button>
            </View>

            <Portal>
                <Dialog visible={renameDialogVisible} onDismiss={() => setRenameDialogVisible(false)}>
                    <Dialog.Title>Rename Resume</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Resume Name"
                            value={newName}
                            onChangeText={setNewName}
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRenameDialogVisible(false)}>Cancel</Button>
                        <Button onPress={() => {
                            if (newName.trim()) {
                                renameResume(resumeId, newName.trim());
                            }
                            setRenameDialogVisible(false);
                        }}>Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomContainer: { backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderColor: '#eee', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    previewBtn: { borderRadius: 8 },
});

export default EditorScreen;
