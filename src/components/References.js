import React, { useContext, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Headline, Button, Card, IconButton, Divider, Checkbox, Text } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const References = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (!resumeData) return null;

    const references = resumeData.References || [];

    const addReference = () => {
        const newRef = {
            "name": "", "org": "", "relation": "", "phone": "", "phone-": "", "email": "", "visible": true
        };
        const newData = { ...resumeData, References: [...references, newRef] };
        updateResumeData(newData);
        setExpandedIndex(references.length);
    };

    const removeReference = (index) => {
        Alert.alert(
            "Remove Reference",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove", style: "destructive",
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

    const updateRef = (index, key, value) => {
        const newRef = [...references];
        newRef[index][key] = value;
        updateResumeData({ ...resumeData, References: newRef });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <Headline style={{ marginBottom: 10 }}>References</Headline>

                {references.map((ref, index) => (
                    <Card key={index} style={styles.card}>
                        <Card.Title
                            title={ref.name || "New Reference"}
                            subtitle={ref.org || "Organization"}
                            left={(props) => <IconButton {...props} icon="account-group" />}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton {...props} icon={expandedIndex === index ? "chevron-up" : "chevron-down"} onPress={() => setExpandedIndex(expandedIndex === index ? null : index)} />
                                    <IconButton {...props} icon="delete" onPress={() => removeReference(index)} />
                                </View>
                            )}
                        />

                        {expandedIndex === index && (
                            <Card.Content>
                                <Divider style={{ marginBottom: 10 }} />
                                <TextInput
                                    label="Name"
                                    value={ref.name}
                                    onChangeText={(text) => updateRef(index, 'name', text)}
                                    style={styles.input}
                                    placeholder="e.g. John Doe"
                                />
                                <TextInput
                                    label="Organization"
                                    value={ref.org}
                                    onChangeText={(text) => updateRef(index, 'org', text)}
                                    style={styles.input}
                                    placeholder="e.g. Acme Corp"
                                />
                                <TextInput
                                    label="Relationship"
                                    value={ref.relation}
                                    onChangeText={(text) => updateRef(index, 'relation', text)}
                                    style={styles.input}
                                    placeholder="e.g. Manager"
                                />
                                <TextInput
                                    label="Phone"
                                    value={ref.phone}
                                    onChangeText={(text) => updateRef(index, 'phone', text)}
                                    style={styles.input}
                                    keyboardType="phone-pad"
                                />
                                <TextInput
                                    label="Email"
                                    value={ref.email}
                                    onChangeText={(text) => updateRef(index, 'email', text)}
                                    style={styles.input}
                                    keyboardType="email-address"
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                    <Checkbox status={ref.visible ? 'checked' : 'unchecked'} onPress={() => updateRef(index, 'visible', !ref.visible)} />
                                    <Text>Visible on Resume</Text>
                                </View>
                            </Card.Content>
                        )}
                    </Card>
                ))}

                <Button mode="contained" icon="plus" onPress={addReference} style={styles.addButton}>
                    Add Reference
                </Button>
                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 10 },
    input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    addButton: { marginTop: 10, marginBottom: 20 }
});

export default References;
