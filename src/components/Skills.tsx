// @ts-nocheck
import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Card, Switch, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Skills = () => {
    const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext);

    if (!resumeData) return null;

    const skills = resumeData.skills || {};

    const updateSkill = (key, value) => {
        const newSkills = { ...skills, [key]: value };
        updateResumeData({ ...resumeData, skills: newSkills });
    };

    const handleTextChange = (field, formatSettingKey, text) => {
        if (uiSettings[formatSettingKey] !== 'comma') {
            if (text && !text.startsWith('- ')) {
                text = '- ' + text;
            }
            const oldText = skills[field] || "";
            if (text.endsWith('\n') && text.length > oldText.length) {
                text = text + '- ';
            }
            const lines = text.split('\n');
            const processed = lines.map(line => {
                if (line.length > 0 && !line.startsWith('- ')) {
                    return '- ' + line;
                }
                return line;
            });
            text = processed.join('\n');
        }
        updateSkill(field, text);
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
            <Card style={styles.card}>
                <Card.Content>
                    <TextInput
                        label="Technical Skills"
                        value={skills.Tech}
                        onChangeText={(text) => handleTextChange('Tech', 'TechFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder={
                            uiSettings.TechFormat !== 'comma'
                                ? uiSettings.placeholders.Tech
                                : "e.g. JavaScript, React, Sales, Project Management..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Technical Skills as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.TechFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings('TechFormat', val ? 'list' : 'comma')}
                        />
                    </View>

                    <TextInput
                        label="Soft / Interpersonal Skills"
                        value={skills.Soft}
                        onChangeText={(text) => handleTextChange('Soft', 'SoftFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder={
                            uiSettings.SoftFormat !== 'comma'
                                ? uiSettings.placeholders.Soft
                                : "e.g. Communication, Problem Solving, Team Leadership..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Soft Skills as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.SoftFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings('SoftFormat', val ? 'list' : 'comma')}
                        />
                    </View>

                    <TextInput
                        label="Certifications & Training"
                        value={skills.Certifications}
                        onChangeText={(text) => handleTextChange('Certifications', 'CertFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder={
                            uiSettings.CertFormat !== 'comma'
                                ? uiSettings.placeholders.Certifications
                                : "e.g. AWS Certified Developer, PMP, First Aid Level 1..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Certifications as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.CertFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings('CertFormat', val ? 'list' : 'comma')}
                        />
                    </View>
                </Card.Content>
            </Card>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    input: { marginBottom: 10 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }
});

export default Skills;
