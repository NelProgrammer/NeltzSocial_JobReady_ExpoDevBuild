import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Subheading } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';

const PersonalDetails = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);

    if (!resumeData) return null;

    const pd = resumeData["personal details"] || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const identity = pd.identity || {};

    const updateField = (section, key, value) => {
        const newData = { ...resumeData };
        if (!newData["personal details"][section]) newData["personal details"][section] = {};
        newData["personal details"][section][key] = value;
        updateResumeData(newData);
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <Headline>Personal Details</Headline>

            <Subheading style={styles.header}>Names</Subheading>
            <TextInput
                label="First Name"
                value={names.firstName}
                onChangeText={(text) => updateField('names', 'firstName', text)}
                style={styles.input}
            />
            <TextInput
                label="Surname"
                value={names.Surname}
                onChangeText={(text) => updateField('names', 'Surname', text)}
                style={styles.input}
            />
            <TextInput
                label="Title (Mr/Mrs/etc)"
                value={names.Prefix}
                onChangeText={(text) => updateField('names', 'Prefix', text)}
                style={styles.input}
            />

            <Subheading style={styles.header}>Contact</Subheading>
            <TextInput
                label="Email"
                value={contact.Email}
                onChangeText={(text) => updateField('contact', 'Email', text)}
                style={styles.input}
                keyboardType="email-address"
            />
            <TextInput
                label="Phone"
                value={contact.Phone}
                onChangeText={(text) => updateField('contact', 'Phone', text)}
                style={styles.input}
                keyboardType="phone-pad"
            />

            <Subheading style={styles.header}>Identity</Subheading>
            <TextInput
                label="ID Number"
                value={identity.idNumber}
                onChangeText={(text) => updateField('identity', 'idNumber', text)}
                style={styles.input}
                keyboardType="numeric"
            />

        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    input: { marginBottom: 15, backgroundColor: '#fff' },
    header: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' }
});

export default PersonalDetails;
