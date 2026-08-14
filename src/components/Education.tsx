// @ts-nocheck
import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Subheading, Button, Card, IconButton, Divider, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { ProfessionalCertItem } from '../types/resume';

interface EducationProps {
    isEditMode?: boolean;
}

const Education: React.FC<EducationProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [expandedTertiaryIndex, setExpandedTertiaryIndex] = useState<number | null>(null);
    const [expandedCertIndex, setExpandedCertIndex] = useState<number | null>(null);

    if (!resumeData) return null;

    const education = resumeData.education || { highschool: {}, tertiary: [], professionalCertifications: [] };
    const highschool = education.highschool || {};
    const tertiary = education.tertiary || [];
    const profCerts: ProfessionalCertItem[] = education.professionalCertifications || [];

    // --- High School Update ---
    const updateHighSchool = (key: string, value: any) => {
        if (!isEditMode) return;
        const newEdu = { ...education, highschool: { ...highschool, [key]: value } };
        updateResumeData({ ...resumeData, education: newEdu });
    };

    // --- Tertiary Logic ---
    const addTertiary = () => {
        if (!isEditMode) return;
        const newQual = {
            id: `edu_tertiary_${Date.now()}_${tertiary.length + 1}`,
            "Institution": "", "Qualification Name": "", "NQF Level": "", "Year": "", "Completed": false, "Key Modules": [], visible: true
        };
        const newEdu = { ...education, tertiary: [...tertiary, newQual] };
        updateResumeData({ ...resumeData, education: newEdu });
        setExpandedTertiaryIndex(tertiary.length);
    };

    const removeTertiary = (index: number) => {
        if (!isEditMode) return;
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

    const updateTertiary = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newList = [...tertiary];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, tertiary: newList } });
    };

    // --- Professional Certifications Logic ---
    const addProfessionalCert = () => {
        if (!isEditMode) return;
        const newCert: ProfessionalCertItem = {
            id: `edu_cert_${Date.now()}_${profCerts.length + 1}`,
            name: '',
            institution: '',
            yearObtained: '',
            certNumber: '',
            expiryYear: '',
            visible: true
        };
        const newEdu = { ...education, professionalCertifications: [...profCerts, newCert] };
        updateResumeData({ ...resumeData, education: newEdu });
        setExpandedCertIndex(profCerts.length);
    };

    const removeProfessionalCert = (index: number) => {
        if (!isEditMode) return;
        Alert.alert("Remove Certification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...profCerts];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, professionalCertifications: newList } });
                    setExpandedCertIndex(null);
                }
            }
        ]);
    };

    const updateProfessionalCert = (index: number, key: keyof ProfessionalCertItem, value: any) => {
        if (!isEditMode) return;
        const newList = [...profCerts];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, professionalCertifications: newList } });
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
            {/* 1. High School Section */}
            <Card style={styles.card}>
                <Card.Title title="High School" left={(props) => <IconButton {...props} icon="school" />} />
                <Card.Content>
                    <TextInput
                        label="School Name/Province"
                        value={highschool["Province Department"] || ''}
                        onChangeText={(text) => updateHighSchool("Province Department", text)}
                        style={styles.input}
                        editable={isEditMode}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TextInput
                            label="Year Completed"
                            value={String(highschool["Year Completed"] || '')}
                            onChangeText={(text) => updateHighSchool("Year Completed", text)}
                            style={[styles.input, { flex: 1, marginRight: 5 }]}
                            keyboardType="numeric"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Highest Grade"
                            value={String(highschool["Highest Grade Passed"] || '')}
                            onChangeText={(text) => updateHighSchool("Highest Grade Passed", text)}
                            style={[styles.input, { flex: 1, marginLeft: 5 }]}
                            editable={isEditMode}
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* 2. Tertiary Qualifications Section */}
            <Subheading style={{ marginTop: 10, marginBottom: 5 }}>Tertiary / Higher Education ({tertiary.length})</Subheading>
            {tertiary.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>ℹ️ No tertiary qualifications added yet.</Text>
                </View>
            ) : (
                tertiary.map((qual, index) => (
                    <Card key={qual.id || index} style={styles.card}>
                        <Card.Title
                            title={qual["Qualification Name"] || "New Qualification"}
                            subtitle={qual["Institution"] || "Institution"}
                            left={(props) => <IconButton {...props} icon="certificate" />}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton {...props} icon={expandedTertiaryIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedTertiaryIndex(expandedTertiaryIndex === index ? null : index)} />
                                    {isEditMode && <IconButton {...props} icon="delete" onPress={() => removeTertiary(index)} />}
                                </View>
                            )}
                        />
                        {expandedTertiaryIndex === index && (
                            <Card.Content>
                                <Divider style={{ marginBottom: 10 }} />
                                <TextInput
                                    label="Qualification Name"
                                    value={qual["Qualification Name"] || ''}
                                    onChangeText={(text) => updateTertiary(index, 'Qualification Name', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Institution"
                                    value={qual["Institution"] || ''}
                                    onChangeText={(text) => updateTertiary(index, 'Institution', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TextInput
                                        label="Year"
                                        value={String(qual["Year"] || '')}
                                        onChangeText={(text) => updateTertiary(index, 'Year', text)}
                                        style={[styles.input, { flex: 1, marginRight: 5 }]}
                                        keyboardType="numeric"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="NQF Level (Optional)"
                                        value={String(qual["NQF Level"] || '')}
                                        onChangeText={(text) => updateTertiary(index, 'NQF Level', text)}
                                        style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                        editable={isEditMode}
                                    />
                                </View>
                            </Card.Content>
                        )}
                    </Card>
                ))
            )}

            {isEditMode && (
                <Button mode="outlined" icon="plus" onPress={addTertiary} style={styles.addBtn}>
                    Add Tertiary Qualification
                </Button>
            )}

            {/* 3. Professional Certifications Section (Accordion 3) */}
            <Subheading style={{ marginTop: 15, marginBottom: 5 }}>Professional Certifications ({profCerts.length})</Subheading>
            {profCerts.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>ℹ️ No professional certifications added yet.</Text>
                </View>
            ) : (
                profCerts.map((cert, index) => (
                    <Card key={cert.id || index} style={styles.card}>
                        <Card.Title
                            title={cert.name || "New Certification"}
                            subtitle={cert.institution || "Issuing Body"}
                            left={(props) => <IconButton {...props} icon="badge-account-horizontal" />}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton {...props} icon={expandedCertIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedCertIndex(expandedCertIndex === index ? null : index)} />
                                    {isEditMode && <IconButton {...props} icon="delete" onPress={() => removeProfessionalCert(index)} />}
                                </View>
                            )}
                        />
                        {expandedCertIndex === index && (
                            <Card.Content>
                                <Divider style={{ marginBottom: 10 }} />
                                <TextInput
                                    label="Certification Name (e.g. CA(SA), PMP, AWS)"
                                    value={cert.name || ''}
                                    onChangeText={(text) => updateProfessionalCert(index, 'name', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Issuing Institution / Body (e.g. SAICA, PMI)"
                                    value={cert.institution || ''}
                                    onChangeText={(text) => updateProfessionalCert(index, 'institution', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TextInput
                                        label="Year Obtained"
                                        value={String(cert.yearObtained || '')}
                                        onChangeText={(text) => updateProfessionalCert(index, 'yearObtained', text)}
                                        style={[styles.input, { flex: 1, marginRight: 5 }]}
                                        keyboardType="numeric"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Expiry Year (Optional)"
                                        value={String(cert.expiryYear || '')}
                                        onChangeText={(text) => updateProfessionalCert(index, 'expiryYear', text)}
                                        style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                        keyboardType="numeric"
                                        editable={isEditMode}
                                    />
                                </View>
                                <TextInput
                                    label="Registration / License No. (Optional)"
                                    value={cert.certNumber || ''}
                                    onChangeText={(text) => updateProfessionalCert(index, 'certNumber', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                            </Card.Content>
                        )}
                    </Card>
                ))
            )}

            {isEditMode && (
                <Button mode="outlined" icon="plus" onPress={addProfessionalCert} style={styles.addBtn}>
                    Add Professional Certification
                </Button>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 12 },
    input: { marginBottom: 10, backgroundColor: '#fff' },
    addBtn: { marginTop: 6, marginBottom: 15, alignSelf: 'flex-start' },
    emptyCard: { padding: 14, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 12 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default Education;
