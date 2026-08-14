import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Card, IconButton, Divider, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { WorkExperience, SubExperienceItem } from '../types/resume';

interface ExperienceProps {
    isEditMode?: boolean;
}

const Experience: React.FC<ExperienceProps> = ({ isEditMode = true }) => {
    const context = useContext(ResumeContext);
    const resumeData = context?.resumeData;
    const updateResumeData = context?.updateResumeData;
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (!resumeData || !updateResumeData) return null;

    const experiences: WorkExperience[] = resumeData.experience || [];

    React.useEffect(() => {
        if (experiences.length === 0 && isEditMode) {
            addExperience();
        }
    }, []);

    const addExperience = () => {
        if (!isEditMode) return;
        const newExp: WorkExperience = {
            id: `exp_${Date.now()}_${experiences.length + 1}`,
            "Start Date": "", "End Date": "", "Organization": "", "Department": "",
            "Role": "", "Key Responsibilities": [], "Reason for Leaving": "",
            "Systems Used": [], "Achievements": [], visible: true
        };
        const newData = { ...resumeData, experience: [...experiences, newExp] };
        updateResumeData(newData);
        setExpandedIndex(experiences.length);
    };

    const removeExperience = (index: number) => {
        if (!isEditMode) return;
        Alert.alert(
            "Remove Job",
            "Are you sure you want to remove this work experience entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        const newExp = [...experiences];
                        newExp.splice(index, 1);
                        updateResumeData({ ...resumeData, experience: newExp });
                        setExpandedIndex(null);
                    }
                }
            ]
        );
    };

    type SubField = 'Key Responsibilities' | 'Achievements' | 'Systems Used';

    const updateExpField = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newExp = [...experiences];
        (newExp[index] as any)[key] = value;
        updateResumeData({ ...resumeData, experience: newExp });
    };

    const getSubList = (exp: WorkExperience, field: SubField, prefix: string): SubExperienceItem[] => {
        const raw = exp[field];
        if (Array.isArray(raw)) return raw as SubExperienceItem[];
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `${prefix}_${exp.id || 'exp'}_${idx}_${Date.now()}`,
                text: line.replace(/^-\s*/, '').trim(),
                name: line.replace(/^-\s*/, '').trim(),
                visible: true
            }));
        }
        return [];
    };

    const updateSubList = (expIndex: number, field: SubField, items: SubExperienceItem[]) => {
        if (!isEditMode) return;
        const newExp = [...experiences];
        (newExp[expIndex] as any)[field] = items;
        updateResumeData({ ...resumeData, experience: newExp });
    };

    const addSubItem = (expIndex: number, field: SubField, prefix: string) => {
        if (!isEditMode) return;
        const exp = experiences[expIndex];
        const current = getSubList(exp, field, prefix);
        const newItem: SubExperienceItem = {
            id: `${prefix}_${exp.id || 'exp'}_${Date.now()}_${current.length + 1}`,
            text: '',
            name: '',
            visible: true
        };
        updateSubList(expIndex, field, [...current, newItem]);
    };

    const updateSubItemText = (expIndex: number, field: SubField, prefix: string, subIndex: number, text: string) => {
        if (!isEditMode) return;
        const exp = experiences[expIndex];
        const current = [...getSubList(exp, field, prefix)];
        current[subIndex] = {
            ...current[subIndex],
            text: text,
            name: text
        };
        updateSubList(expIndex, field, current);
    };

    const removeSubItem = (expIndex: number, field: SubField, prefix: string, subIndex: number) => {
        if (!isEditMode) return;
        const exp = experiences[expIndex];
        const current = [...getSubList(exp, field, prefix)];
        current.splice(subIndex, 1);
        updateSubList(expIndex, field, current);
    };

    const renderSubSection = (expIndex: number, exp: WorkExperience, label: string, field: SubField, prefix: string) => {
        const subItems = getSubList(exp, field, prefix);

        return (
            <View style={{ marginBottom: 14 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333', marginBottom: 6 }}>{label}</Text>
                {subItems.map((item, subIndex) => (
                    <View key={item.id || subIndex} style={styles.subItemRow}>
                        <TextInput
                            label={`${label} #${subIndex + 1}`}
                            value={item.text || item.name || ''}
                            onChangeText={(text) => updateSubItemText(expIndex, field, prefix, subIndex, text)}
                            style={[styles.input, { flex: 1 }]}
                            placeholder={`Describe ${label.toLowerCase()} item...`}
                            editable={isEditMode}
                        />
                        {isEditMode && (
                            <IconButton
                                icon="delete"
                                iconColor="#B00020"
                                size={20}
                                onPress={() => removeSubItem(expIndex, field, prefix, subIndex)}
                            />
                        )}
                    </View>
                ))}
                {isEditMode && (
                    <Button
                        mode="outlined"
                        icon="plus"
                        compact
                        onPress={() => addSubItem(expIndex, field, prefix)}
                        style={styles.subAddBtn}
                    >
                        Add {label} Item
                    </Button>
                )}
            </View>
        );
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 6, paddingTop: 4, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            {experiences.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>ℹ️ No work experience added yet. Tap "+ Add Job Experience" to get started.</Text>
                </View>
            ) : (
                experiences.map((exp, index) => (
                    <Card key={exp.id || index} style={styles.card}>
                        <Card.Title
                            title={exp.Organization || "New Job"}
                            subtitle={exp.Role || "Role"}
                            left={(props) => <IconButton {...props} icon="briefcase" />}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton {...props} icon={expandedIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedIndex(expandedIndex === index ? null : index)} />
                                    {isEditMode && <IconButton {...props} icon="delete" onPress={() => removeExperience(index)} />}
                                </View>
                            )}
                        />

                        {expandedIndex === index && (
                            <Card.Content>
                                <Divider style={{ marginBottom: 10 }} />
                                <TextInput
                                    label="Organization"
                                    value={exp.Organization || ''}
                                    onChangeText={(text) => updateExpField(index, 'Organization', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Role"
                                    value={exp.Role || ''}
                                    onChangeText={(text) => updateExpField(index, 'Role', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Department"
                                    value={exp.Department || ''}
                                    onChangeText={(text) => updateExpField(index, 'Department', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TextInput
                                        label="Start Date"
                                        value={exp["Start Date"] || ''}
                                        onChangeText={(text) => updateExpField(index, 'Start Date', text)}
                                        style={[styles.input, { flex: 1, marginRight: 5 }]}
                                        placeholder="YYYY-MM-DD"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="End Date"
                                        value={exp["End Date"] || ''}
                                        onChangeText={(text) => updateExpField(index, 'End Date', text)}
                                        style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                        placeholder="YYYY-MM-DD"
                                        editable={isEditMode}
                                    />
                                </View>

                                {renderSubSection(index, exp, "Key Responsibilities", "Key Responsibilities", "resp")}
                                {renderSubSection(index, exp, "Key Achievements", "Achievements", "ach")}
                                {renderSubSection(index, exp, "Systems Used", "Systems Used", "sys")}

                                <TextInput
                                    label="Reason for Leaving"
                                    value={exp["Reason for Leaving"] || ''}
                                    onChangeText={(text) => updateExpField(index, 'Reason for Leaving', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                            </Card.Content>
                        )}
                    </Card>
                ))
            )}

            {isEditMode && (
                <Button mode="contained" icon="plus" onPress={addExperience} style={styles.addBtn}>
                    Add Job Experience
                </Button>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    input: { marginBottom: 10, backgroundColor: '#F8F9FA' },
    subItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    subAddBtn: { marginTop: 4, alignSelf: 'flex-start', borderColor: '#6200EE' },
    addBtn: { marginTop: 10, paddingVertical: 6, backgroundColor: '#6200EE', alignSelf: 'flex-start' },
    emptyCard: { padding: 14, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 15 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default Experience;
