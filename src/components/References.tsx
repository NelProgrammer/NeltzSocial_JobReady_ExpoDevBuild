import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Card, IconButton, Divider, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { ReferenceItem } from '../types/resume';

interface ReferencesProps {
    isEditMode?: boolean;
}

const References: React.FC<ReferencesProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext) as any;
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Collapsed by default

    if (!resumeData || !updateResumeData) return null;

    const references: ReferenceItem[] = resumeData.References || [];

    const addReference = () => {
        if (!isEditMode) return;
        const newRef: ReferenceItem = {
            id: `ref_${Date.now()}_${references.length + 1}`,
            name: "",
            role: "",
            company: "",
            cellPhone: "",
            workPhone: "",
            email: "",
            visible: true
        };
        updateResumeData({ ...resumeData, References: [...references, newRef] });
        setExpandedIndex(references.length);
    };

    const removeReference = (index: number) => {
        if (!isEditMode) return;
        Alert.alert(
            "Remove Reference",
            "Are you sure you want to remove this reference?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        const newRef = [...references];
                        newRef.splice(index, 1);
                        updateResumeData({ ...resumeData, References: newRef });
                        setExpandedIndex(null);
                    }
                }
            ]
        );
    };

    const updateRef = (index: number, key: string, value: string) => {
        if (!isEditMode) return;
        const newRef = [...references];
        newRef[index] = { ...newRef[index], [key]: value };
        updateResumeData({ ...resumeData, References: newRef });
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
            {references.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>ℹ️ No references added yet. Tap "+ Add Reference" to get started.</Text>
                </View>
            ) : (
                references.map((ref: ReferenceItem, index: number) => {
                    const refName = ref.name || ref.Name || "";
                    const refRole = ref.role || ref.Role || "";
                    const refCompany = ref.company || ref.organization || ref.Organization || "";
                    const cellPhone = ref.cellPhone || "";
                    const workPhone = ref.workPhone || "";
                    const email = ref.email || "";

                    const isExpanded = expandedIndex === index;

                    return (
                        <Card key={ref.id || index} style={styles.card}>
                            <Card.Title
                                title={refName || "New Reference"}
                                subtitle={refCompany ? `${refRole} at ${refCompany}` : (refRole || "Reference Details")}
                                left={(props) => <IconButton {...props} icon="account-badge-outline" />}
                                right={(props) => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <IconButton
                                            {...props}
                                            icon={isExpanded ? "chevron-up" : "chevron-down"}
                                            onPress={() => setExpandedIndex(isExpanded ? null : index)}
                                        />
                                        {isEditMode && (
                                            <IconButton {...props} icon="delete" onPress={() => removeReference(index)} />
                                        )}
                                    </View>
                                )}
                            />
                            {isExpanded && (
                                <Card.Content>
                                    <Divider style={{ marginBottom: 10 }} />
                                    <TextInput
                                        label="Full Name"
                                        value={refName}
                                        onChangeText={(text) => updateRef(index, 'name', text)}
                                        style={styles.input}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Role / Title"
                                        value={refRole}
                                        onChangeText={(text) => updateRef(index, 'role', text)}
                                        style={styles.input}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Company / Organization"
                                        value={refCompany}
                                        onChangeText={(text) => updateRef(index, 'company', text)}
                                        style={styles.input}
                                        editable={isEditMode}
                                    />
                                    
                                    <Text style={styles.subHeader}>Contact Details</Text>
                                    <TextInput
                                        label="Cell Number"
                                        value={cellPhone}
                                        onChangeText={(text) => updateRef(index, 'cellPhone', text)}
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        placeholder="e.g. 082 123 4567"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Work Number"
                                        value={workPhone}
                                        onChangeText={(text) => updateRef(index, 'workPhone', text)}
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        placeholder="e.g. 011 987 6543"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Email Address"
                                        value={email}
                                        onChangeText={(text) => updateRef(index, 'email', text)}
                                        style={styles.input}
                                        keyboardType="email-address"
                                        placeholder="e.g. ref@company.co.za"
                                        autoCapitalize="none"
                                        editable={isEditMode}
                                    />
                                </Card.Content>
                            )}
                        </Card>
                    );
                })
            )}

            {isEditMode && (
                <Button mode="contained" icon="plus" onPress={addReference} style={styles.addBtn}>
                    Add Reference
                </Button>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    subHeader: { fontWeight: 'bold', fontSize: 13, color: '#475569', marginTop: 6, marginBottom: 8 },
    input: { marginBottom: 10, backgroundColor: '#F8F9FA' },
    addBtn: { marginTop: 10, marginBottom: 20, alignSelf: 'flex-start', backgroundColor: '#6200EE' },
    emptyCard: { padding: 14, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 15 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default References;
