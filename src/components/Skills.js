import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Headline, Card } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Skills = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);

    if (!resumeData) return null;

    const skills = resumeData.Skills || {};

    const updateSkill = (key, value) => {
        const newSkills = { ...skills, [key]: value };
        updateResumeData({ ...resumeData, Skills: newSkills });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <Headline style={{ marginBottom: 10 }}>Skills & Certifications</Headline>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Technical Skills"
                            value={skills.Tech}
                            onChangeText={(text) => updateSkill('Tech', text)}
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="e.g. JavaScript, React, Sales, Project Management..."
                        />
                        <TextInput
                            label="Soft Skills"
                            value={skills.Soft}
                            onChangeText={(text) => updateSkill('Soft', text)}
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="e.g. Leadership, Communication, Teamwork..."
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Professional Certifications"
                            value={skills["Professional Certs"]}
                            onChangeText={(text) => updateSkill('Professional Certs', text)}
                            style={styles.input}
                            multiline
                            numberOfLines={3}
                        />
                        <TextInput
                            label="Non-Academic Certifications"
                            value={skills["Non-Academic Certs"]}
                            onChangeText={(text) => updateSkill('Non-Academic Certs', text)}
                            style={styles.input}
                            multiline
                            numberOfLines={3}
                        />
                    </Card.Content>
                </Card>

                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 15 },
    input: { marginBottom: 15, backgroundColor: '#fff' },
});

export default Skills;
