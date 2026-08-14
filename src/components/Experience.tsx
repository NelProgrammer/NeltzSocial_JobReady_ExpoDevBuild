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
    const context = useContext(ResumeContext) as any;
    const resumeData = context?.resumeData;
    const updateResumeData = context?.updateResumeData;
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Collapsed by default
    const [expandedSubSections, setExpandedSubSections] = useState<Record<string, boolean>>({}); // Nested sub-sections collapsed by default

    if (!resumeData || !updateResumeData) return null;

    const experiences: WorkExperience[] = resumeData.experience || [];

    const toggleSubSection = (key: string) => {
        setExpandedSubSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

    const getCsvSummary = (items: SubExperienceItem[]) => {
        const texts = items.map(i => (i.text || i.name || '').trim()).filter(Boolean);
        if (texts.length === 0) return 'No items added';
        const joined = texts.join(', ');
        return joined.length > 70 ? `${joined.substring(0, 67)}...` : joined;
    };

    const renderSubSection = (expIndex: number, exp: WorkExperience, label: string, field: SubField, prefix: string, iconName: string) => {
        const subItems = getSubList(exp, field, prefix);
        const subKey = `${expIndex}_${field}`;
        const isSubExpanded = !!expandedSubSections[subKey];
        const csvSummary = getCsvSummary(subItems);

        return (
            <Card style={styles.subCard}>
                <Card.Title
                    title={`${label} (${subItems.length})`}
                    subtitle={`CSV: ${csvSummary}`}
                    subtitleNumberOfLines={2}
                    titleStyle={{ fontSize: 13, fontWeight: 'bold' }}
                    subtitleStyle={{ fontSize: 11, color: '#64748b' }}
                    left={(props) => <IconButton {...props} icon={iconName} size={20} />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={isSubExpanded ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleSubSection(subKey)}
                        />
                    )}
                />
                {isSubExpanded && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {subItems.length === 0 ? (
                            <Text style={styles.emptySubText}>No {label.toLowerCase()} items added yet.</Text>
                        ) : (
                            subItems.map((item, subIndex) => (
                                <View key={item.id || subIndex} style={styles.subItemRow}>
                                    <TextInput
                                        label={`${label} #${subIndex + 1}`}
                                        value={item.text || item.name || ''}
                                        onChangeText={(text) => updateSubItemText(expIndex, field, prefix, subIndex, text)}
                                        style={[styles.input, { flex: 1 }]}
                                        left={<TextInput.Icon icon="format-list-bulleted" />}
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
                            ))
                        )}
                        {isEditMode && (
                            <Button
                                mode="outlined"
                                icon="plus"
                                compact
                                onPress={() => {
                                    addSubItem(expIndex, field, prefix);
                                    setExpandedSubSections(prev => ({ ...prev, [subKey]: true }));
                                }}
                                style={styles.subAddBtn}
                            >
                                Add {label} Item
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
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
                experiences.map((exp, index) => {
                    const isJobExpanded = expandedIndex === index;

                    return (
                        <Card key={exp.id || index} style={styles.card}>
                            <Card.Title
                                title={exp.Organization || "New Job"}
                                subtitle={exp.Role ? `${exp.Role}${exp.Department ? ` (${exp.Department})` : ''}` : "Role & Organization"}
                                left={(props) => <IconButton {...props} icon="briefcase-clock-outline" size={24} />}
                                right={(props) => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <IconButton
                                            {...props}
                                            icon={isJobExpanded ? "chevron-up" : "chevron-down"}
                                            onPress={() => setExpandedIndex(isJobExpanded ? null : index)}
                                        />
                                        {isEditMode && (
                                            <IconButton {...props} icon="delete" onPress={() => removeExperience(index)} />
                                        )}
                                    </View>
                                )}
                            />

                            {isJobExpanded && (
                                <Card.Content>
                                    <Divider style={{ marginBottom: 10 }} />
                                    <TextInput
                                        label="Organization / Company"
                                        value={exp.Organization || ''}
                                        onChangeText={(text) => updateExpField(index, 'Organization', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="domain" />}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Role / Title"
                                        value={exp.Role || ''}
                                        onChangeText={(text) => updateExpField(index, 'Role', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="account-tie" />}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Department"
                                        value={exp.Department || ''}
                                        onChangeText={(text) => updateExpField(index, 'Department', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="sitemap" />}
                                        editable={isEditMode}
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <TextInput
                                            label="Start Date"
                                            value={exp["Start Date"] || ''}
                                            onChangeText={(text) => updateExpField(index, 'Start Date', text)}
                                            style={[styles.input, { flex: 1, marginRight: 5 }]}
                                            left={<TextInput.Icon icon="calendar-start" />}
                                            placeholder="YYYY-MM"
                                            editable={isEditMode}
                                        />
                                        <TextInput
                                            label="End Date"
                                            value={exp["End Date"] || ''}
                                            onChangeText={(text) => updateExpField(index, 'End Date', text)}
                                            style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                            left={<TextInput.Icon icon="calendar-end" />}
                                            placeholder="YYYY-MM / Present"
                                            editable={isEditMode}
                                        />
                                    </View>

                                    {renderSubSection(index, exp, "Key Responsibilities", "Key Responsibilities", "resp", "clipboard-text-outline")}
                                    {renderSubSection(index, exp, "Key Achievements", "Achievements", "ach", "trophy-outline")}
                                    {renderSubSection(index, exp, "Systems & Tools Used", "Systems Used", "sys", "wrench-clock")}

                                    <TextInput
                                        label="Reason for Leaving"
                                        value={exp["Reason for Leaving"] || ''}
                                        onChangeText={(text) => updateExpField(index, 'Reason for Leaving', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="exit-to-app" />}
                                        editable={isEditMode}
                                    />
                                </Card.Content>
                            )}
                        </Card>
                    );
                })
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
    card: { marginBottom: 15, backgroundColor: '#ffffff' },
    subCard: { marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
    input: { marginBottom: 8, backgroundColor: '#ffffff' },
    subItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    subAddBtn: { marginTop: 6, alignSelf: 'flex-start', borderColor: '#6200EE' },
    addBtn: { marginTop: 10, paddingVertical: 4, backgroundColor: '#6200EE', alignSelf: 'flex-start' },
    emptyCard: { padding: 14, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 15 },
    emptyText: { color: '#64748b', fontSize: 13 },
    emptySubText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', marginBottom: 8 }
});

export default Experience;
