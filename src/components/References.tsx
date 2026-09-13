import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Card, IconButton, Divider, Text } from 'react-native-paper';
import { ThemedTextInput as TextInput } from './common/ThemedTextInput';
import { ResumeContext } from '../context/ResumeContext';
import { useThemeContext } from '../context/ThemeContext';
import { ReferenceItem } from '../types/resume';

interface ReferencesProps {
    isEditMode?: boolean;
}

const References: React.FC<ReferencesProps> = ({ isEditMode = true }) => {
    const { theme } = useThemeContext();
    const { resumeData, updateResumeData } = useContext(ResumeContext) as any;
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null); // Collapsed by default

    if (!resumeData || !updateResumeData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: theme.textSecondary }}>Loading References...</Text>
            </View>
        );
    }

    const references: ReferenceItem[] = resumeData.References || resumeData.references || [];

    const addReference = () => {
        if (!isEditMode) return;
        const newRef: ReferenceItem = {
            id: `ref_${Date.now()}_${references.length + 1}`,
            name: "",
            role: "",
            company: "",
            relation: "",
            relationship: "",
            cellPhone: "",
            workPhone: "",
            email: "",
            visible: true
        };
        updateResumeData({ ...resumeData, References: [...references, newRef], references: [...references, newRef] });
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
                        updateResumeData({ ...resumeData, References: newRef, references: newRef });
                        setExpandedIndex(null);
                    }
                }
            ]
        );
    };

    const updateRef = (index: number, key: string, value: string) => {
        if (!isEditMode) return;
        const newRef = [...references];
        if (key === 'relation' || key === 'relationship') {
            newRef[index] = { ...newRef[index], relation: value, relationship: value };
        } else {
            newRef[index] = { ...newRef[index], [key]: value };
        }
        updateResumeData({ ...resumeData, References: newRef, references: newRef });
    };

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: theme.bgDark }]}
            enableOnAndroid={true}
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 6, paddingTop: 4, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            {references.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.bgDark, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>ℹ️ No references added yet. Tap "+ Add Reference" to get started.</Text>
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
                        <Card key={ref.id || index} style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1 }]}>
                            <Card.Title
                                title={refName || "New Reference"}
                                subtitle={refCompany ? `${refRole} at ${refCompany}` : (refRole || "Reference Details")}
                                titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                                subtitleStyle={{ color: theme.textSecondary }}
                                left={(props) => <IconButton {...props} icon="account-star-outline" iconColor={theme.accent} size={24} />}
                                right={(props) => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <IconButton
                                            {...props}
                                            iconColor={theme.textSecondary}
                                            icon={isExpanded ? "chevron-up" : "chevron-down"}
                                            onPress={() => setExpandedIndex(isExpanded ? null : index)}
                                        />
                                        {isEditMode && (
                                            <IconButton {...props} icon="delete" iconColor="#ef4444" onPress={() => removeReference(index)} />
                                        )}
                                    </View>
                                )}
                            />
                            {isExpanded && (
                                <Card.Content>
                                    <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                                    <TextInput
                                        label="Full Name"
                                        value={refName}
                                        onChangeText={(text) => updateRef(index, 'name', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="account" />}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Role / Title"
                                        value={refRole}
                                        onChangeText={(text) => updateRef(index, 'role', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="briefcase-outline" />}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Company / Organization"
                                        value={refCompany}
                                        onChangeText={(text) => updateRef(index, 'company', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="domain" />}
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Professional Relationship"
                                        value={ref.relation || ref.relationship || ''}
                                        onChangeText={(text) => updateRef(index, 'relation', text)}
                                        placeholder="e.g. Line Manager, Academic Supervisor, Colleague"
                                        style={styles.input}
                                        left={<TextInput.Icon icon="account-supervisor-circle" />}
                                        editable={isEditMode}
                                    />
                                    
                                    <Text style={[styles.subHeader, { color: theme.textSecondary }]}>Contact Details</Text>
                                    <TextInput
                                        label="Cell Number"
                                        value={cellPhone}
                                        onChangeText={(text) => updateRef(index, 'cellPhone', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="cellphone" />}
                                        keyboardType="phone-pad"
                                        placeholder="e.g. 082 123 4567"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Work Number"
                                        value={workPhone}
                                        onChangeText={(text) => updateRef(index, 'workPhone', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="phone-classic" />}
                                        keyboardType="phone-pad"
                                        placeholder="e.g. 011 987 6543"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Email Address"
                                        value={email}
                                        onChangeText={(text) => updateRef(index, 'email', text)}
                                        style={styles.input}
                                        left={<TextInput.Icon icon="email-outline" />}
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
                <Button mode="contained" icon="plus" onPress={addReference} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                    Add Reference
                </Button>
            )}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15, borderRadius: 8 },
    subHeader: { fontWeight: 'bold', fontSize: 13, marginTop: 8, marginBottom: 8 },
    input: { marginBottom: 10 },
    addBtn: { marginTop: 10, marginBottom: 20, alignSelf: 'flex-start' },
    emptyCard: { padding: 14, borderRadius: 8, marginBottom: 15 },
    emptyText: { fontSize: 13 }
});

export default References;
