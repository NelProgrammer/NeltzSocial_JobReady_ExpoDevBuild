// @ts-nocheck
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Card, Switch, Text, Button, IconButton, Divider } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Skills = () => {
    const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext);

    if (!resumeData) return null;

    const skills = resumeData.skills || {};

    // Helper to normalize multi-item array or legacy bullet string
    const getSkillItems = (field) => {
        const raw = skills[field];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `sk_${field.toLowerCase()}_${idx}_${Date.now()}`,
                name: line.replace(/^-\s*/, '').trim(),
                proficiency: 'Intermediate'
            }));
        }
        return [];
    };

    const updateSkillItems = (field, items) => {
        const newSkills = { ...skills, [field]: items };
        updateResumeData({ ...resumeData, skills: newSkills });
    };

    const addSkillItem = (field) => {
        const current = getSkillItems(field);
        const newItem = {
            id: `sk_${field.toLowerCase()}_${Date.now()}`,
            name: '',
            proficiency: 'Intermediate'
        };
        updateSkillItems(field, [...current, newItem]);
    };

    const updateItemProperty = (field, index, prop, value) => {
        const current = [...getSkillItems(field)];
        current[index] = { ...current[index], [prop]: value };
        updateSkillItems(field, current);
    };

    const removeItem = (field, index) => {
        const current = [...getSkillItems(field)];
        current.splice(index, 1);
        updateSkillItems(field, current);
    };

    const renderSkillSection = (title, field, formatSettingKey) => {
        const items = getSkillItems(field);

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Headline style={styles.sectionHeader}>{title}</Headline>

                    {items.map((item, index) => (
                        <View key={item.id || index} style={styles.itemRow}>
                            <TextInput
                                label={`Skill Name #${index + 1}`}
                                value={item.name || ''}
                                onChangeText={(text) => updateItemProperty(field, index, 'name', text)}
                                style={[styles.input, { flex: 1 }]}
                                placeholder="e.g. Python, Leadership, PMP"
                            />
                            <IconButton
                                icon="delete"
                                iconColor="#B00020"
                                size={22}
                                onPress={() => removeItem(field, index)}
                            />
                        </View>
                    ))}

                    <Button
                        mode="outlined"
                        icon="plus"
                        onPress={() => addSkillItem(field)}
                        style={styles.addButton}
                    >
                        Add {title} Item
                    </Button>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format {title} as Bulleted List?</Text>
                        <Switch
                            value={uiSettings[formatSettingKey] !== 'comma'}
                            onValueChange={(val) => updateUiSettings(formatSettingKey, val ? 'list' : 'comma')}
                        />
                    </View>
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
            {renderSkillSection("Technical Skills", "Tech", "TechFormat")}
            {renderSkillSection("Soft / Interpersonal Skills", "Soft", "SoftFormat")}
            {renderSkillSection("Professional Certifications", "Certifications", "CertFormat")}
            {renderSkillSection("Non-Academic Certifications", "NonAcadCerts", "NonAcadCertFormat")}
            {renderSkillSection("Systems Used", "SystemsUsed", "SystemsUsedFormat")}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    input: { marginBottom: 4, backgroundColor: '#F8F9FA' },
    addButton: { marginTop: 6, borderColor: '#6200EE' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }
});

export default Skills;
