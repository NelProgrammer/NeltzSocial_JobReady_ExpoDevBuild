import React, { useContext, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Subheading, Button, Card, IconButton, Divider } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const Education = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [expandedTertiaryIndex, setExpandedTertiaryIndex] = useState(null);

    if (!resumeData) return null;

    const education = resumeData.education || { highschool: {}, tertiary: [] };
    const highschool = education.highschool || {};
    const tertiary = education.tertiary || [];

    // --- High School Update ---
    const updateHighSchool = (key, value) => {
        const newEdu = { ...education, highschool: { ...highschool, [key]: value } };
        updateResumeData({ ...resumeData, education: newEdu });
    };

    // --- Tertiary Logic ---
    const addTertiary = () => {
        const newQual = {
            "Institution": "", "Qualification Name": "", "NQF Level": "", "Year": "", "Completed": false, "Key Modules": []
        };
        const newEdu = { ...education, tertiary: [...tertiary, newQual] };
        updateResumeData({ ...resumeData, education: newEdu });
        setExpandedTertiaryIndex(tertiary.length);
    };

    const removeTertiary = (index) => {
        Alert.alert("Remove Qualification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...tertiary];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, tertiary: newList } });
                    setExpandedTertiaryIndex(null);
                }
            }
        ]);
    };

    const updateTertiary = (index, key, value) => {
        const newList = [...tertiary];
        newList[index][key] = value;
        updateResumeData({ ...resumeData, education: { ...education, tertiary: newList } });
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={20}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            <Headline style={{ marginBottom: 10 }}>Education</Headline>

            {/* High School Section */}
            <Card style={styles.card}>
                <Card.Title title="High School" left={(props) => <IconButton {...props} icon="school" />} />
                <Card.Content>
                    <TextInput
                        label="School Name/Province"
                        value={highschool["Province Department"]}
                        onChangeText={(text) => updateHighSchool("Province Department", text)}
                        style={styles.input}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextInput
                            label="Year Completed"
                            value={String(highschool["Year Completed"] || '')}
                            onChangeText={(text) => updateHighSchool("Year Completed", text)}
                            style={[styles.input, { flex: 1, marginRight: 5 }]}
                            keyboardType="numeric"
                        />
                        <TextInput
                            label="Highest Grade"
                            value={highschool["Highest Grade/Std"]}
                            onChangeText={(text) => updateHighSchool("Highest Grade/Std", text)}
                            style={[styles.input, { flex: 1, marginLeft: 5 }]}
                        />
                    </View>
                </Card.Content>
            </Card>

            <Divider style={{ marginVertical: 15 }} />
            <Subheading style={{ marginBottom: 10, marginLeft: 5 }}>Tertiary Education</Subheading>

            {/* Tertiary Repeater */}
            {tertiary.map((qual, index) => (
                <Card key={index} style={styles.card}>
                    <Card.Title
                        title={qual.Institution || "New Institution"}
                        subtitle={qual["Qualification Name"] || "Qualification"}
                        left={(props) => <IconButton {...props} icon="book-education" />}
                        right={(props) => (
                            <View style={{ flexDirection: 'row' }}>
                                <IconButton {...props} icon={expandedTertiaryIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedTertiaryIndex(expandedTertiaryIndex === index ? null : index)} />
                                <IconButton {...props} icon="delete" onPress={() => removeTertiary(index)} />
                            </View>
                        )}
                    />
                    {expandedTertiaryIndex === index && (
                        <Card.Content>
                            <TextInput
                                label="Institution"
                                value={qual.Institution}
                                onChangeText={(text) => updateTertiary(index, 'Institution', text)}
                                style={styles.input}
                            />
                            <TextInput
                                label="Qualification Name"
                                value={qual["Qualification Name"]}
                                onChangeText={(text) => updateTertiary(index, 'Qualification Name', text)}
                                style={styles.input}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TextInput
                                    label="Year"
                                    value={String(qual.Year || '')}
                                    onChangeText={(text) => updateTertiary(index, 'Year', text)}
                                    style={[styles.input, { flex: 1, marginRight: 5 }]}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    label="NQF Level"
                                    value={String(qual["NQF Level"] || '')}
                                    onChangeText={(text) => updateTertiary(index, 'NQF Level', text)}
                                    style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                />
                            </View>
                        </Card.Content>
                    )}
                </Card>
            ))}

            <Button mode="contained" icon="plus" onPress={addTertiary} style={styles.addButton}>
                Add Qualification
            </Button>
            <View style={{ height: 50 }} />
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 10 },
    input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    addButton: { marginTop: 10, marginBottom: 20 }
});

export default Education;
