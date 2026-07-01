import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Card, Switch, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Skills = () => {
    const { resumeData, updateResumeData, uiSettings, updateUiSettings } = useContext(ResumeContext);

    if (!resumeData) return null;

    const skills = resumeData.Skills || {};

    const updateSkill = (key, value) => {
        const newSkills = { ...skills, [key]: value };
        updateResumeData({ ...resumeData, Skills: newSkills });
    };

    const handleTextChange = (field, settingKey, text) => {
        if (uiSettings[settingKey] !== 'comma') {
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
            contentContainerStyle={{ padding: 10, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <Headline style={{ marginBottom: 10 }}>Skills & Certifications</Headline>

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
                            onValueChange={(val) => updateUiSettings({ ...uiSettings, TechFormat: val ? 'bullet' : 'comma' })}
                        />
                    </View>

                    <TextInput
                        label="Soft Skills"
                        value={skills.Soft}
                        onChangeText={(text) => handleTextChange('Soft', 'SoftFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        placeholder={
                            uiSettings.SoftFormat !== 'comma'
                                ? uiSettings.placeholders.Soft
                                : "e.g. Leadership, Communication, Teamwork..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Soft Skills as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.SoftFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings({ ...uiSettings, SoftFormat: val ? 'bullet' : 'comma' })}
                        />
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <TextInput
                        label="Professional Certifications"
                        value={skills["Professional Certs"]}
                        onChangeText={(text) => handleTextChange('Professional Certs', 'ProfCertsFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={3}
                        placeholder={
                            uiSettings.ProfCertsFormat !== 'comma'
                                ? uiSettings.placeholders.ProfCerts
                                : "e.g. PMP, AWS Certified Solutions Architect..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Professional Certs as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.ProfCertsFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings({ ...uiSettings, ProfCertsFormat: val ? 'bullet' : 'comma' })}
                        />
                    </View>

                    <TextInput
                        label="Non-Academic Certifications"
                        value={skills["Non-Academic Certs"]}
                        onChangeText={(text) => handleTextChange('Non-Academic Certs', 'NonAcadCertsFormat', text)}
                        style={styles.input}
                        multiline
                        numberOfLines={3}
                        placeholder={
                            uiSettings.NonAcadCertsFormat !== 'comma'
                                ? uiSettings.placeholders.NonAcadCerts
                                : "e.g. First Aid Level 1, Safety Training..."
                        }
                    />
                    <View style={styles.switchRow}>
                        <Text style={{ fontSize: 13 }}>Format Non-Academic Certs as Bulleted List?</Text>
                        <Switch
                            value={uiSettings.NonAcadCertsFormat !== 'comma'}
                            onValueChange={(val) => updateUiSettings({ ...uiSettings, NonAcadCertsFormat: val ? 'bullet' : 'comma' })}
                        />
                    </View>
                </Card.Content>
            </Card>

            <View style={{ height: 50 }} />
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 15 },
    input: { marginBottom: 5, backgroundColor: '#fff' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 5 }
});

export default Skills;
