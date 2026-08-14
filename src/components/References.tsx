// @ts-nocheck
import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Card, IconButton, Divider, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

interface ReferencesProps {
    isEditMode?: boolean;
}

const References: React.FC<ReferencesProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);

    if (!resumeData) return null;

    const references = resumeData.References || [];

    const addReference = () => {
        if (!isEditMode) return;
        const newRef = { id: `ref_${Date.now()}_${references.length + 1}`, name: "", role: "", company: "", contact: "", visible: true };
        updateResumeData({ ...resumeData, References: [...references, newRef] });
    };

    const removeReference = (index) => {
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
                    }
                }
            ]
        );
    };

    const updateRef = (index, key, value) => {
        if (!isEditMode) return;
        const newRef = [...references];
        newRef[index][key] = value;
        if (key === 'name') newRef[index].Name = value;
        if (key === 'role') newRef[index].Role = value;
        if (key === 'company') newRef[index].Organization = value;
        if (key === 'contact') newRef[index].Contact = value;
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
                references.map((ref, index) => {
                    const refName = ref.name || ref.Name || "";
                    const refRole = ref.role || ref.Role || "";
                    const refCompany = ref.company || ref.Organization || "";
                    const refContact = ref.contact || ref.Contact || "";

                    return (
                        <Card key={ref.id || index} style={styles.card}>
                            <Card.Title
                                title={refName || "New Reference"}
                                subtitle={refCompany ? `${refRole} at ${refCompany}` : (refRole || "Reference")}
                                left={(props) => <IconButton {...props} icon="account-badge-outline" />}
                                right={(props) => (
                                    isEditMode && <IconButton {...props} icon="delete" onPress={() => removeReference(index)} />
                                )}
                            />
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
                                <TextInput
                                    label="Contact Number / Email"
                                    value={refContact}
                                    onChangeText={(text) => updateRef(index, 'contact', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                            </Card.Content>
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
    input: { marginBottom: 10, backgroundColor: '#fff' },
    addBtn: { marginTop: 10, marginBottom: 20, alignSelf: 'flex-start' },
    emptyCard: { padding: 14, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 15 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default References;
