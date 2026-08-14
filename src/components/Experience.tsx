import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Card, IconButton, Divider, Text, Portal, Dialog } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { WorkExperience, SubExperienceItem } from '../types/resume';

interface ExperienceProps {
    isEditMode?: boolean;
}

const MONTHS = [
    { label: 'Jan', value: '01' },
    { label: 'Feb', value: '02' },
    { label: 'Mar', value: '03' },
    { label: 'Apr', value: '04' },
    { label: 'May', value: '05' },
    { label: 'Jun', value: '06' },
    { label: 'Jul', value: '07' },
    { label: 'Aug', value: '08' },
    { label: 'Sep', value: '09' },
    { label: 'Oct', value: '10' },
    { label: 'Nov', value: '11' },
    { label: 'Dec', value: '12' },
];

const Experience: React.FC<ExperienceProps> = ({ isEditMode = true }) => {
    const context = useContext(ResumeContext) as any;
    const resumeData = context?.resumeData;
    const updateResumeData = context?.updateResumeData;
    
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Collapsed by default
    const [expandedSubSections, setExpandedSubSections] = useState<Record<string, boolean>>({});

    // Calendar Modal State
    const [pickerVisible, setPickerVisible] = useState<boolean>(false);
    const [pickerExpIndex, setPickerExpIndex] = useState<number | null>(null);
    const [pickerField, setPickerField] = useState<'Start Date' | 'End Date'>('Start Date');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>('01');

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

    // Open Calendar Picker
    const openCalendarPicker = (index: number, field: 'Start Date' | 'End Date') => {
        if (!isEditMode) return;
        setPickerExpIndex(index);
        setPickerField(field);

        const currentVal = experiences[index]?.[field] || '';
        if (currentVal && currentVal.includes('-')) {
            const parts = currentVal.split('-');
            const yearNum = parseInt(parts[0], 10);
            if (!isNaN(yearNum)) setSelectedYear(yearNum);
            if (parts[1]) setSelectedMonth(parts[1]);
        } else {
            setSelectedYear(new Date().getFullYear());
            setSelectedMonth('01');
        }

        setPickerVisible(true);
    };

    // Save Calendar Picker Date
    const applyCalendarDate = (dateVal: string) => {
        if (pickerExpIndex !== null) {
            updateExpField(pickerExpIndex, pickerField, dateVal);
        }
        setPickerVisible(false);
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
                                    
                                    {/* Interactive Calendar Date Fields */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <TouchableOpacity
                                            style={{ flex: 1, marginRight: 5 }}
                                            onPress={() => openCalendarPicker(index, 'Start Date')}
                                            disabled={!isEditMode}
                                            activeOpacity={0.8}
                                        >
                                            <TextInput
                                                label="Start Date"
                                                value={exp["Start Date"] || ''}
                                                style={styles.input}
                                                left={<TextInput.Icon icon="calendar-start" onPress={() => openCalendarPicker(index, 'Start Date')} />}
                                                right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker(index, 'Start Date')} />}
                                                placeholder="YYYY-MM"
                                                editable={false}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ flex: 1, marginLeft: 5 }}
                                            onPress={() => openCalendarPicker(index, 'End Date')}
                                            disabled={!isEditMode}
                                            activeOpacity={0.8}
                                        >
                                            <TextInput
                                                label="End Date"
                                                value={exp["End Date"] || ''}
                                                style={styles.input}
                                                left={<TextInput.Icon icon="calendar-end" onPress={() => openCalendarPicker(index, 'End Date')} />}
                                                right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker(index, 'End Date')} />}
                                                placeholder="YYYY-MM / Present"
                                                editable={false}
                                                pointerEvents="none"
                                            />
                                        </TouchableOpacity>
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

            {/* Interactive Calendar Month-Year Picker Dialog */}
            <Portal>
                <Dialog visible={pickerVisible} onDismiss={() => setPickerVisible(false)}>
                    <Dialog.Title style={{ textAlign: 'center', fontSize: 16 }}>
                        📅 Select {pickerField}
                    </Dialog.Title>
                    <Dialog.Content>
                        {pickerField === 'End Date' && (
                            <Button
                                mode="contained-tonal"
                                icon="clock-outline"
                                onPress={() => applyCalendarDate('Present')}
                                style={{ marginBottom: 15, backgroundColor: '#e0e7ff' }}
                                labelStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                            >
                                📍 Present (Current Job)
                            </Button>
                        )}

                        {/* Year Selector */}
                        <View style={styles.yearSelectorRow}>
                            <IconButton icon="chevron-left" size={24} onPress={() => setSelectedYear(y => y - 1)} />
                            <Text style={styles.yearText}>{selectedYear}</Text>
                            <IconButton icon="chevron-right" size={24} onPress={() => setSelectedYear(y => y + 1)} />
                        </View>

                        {/* Month Grid */}
                        <Text style={styles.monthGridTitle}>Select Month:</Text>
                        <View style={styles.monthGrid}>
                            {MONTHS.map(m => {
                                const isSelected = selectedMonth === m.value;

                                return (
                                    <TouchableOpacity
                                        key={m.value}
                                        style={[styles.monthItem, isSelected && styles.selectedMonthItem]}
                                        onPress={() => {
                                            setSelectedMonth(m.value);
                                            applyCalendarDate(`${selectedYear}-${m.value}`);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.monthText, isSelected && styles.selectedMonthText]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setPickerVisible(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    emptySubText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
    yearSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    yearText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, color: '#1e293b' },
    monthGridTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textAlign: 'center' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monthItem: { width: '30%', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', marginBottom: 8, backgroundColor: '#f8fafc' },
    selectedMonthItem: { backgroundColor: '#6200EE', borderColor: '#6200EE' },
    monthText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
    selectedMonthText: { color: '#ffffff' }
});

export default Experience;
