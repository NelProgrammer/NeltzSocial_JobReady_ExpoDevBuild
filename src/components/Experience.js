import React, { useContext, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Headline, Button, Card, Paragraph, IconButton, Divider } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Experience = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (!resumeData) return null;

    const experiences = resumeData.experience || [];

    const addExperience = () => {
        const newExp = {
            "Start Date": "", "End Date": "", "Organization": "", "Department": "",
            "Role": "", "Key Responsibilities": "", "Responsibility Format": "list", "Reason for Leaving": "",
            "Systems Used": "", "Achievements": ""
        };
        const newData = { ...resumeData, experience: [...experiences, newExp] };
        updateResumeData(newData);
        setExpandedIndex(experiences.length); // Auto-expand new item
    };

    const removeExperience = (index) => {
        Alert.alert(
            "Remove Job",
            "Are you sure?",
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

    const updateExpField = (index, key, value) => {
        const newExp = [...experiences];
        newExp[index][key] = value;
        updateResumeData({ ...resumeData, experience: newExp });
    };

    return (
        <ScrollView style={styles.container}>
            <Headline style={{ marginBottom: 10 }}>Work Experience</Headline>

            {experiences.map((exp, index) => (
                <Card key={index} style={styles.card}>
                    <Card.Title
                        title={exp.Organization || "New Job"}
                        subtitle={exp.Role || "Role"}
                        left={(props) => <IconButton {...props} icon="briefcase" />}
                        right={(props) => (
                            <View style={{ flexDirection: 'row' }}>
                                <IconButton {...props} icon={expandedIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedIndex(expandedIndex === index ? null : index)} />
                                <IconButton {...props} icon="delete" onPress={() => removeExperience(index)} />
                            </View>
                        )}
                    />

                    {expandedIndex === index && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <TextInput
                                label="Organization"
                                value={exp.Organization}
                                onChangeText={(text) => updateExpField(index, 'Organization', text)}
                                style={styles.input}
                            />
                            <TextInput
                                label="Role"
                                value={exp.Role}
                                onChangeText={(text) => updateExpField(index, 'Role', text)}
                                style={styles.input}
                            />
                            <TextInput
                                label="Department"
                                value={exp.Department}
                                onChangeText={(text) => updateExpField(index, 'Department', text)}
                                style={styles.input}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TextInput
                                    label="Start Date"
                                    value={exp["Start Date"]}
                                    onChangeText={(text) => updateExpField(index, 'Start Date', text)}
                                    style={[styles.input, { flex: 1, marginRight: 5 }]}
                                    placeholder="YYYY-MM-DD"
                                />
                                <TextInput
                                    label="End Date"
                                    value={exp["End Date"]}
                                    onChangeText={(text) => updateExpField(index, 'End Date', text)}
                                    style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                            <TextInput
                                label="Responsibilities"
                                value={exp["Key Responsibilities"]}
                                onChangeText={(text) => updateExpField(index, 'Key Responsibilities', text)}
                                style={styles.input}
                                multiline
                                numberOfLines={4}
                            />
                            <TextInput
                                label="Reason for Leaving"
                                value={exp["Reason for Leaving"]}
                                onChangeText={(text) => updateExpField(index, 'Reason for Leaving', text)}
                                style={styles.input}
                            />
                        </Card.Content>
                    )}
                </Card>
            ))}

            <Button mode="contained" icon="plus" onPress={addExperience} style={styles.addButton}>
                Add Job
            </Button>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 10 },
    input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    addButton: { marginTop: 10, marginBottom: 20 }
});

export default Experience;
