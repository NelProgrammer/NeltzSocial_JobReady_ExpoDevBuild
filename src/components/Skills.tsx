// @ts-nocheck
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Card, Text, Button, IconButton, SegmentedButtons } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { SkillItem, ResumeSkills, TechSkillItem, SoftSkillItem, NonAcadCertItem, SystemUsedItem } from '../types/resume';

interface SkillsProps {
    isEditMode?: boolean;
}

const Skills: React.FC<SkillsProps> = ({ isEditMode = true }) => {
    const context = useContext(ResumeContext);
    const resumeData = context?.resumeData;
    const updateResumeData = context?.updateResumeData;

    if (!resumeData || !updateResumeData) return null;

    const skills: ResumeSkills = resumeData.skills || resumeData.Skills || {};

    const getSkillItems = (field: keyof ResumeSkills): any[] => {
        const raw = skills[field];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `sk_${field.toLowerCase()}_${idx}_${Date.now()}`,
                name: line.replace(/^-\s*/, '').trim(),
                visible: true
            }));
        }
        return [];
    };

    const updateSkillItems = (field: keyof ResumeSkills, items: any[]) => {
        if (!isEditMode) return;
        const newSkills = { ...skills, [field]: items };
        updateResumeData({ ...resumeData, skills: newSkills, Skills: newSkills });
    };

    const addSkillItem = (field: keyof ResumeSkills) => {
        if (!isEditMode) return;
        const current = getSkillItems(field);
        let newItem: any = {
            id: `sk_${field.toLowerCase()}_${Date.now()}_${current.length + 1}`,
            name: '',
            visible: true
        };

        if (field === 'Tech') {
            newItem.howObtained = 'Course';
            newItem.yearsInUse = '';
        } else if (field === 'NonAcadCerts') {
            newItem.provider = '';
            newItem.yearObtained = '';
        } else if (field === 'SystemsUsed') {
            newItem.yearsInUse = '';
        }

        updateSkillItems(field, [...current, newItem]);
    };

    const updateItemProperty = (field: keyof ResumeSkills, index: number, prop: string, value: any) => {
        if (!isEditMode) return;
        const current = [...getSkillItems(field)];
        current[index] = { ...current[index], [prop]: value };
        updateSkillItems(field, current);
    };

    const removeItem = (field: keyof ResumeSkills, index: number) => {
        if (!isEditMode) return;
        const current = [...getSkillItems(field)];
        current.splice(index, 1);
        updateSkillItems(field, current);
    };

    const renderTechnicalSkills = () => {
        const items: TechSkillItem[] = getSkillItems('Tech');

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Headline style={styles.sectionHeader}>Technical Skills ({items.length})</Headline>
                    {items.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>ℹ️ No technical skills added yet. Tap "+ Add Technical Skill" to get started.</Text>
                        </View>
                    ) : (
                        items.map((item, index) => (
                            <View key={item.id || index} style={styles.itemBox}>
                                <View style={styles.itemRow}>
                                    <TextInput
                                        label={`Technical Skill #${index + 1}`}
                                        value={item.name || ''}
                                        onChangeText={(text) => updateItemProperty('Tech', index, 'name', text)}
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="e.g. Python, TypeScript, React Native"
                                        editable={isEditMode}
                                    />
                                    {isEditMode && (
                                        <IconButton
                                            icon="delete"
                                            iconColor="#B00020"
                                            size={22}
                                            onPress={() => removeItem('Tech', index)}
                                        />
                                    )}
                                </View>
                                <Text style={styles.subLabel}>How Obtained</Text>
                                <SegmentedButtons
                                    value={item.howObtained || 'Course'}
                                    onValueChange={val => updateItemProperty('Tech', index, 'howObtained', val)}
                                    buttons={[
                                        { label: 'Course', value: 'Course' },
                                        { label: 'Self-Taught', value: 'Self-Taught' },
                                        { label: 'On-the-Job', value: 'On-the-Job' }
                                    ]}
                                    style={styles.segmented}
                                    disabled={!isEditMode}
                                />
                                <TextInput
                                    label="Years in Use"
                                    value={String(item.yearsInUse || '')}
                                    onChangeText={(text) => updateItemProperty('Tech', index, 'yearsInUse', text)}
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="e.g. 4"
                                    editable={isEditMode}
                                />
                            </View>
                        ))
                    )}
                    {isEditMode && (
                        <Button mode="outlined" icon="plus" onPress={() => addSkillItem('Tech')} style={styles.addButton}>
                            Add Technical Skill
                        </Button>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderSoftSkills = () => {
        const items: SoftSkillItem[] = getSkillItems('Soft');

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Headline style={styles.sectionHeader}>Soft / Interpersonal Skills ({items.length})</Headline>
                    {items.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>ℹ️ No soft skills added yet. Tap "+ Add Soft Skill" to get started.</Text>
                        </View>
                    ) : (
                        items.map((item, index) => (
                            <View key={item.id || index} style={styles.itemRow}>
                                <TextInput
                                    label={`Soft Skill #${index + 1}`}
                                    value={item.name || ''}
                                    onChangeText={(text) => updateItemProperty('Soft', index, 'name', text)}
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="e.g. Communication, Leadership, Teamwork"
                                    editable={isEditMode}
                                />
                                {isEditMode && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#B00020"
                                        size={22}
                                        onPress={() => removeItem('Soft', index)}
                                    />
                                )}
                            </View>
                        ))
                    )}
                    {isEditMode && (
                        <Button mode="outlined" icon="plus" onPress={() => addSkillItem('Soft')} style={styles.addButton}>
                            Add Soft Skill
                        </Button>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderNonAcadCerts = () => {
        const items: NonAcadCertItem[] = getSkillItems('NonAcadCerts');

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Headline style={styles.sectionHeader}>Non-Academic Certifications ({items.length})</Headline>
                    {items.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>ℹ️ No non-academic certifications added yet. Tap "+ Add Non-Academic Cert" to get started.</Text>
                        </View>
                    ) : (
                        items.map((item, index) => (
                            <View key={item.id || index} style={styles.itemBox}>
                                <View style={styles.itemRow}>
                                    <TextInput
                                        label={`Certification / Course Name #${index + 1}`}
                                        value={item.name || ''}
                                        onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'name', text)}
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="e.g. First Aid Level 1, Agile Fundamentals"
                                        editable={isEditMode}
                                    />
                                    {isEditMode && (
                                        <IconButton
                                            icon="delete"
                                            iconColor="#B00020"
                                            size={22}
                                            onPress={() => removeItem('NonAcadCerts', index)}
                                        />
                                    )}
                                </View>
                                <TextInput
                                    label="Provider / Platform (Optional)"
                                    value={item.provider || ''}
                                    onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'provider', text)}
                                    style={styles.input}
                                    placeholder="e.g. Udemy, Red Cross, Coursera"
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Year Obtained (Optional)"
                                    value={String(item.yearObtained || '')}
                                    onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'yearObtained', text)}
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="e.g. 2021"
                                    editable={isEditMode}
                                />
                            </View>
                        ))
                    )}
                    {isEditMode && (
                        <Button mode="outlined" icon="plus" onPress={() => addSkillItem('NonAcadCerts')} style={styles.addButton}>
                            Add Non-Academic Cert
                        </Button>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderSystemsUsed = () => {
        const items: SystemUsedItem[] = getSkillItems('SystemsUsed');

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Headline style={styles.sectionHeader}>Systems & Tools Used ({items.length})</Headline>
                    {items.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>ℹ️ No systems or tools added yet. Tap "+ Add System / Tool" to get started.</Text>
                        </View>
                    ) : (
                        items.map((item, index) => (
                            <View key={item.id || index} style={styles.itemBox}>
                                <View style={styles.itemRow}>
                                    <TextInput
                                        label={`System / Software Name #${index + 1}`}
                                        value={item.name || ''}
                                        onChangeText={(text) => updateItemProperty('SystemsUsed', index, 'name', text)}
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="e.g. SAP, Jira, Salesforce, Git"
                                        editable={isEditMode}
                                    />
                                    {isEditMode && (
                                        <IconButton
                                            icon="delete"
                                            iconColor="#B00020"
                                            size={22}
                                            onPress={() => removeItem('SystemsUsed', index)}
                                        />
                                    )}
                                </View>
                                <TextInput
                                    label="Years in Use (Optional)"
                                    value={String(item.yearsInUse || '')}
                                    onChangeText={(text) => updateItemProperty('SystemsUsed', index, 'yearsInUse', text)}
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="e.g. 3"
                                    editable={isEditMode}
                                />
                            </View>
                        ))
                    )}
                    {isEditMode && (
                        <Button mode="outlined" icon="plus" onPress={() => addSkillItem('SystemsUsed')} style={styles.addButton}>
                            Add System / Tool
                        </Button>
                    )}
                </Card.Content>
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
            {renderTechnicalSkills()}
            {renderSoftSkills()}
            {renderNonAcadCerts()}
            {renderSystemsUsed()}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    itemBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#f8fafc' },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    input: { marginBottom: 8, backgroundColor: '#ffffff' },
    subLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    segmented: { marginBottom: 8 },
    addButton: { marginTop: 6, alignSelf: 'flex-start' },
    emptyCard: { padding: 12, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 10 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default Skills;
