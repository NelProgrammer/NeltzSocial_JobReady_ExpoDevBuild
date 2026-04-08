import React, { useContext, useState } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Headline, Switch, Text, Button, IconButton, List, Card, Divider } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { ResumeContext } from '../context/ResumeContext';

const PersonalDetails = () => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [expandedSection, setExpandedSection] = useState(null);
    const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
    const [expandedAccordion, setExpandedAccordion] = React.useState('Names');

    if (!resumeData) return null;

    const pd = resumeData["personal details"] || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const identity = pd.identity || {};
    const address = pd.address || {};
    const licensing = pd.licensing || {};
    const demographics = pd.demographics || {};
    const legal = pd.legal || {};
    const languages = pd.languages || [];

    const updateField = (section, key, value) => {
        const newData = { ...resumeData };
        if (!newData["personal details"][section]) newData["personal details"][section] = {};
        newData["personal details"][section][key] = value;
        updateResumeData(newData);
    };

    const addLanguage = () => {
        const newData = { ...resumeData };
        if (!newData["personal details"]["languages"]) newData["personal details"]["languages"] = [];
        newData["personal details"]["languages"].push({ Language: "", proficiency: "Basic", visible: true });
        updateResumeData(newData);
    };

    const updateLanguage = (index, key, value) => {
        const newData = { ...resumeData };
        newData["personal details"]["languages"][index][key] = value;
        updateResumeData(newData);
    };

    const removeLanguage = (index) => {
        const newData = { ...resumeData };
        newData["personal details"]["languages"].splice(index, 1);
        updateResumeData(newData);
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 10, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <Headline style={{ marginBottom: 15, paddingLeft: 5 }}>Personal Details</Headline>

            
                <Card style={styles.card}>
                    <Card.Title
                        title="Names"
                        left={(props) => <IconButton {...props} icon="account" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Names' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Names')} />
                        )}
                    />
                    {expandedSection === 'Names' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
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
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Contact"
                        left={(props) => <IconButton {...props} icon="email" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Contact' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Contact')} />
                        )}
                    />
                    {expandedSection === 'Contact' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
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
                            <TextInput
                                label="Alternative Phone"
                                value={contact["Phone-alt"]}
                                onChangeText={(text) => updateField('contact', 'Phone-alt', text)}
                                style={styles.input}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                label="LinkedIn Profile URL"
                                value={contact.LinkedIn}
                                onChangeText={(text) => updateField('contact', 'LinkedIn', text)}
                                style={styles.input}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                            <TextInput
                                label="Personal Website URL"
                                value={contact.Website}
                                onChangeText={(text) => updateField('contact', 'Website', text)}
                                style={styles.input}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Address"
                        left={(props) => <IconButton {...props} icon="map-marker" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Address' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Address')} />
                        )}
                    />
                    {expandedSection === 'Address' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'Free-Standing', value: 'Free-Standing' },
                                    { label: 'Apartment-Block', value: 'Apartment-Block' }
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Housing Type"
                                value={address.AddressType || 'Free-Standing'}
                                onChange={item => updateField('address', 'AddressType', item.value)}
                            />
                            <TextInput
                                label="Home Address"
                                value={address["Home Address"]}
                                onChangeText={(text) => updateField('address', 'Home Address', text)}
                                style={styles.input}
                                multiline
                                numberOfLines={3}
                            />
                            <View style={styles.switchRow}>
                                <Text>Format as Bulleted List?</Text>
                                <Switch
                                    value={address.AddressFormat === 'list'}
                                    onValueChange={(val) => updateField('address', 'AddressFormat', val ? 'list' : 'comma')}
                                />
                            </View>
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Identity"
                        left={(props) => <IconButton {...props} icon="card-account-details" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Identity' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Identity')} />
                        )}
                    />
                    {expandedSection === 'Identity' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <TextInput
                                label="ID Number"
                                value={identity.idNumber}
                                onChangeText={(text) => updateField('identity', 'idNumber', text)}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                            <View style={styles.switchRow}>
                                <Text>Mask ID on Resume? (e.g. 850101 **** ***)</Text>
                                <Switch
                                    value={identity.idMask !== false}
                                    onValueChange={(val) => updateField('identity', 'idMask', val)}
                                />
                            </View>
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Demographics (Optional)"
                        left={(props) => <IconButton {...props} icon="human-greeting-variant" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Demographics' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Demographics')} />
                        )}
                    />
                    {expandedSection === 'Demographics' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'Male', value: 'Male' },
                                    { label: 'Female', value: 'Female' },
                                    { label: 'Other', value: 'Other' },
                                    { label: 'None', value: 'None' }
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Gender"
                                value={demographics.Gender || 'None'}
                                onChange={item => updateField('demographics', 'Gender', item.value)}
                            />
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'African', value: 'African' },
                                    { label: 'Coloured', value: 'Coloured' },
                                    { label: 'Asian', value: 'Asian' },
                                    { label: 'White', value: 'White' },
                                    { label: 'Foreigner', value: 'Foreigner' },
                                    { label: 'Other', value: 'Other' }
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Race"
                                value={demographics.Race || 'Other'}
                                onChange={item => updateField('demographics', 'Race', item.value)}
                            />
                            <TextInput
                                label="Nationality"
                                value={demographics.Nationality}
                                onChangeText={(text) => updateField('demographics', 'Nationality', text)}
                                style={styles.input}
                            />
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Licensing"
                        left={(props) => <IconButton {...props} icon="car-sports" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Licensing' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Licensing')} />
                        )}
                    />
                    {expandedSection === 'Licensing' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'None', value: 'None' },
                                    { label: 'Code B (Light Motor Vehicle)', value: 'Code B' },
                                    { label: 'Code EB (Light Articulated)', value: 'Code EB' },
                                    { label: 'Code C1 (Heavy Motor 3.5t-16t)', value: 'Code C1' },
                                    { label: 'Code C (Heavy Motor >16t)', value: 'Code C' },
                                    { label: 'Code EC1 (Heavy Artic. 3.5t-16t)', value: 'Code EC1' },
                                    { label: 'Code EC (Heavy Artic. >16t)', value: 'Code EC' }
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Drivers License"
                                value={licensing.Drivers || 'None'}
                                onChange={item => updateField('licensing', 'Drivers', item.value)}
                            />
                            <View style={styles.switchRow}>
                                <Text>Show Drivers License?</Text>
                                <Switch
                                    value={licensing.DriversVisible || false}
                                    onValueChange={(val) => updateField('licensing', 'DriversVisible', val)}
                                />
                            </View>
                            <Dropdown
                                style={styles.dropdown}
                                data={[
                                    { label: 'None', value: 'None' },
                                    { label: 'Code A1 (Motorcycle <=125cc)', value: 'Code A1' },
                                    { label: 'Code A (Motorcycle >125cc)', value: 'Code A' }
                                ]}
                                labelField="label"
                                valueField="value"
                                placeholder="Motorcycle License"
                                value={licensing.Motorcycle || 'None'}
                                onChange={item => updateField('licensing', 'Motorcycle', item.value)}
                            />
                            <View style={styles.switchRow}>
                                <Text>Show Motorcycle License?</Text>
                                <Switch
                                    value={licensing.MotorVisible || false}
                                    onValueChange={(val) => updateField('licensing', 'MotorVisible', val)}
                                />
                            </View>
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title="Legal"
                        left={(props) => <IconButton {...props} icon="gavel" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Legal' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Legal')} />
                        )}
                    />
                    {expandedSection === 'Legal' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            <View style={styles.switchRow}>
                                <Text>Criminal Record?</Text>
                                <Switch
                                    value={legal["Criminal Record"] || false}
                                    onValueChange={(val) => updateField('legal', 'Criminal Record', val)}
                                />
                            </View>
                            {legal["Criminal Record"] && (
                                <TextInput
                                    label="Details (Optional)"
                                    value={legal.Details}
                                    onChangeText={(text) => updateField('legal', 'Details', text)}
                                    style={styles.input}
                                    multiline
                                />
                            )}
                        </Card.Content>
                    )}
                </Card>

                <Card style={styles.card}>
                    <Card.Title
                        title={`Languages (${languages.length})`}
                        left={(props) => <IconButton {...props} icon="translate" />}
                        right={(props) => (
                            <IconButton {...props} icon={expandedSection === 'Languages' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Languages')} />
                        )}
                    />
                    {expandedSection === 'Languages' && (
                        <Card.Content>
                            <Divider style={{ marginBottom: 10 }} />
                            {languages.map((lang, index) => (
                                <View key={index} style={styles.repeaterBox}>
                                    <TextInput
                                        label="Language"
                                        value={lang.Language}
                                        onChangeText={(text) => updateLanguage(index, 'Language', text)}
                                        style={styles.input}
                                    />
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={[
                                            { label: 'Basic', value: 'Basic' },
                                            { label: 'Conversational', value: 'Conversational' },
                                            { label: 'Professional Working', value: 'Professional Working' },
                                            { label: 'Fluent', value: 'Fluent' },
                                            { label: 'Native / Bilingual', value: 'Native / Bilingual' }
                                        ]}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Proficiency"
                                        value={lang.proficiency || 'Basic'}
                                        onChange={item => updateLanguage(index, 'proficiency', item.value)}
                                    />
                                    <View style={styles.switchRow}>
                                        <Text>Show on Resume?</Text>
                                        <Switch
                                            value={lang.visible !== false}
                                            onValueChange={(val) => updateLanguage(index, 'visible', val)}
                                        />
                                    </View>
                                    <IconButton
                                        icon="delete"
                                        iconColor="#ff5252"
                                        size={20}
                                        onPress={() => removeLanguage(index)}
                                        style={styles.deleteBtn}
                                    />
                                </View>
                            ))}
                            <Button mode="outlined" onPress={addLanguage} style={{ marginBottom: 10, alignSelf: 'flex-start', marginLeft: 15 }}>
                                + Add Language
                            </Button>
                        </Card.Content>
                    )}
                </Card>
            
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 10 },
    cardContent: { paddingTop: 0, paddingBottom: 15 },
    input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    header: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
    dropdown: { height: 50, borderColor: 'gray', borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    repeaterBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 15, marginBottom: 10, backgroundColor: '#fafafa', position: 'relative' },
    deleteBtn: { position: 'absolute', top: -5, right: -5 }
});

export default PersonalDetails;
