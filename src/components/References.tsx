// @ts-nocheck
import React, { useContext } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Button, Card, IconButton, Divider } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const References = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);

    if (!resumeData) return null;

    const references = resumeData.References || [];

    const addReference = () => {
        const newRef = { name: "", role: "", company: "", contact: "" };
        updateResumeData({ ...resumeData, References: [...references, newRef] });
    };

    const removeReference = (index) => {
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
        const newRef = [...references];
        newRef[index][key] = value;
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
            {references.map((ref, index) => (
                <Card key={index} style={styles.card}>
                    <Card.Title
                        title={ref.name || "New Reference"}
                        subtitle={ref.company ? `${ref.role} at ${ref.company}` : (ref.role || "Reference")}
                        left={(props) => <IconButton {...props} icon="account-badge-outline" />}
                        right={(props) => (
                            <IconButton {...props} icon="delete" onPress={() => removeReference(index)} />
                        )}
                    />
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        <TextInput
                            label="Full Name"
                            value={ref.name}
                            onChangeText={(text) => updateRef(index, 'name', text)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Role / Title"
                            value={ref.role}
                            onChangeText={(text) => updateRef(index, 'role', text)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Company / Organization"
                            value={ref.company}
                            onChangeText={(text) => updateRef(index, 'company', text)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Contact Number / Email"
                            value={ref.contact}
                            onChangeText={(text) => updateRef(index, 'contact', text)}
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>
            ))}

            <Button mode="contained" icon="plus" onPress={addReference} style={styles.addBtn}>
                Add Reference
            </Button>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15 },
    input: { marginBottom: 10 },
    addBtn: { marginTop: 10, marginBottom: 20 }
});

export default References;
