import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Switch, Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { ResumeContext } from '../context/ResumeContext';
import { AuthContext } from '../context/AuthContext';
import { CompositeAddressItem } from '../types/resume';

interface PersonalDetailsProps {
    isEditMode?: boolean;
}

const ADDRESS_TYPES = [
    { label: '🏡 Home / Physical', value: 'Home / Physical' },
    { label: '🏢 Flat / Apartment', value: 'Flat / Apartment' },
    { label: '📬 Postal Address', value: 'Postal' },
    { label: '💼 Work / Office', value: 'Work' },
    { label: '🏞️ Rural / Village', value: 'Rural / Village' },
    { label: '🌾 Farm', value: 'Farm' },
    { label: '⛺ Informal Settlement', value: 'Informal Settlement' },
    { label: '👥 Next of Kin / Relative', value: 'Next of Kin / Relative' },
    { label: '📌 Other', value: 'Other' },
];

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext) as any;
    const { user, autoUpgradeGuestToLocal } = useContext(AuthContext) as any;
    const [expandedSection, setExpandedSection] = useState('Names');

    const toggleSection = (section: any) => setExpandedSection(expandedSection === section ? null : section);

    if (!resumeData) return null;

    const pd = resumeData["personal details"] || resumeData.personal || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const identity = pd.identity || {};
    const addresses: CompositeAddressItem[] = pd.addresses || [];
    const licensing = pd.licensing || {};
    const demographics = pd.demographics || {};
    const legal = pd.legal || {};
    const languages = pd.languages || [];
    const [nationalities, setNationalities] = useState<any[]>([]);

    React.useEffect(() => {
        const nationalitiesData = require('../../assets/data/nationalities_dropdown.json');
        setNationalities(nationalitiesData.map((n: any) => ({ label: n, value: n })));
    }, []);

    React.useEffect(() => {
        if (languages.length === 0 && isEditMode) {
            addLanguage();
        }
        if (addresses.length === 0 && isEditMode) {
            addAddress();
        }
    }, []);

    const checkAutoUpgradeTrigger = (updatedPd: any) => {
        if (!user || !user.isGuest) return;
        const fn = updatedPd.names?.firstName;
        const mn = updatedPd.names?.MiddleName;
        const sn = updatedPd.names?.Surname;
        const idNum = updatedPd.identity?.idNumber;

        if (fn && fn.trim() && sn && sn.trim() && idNum && idNum.trim()) {
            const rawId = idNum.trim();
            const dob = rawId.length >= 6 ? rawId.substring(0, 6) : '900101';
            const yearPrefix = parseInt(dob.substring(0, 2), 10) > 30 ? '19' : '20';
            const fullDob = `${yearPrefix}${dob}`;

            autoUpgradeGuestToLocal({
                firstName: fn,
                middleName: mn,
                surname: sn,
                idNumber: rawId,
                dob: fullDob
            });
        }
    };

    const updateField = (section: any, key: any, value: any) => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        if (!newData.personal[section]) newData.personal[section] = {};
        newData.personal[section][key] = value;
        newData["personal details"] = newData.personal;
        updateResumeData(newData);

        if (section === 'names' || section === 'identity') {
            checkAutoUpgradeTrigger(newData.personal);
        }
    };

    // Address Composite List Management
    const addAddress = () => {
        if (!isEditMode) return;
        const newAddr: CompositeAddressItem = {
            id: `addr_${Date.now()}_${addresses.length + 1}`,
            addressType: 'Home / Physical',
            unitOrHouseNo: '',
            streetAddress: '',
            suburbOrVillage: '',
            cityOrTown: '',
            province: '',
            postalCode: '',
            visible: true
        };
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        newData.personal.addresses = [...addresses, newAddr];
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
    };

    const updateAddressItem = (index: number, key: keyof CompositeAddressItem, value: any) => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        const newAddrs = [...addresses];
        newAddrs[index] = { ...newAddrs[index], [key]: value };
        if (!newData.personal) newData.personal = {};
        newData.personal.addresses = newAddrs;
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
    };

    const removeAddressItem = (index: number) => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        const newAddrs = [...addresses];
        newAddrs.splice(index, 1);
        if (!newData.personal) newData.personal = {};
        newData.personal.addresses = newAddrs;
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
    };

    // Languages Repeater Management
    const addLanguage = () => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        if (!newData.personal.languages) newData.personal.languages = [];
        newData.personal.languages.push({ Language: "", proficiency: "Basic", visible: true });
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
    };

    const updateLanguage = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        newData.personal.languages[index][key] = value;
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
    };

    const removeLanguage = (index: number) => {
        if (!isEditMode) return;
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        newData.personal.languages.splice(index, 1);
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
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
            {/* 1. Names Section */}
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
                        <Text style={styles.label}>Title</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'Mr', value: 'Mr' },
                                { label: 'Mrs', value: 'Mrs' },
                                { label: 'Ms', value: 'Ms' },
                                { label: 'Dr', value: 'Dr' },
                                { label: 'Prof', value: 'Prof' },
                                { label: 'Adv', value: 'Adv' },
                                { label: 'Rev', value: 'Rev' },
                                { label: 'Prince', value: 'Prince' },
                                { label: 'Princess', value: 'Princess' },
                                { label: 'None', value: 'None' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Title"
                            value={names.Prefix || 'None'}
                            onChange={item => updateField('names', 'Prefix', item.value === 'None' ? '' : item.value)}
                            disable={!isEditMode}
                        />
                        <TextInput
                            label="First Name"
                            value={names.firstName || ''}
                            onChangeText={(text) => updateField('names', 'firstName', text)}
                            style={styles.input}
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Middle Name(s)"
                            value={names.MiddleName || ''}
                            onChangeText={(text) => updateField('names', 'MiddleName', text)}
                            style={styles.input}
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Surname"
                            value={names.Surname || ''}
                            onChangeText={(text) => updateField('names', 'Surname', text)}
                            style={styles.input}
                            editable={isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 2. Contact Section */}
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
                            value={contact.Email || ''}
                            onChangeText={(text) => updateField('contact', 'Email', text)}
                            style={styles.input}
                            keyboardType="email-address"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Phone"
                            value={contact.Phone || ''}
                            onChangeText={(text) => updateField('contact', 'Phone', text)}
                            style={styles.input}
                            keyboardType="phone-pad"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Alternative Phone"
                            value={contact["Phone-alt"] || ''}
                            onChangeText={(text) => updateField('contact', 'Phone-alt', text)}
                            style={styles.input}
                            keyboardType="phone-pad"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="LinkedIn Profile URL"
                            value={contact.LinkedIn || ''}
                            onChangeText={(text) => updateField('contact', 'LinkedIn', text)}
                            style={styles.input}
                            keyboardType="url"
                            autoCapitalize="none"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Personal Website URL"
                            value={contact.Website || ''}
                            onChangeText={(text) => updateField('contact', 'Website', text)}
                            style={styles.input}
                            keyboardType="url"
                            autoCapitalize="none"
                            editable={isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 3. Composite Address Section */}
            <Card style={styles.card}>
                <Card.Title
                    title={`Addresses (${addresses.length})`}
                    left={(props) => <IconButton {...props} icon="map-marker" />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Address' ? "chevron-up" : "chevron-down"} onPress={() => toggleSection('Address')} />
                    )}
                />
                {expandedSection === 'Address' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {addresses.map((addr, index) => (
                            <View key={addr.id || index} style={styles.repeaterBox}>
                                <Text style={styles.label}>Address Type (1st field after ID)</Text>
                                <Dropdown
                                    style={styles.dropdown}
                                    dropdownPosition="auto"
                                    data={ADDRESS_TYPES}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Address Type"
                                    value={addr.addressType || 'Home / Physical'}
                                    onChange={item => updateAddressItem(index, 'addressType', item.value)}
                                    disable={!isEditMode}
                                />
                                <TextInput
                                    label="Unit / House / Flat No. (Optional)"
                                    value={addr.unitOrHouseNo || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'unitOrHouseNo', text)}
                                    style={styles.input}
                                    placeholder="e.g. Flat 4B or House 12"
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Street Address"
                                    value={addr.streetAddress || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'streetAddress', text)}
                                    style={styles.input}
                                    placeholder="e.g. 123 Main Road"
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Suburb / Village (Optional)"
                                    value={addr.suburbOrVillage || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'suburbOrVillage', text)}
                                    style={styles.input}
                                    placeholder="e.g. Sandton"
                                    editable={isEditMode}
                                />
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TextInput
                                        label="City / Town"
                                        value={addr.cityOrTown || ''}
                                        onChangeText={(text) => updateAddressItem(index, 'cityOrTown', text)}
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="e.g. Johannesburg"
                                        editable={isEditMode}
                                    />
                                    <TextInput
                                        label="Province"
                                        value={addr.province || ''}
                                        onChangeText={(text) => updateAddressItem(index, 'province', text)}
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="e.g. Gauteng"
                                        editable={isEditMode}
                                    />
                                </View>
                                <TextInput
                                    label="Postal Code"
                                    value={addr.postalCode || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'postalCode', text)}
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="e.g. 2000"
                                    editable={isEditMode}
                                />
                                {isEditMode && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#ff5252"
                                        size={20}
                                        onPress={() => removeAddressItem(index)}
                                        style={styles.deleteBtn}
                                    />
                                )}
                            </View>
                        ))}
                        {isEditMode && (
                            <Button mode="outlined" icon="plus" onPress={addAddress} style={{ marginBottom: 10, alignSelf: 'flex-start' }}>
                                Add Address
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>

            {/* 4. Identity Section */}
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
                            value={identity.idNumber || ''}
                            onChangeText={(text) => updateField('identity', 'idNumber', text)}
                            style={styles.input}
                            keyboardType="numeric"
                            editable={isEditMode}
                        />
                        <View style={styles.switchRow}>
                            <Text>Mask ID on Resume? (e.g. 850101 **** ***)</Text>
                            <Switch
                                value={identity.idMask !== false}
                                onValueChange={(val) => updateField('identity', 'idMask', val)}
                                disabled={!isEditMode}
                            />
                        </View>
                    </Card.Content>
                )}
            </Card>

            {/* 5. Demographics Section */}
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
                        <Text style={styles.label}>Gender</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
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
                            disable={!isEditMode}
                        />
                        <Text style={styles.label}>Race</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
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
                            disable={!isEditMode}
                        />
                        <Text style={styles.label}>Nationality</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            maxHeight={200}
                            data={nationalities}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Nationality"
                            value={demographics.Nationality || 'South African'}
                            onChange={item => updateField('demographics', 'Nationality', item.value)}
                            search
                            searchPlaceholder="Search..."
                            disable={!isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 6. Licensing Section */}
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
                        <Text style={styles.label}>Motor Vehicle Drivers License</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'No Motor Vehicle Drivers License', value: 'None' },
                                { label: '🚗 Code B (Light Motor Vehicle)', value: 'Code B' },
                                { label: '🚗+💨 Code EB (Light Articulated / Trailer)', value: 'Code EB' },
                                { label: '🚚 Code C1 (Heavy Motor 3.5t-16t)', value: 'Code C1' },
                                { label: '🚛 Code C (Heavy Motor >16t)', value: 'Code C' },
                                { label: '🚚+💨 Code EC1 (Heavy Artic. / Trailer)', value: 'Code EC1' },
                                { label: '🚛+💨+💨 Code EC (Extra Heavy Artic. / Double Trailer)', value: 'Code EC' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Motor Vehicle License (or none)"
                            value={licensing.Drivers || 'None'}
                            onChange={item => {
                                updateField('licensing', 'Drivers', item.value);
                                updateField('licensing', 'DriversVisible', item.value !== 'None');
                            }}
                            disable={!isEditMode}
                        />
                        <View style={styles.switchRow}>
                            <Text>Show Drivers License?</Text>
                            <Switch
                                value={licensing.DriversVisible !== false}
                                onValueChange={(val) => updateField('licensing', 'DriversVisible', val)}
                                disabled={!isEditMode}
                            />
                        </View>
                        <Text style={styles.label}>Motorcycle Drivers License</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'No Motorcycle Drivers License', value: 'None' },
                                { label: '🛵 Code A1 (Motorcycle <=125cc)', value: 'Code A1' },
                                { label: '🏍️ Code A (Motorcycle >125cc)', value: 'Code A' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Motorcycle License (or none)"
                            value={licensing.Motorcycle || 'None'}
                            onChange={item => {
                                updateField('licensing', 'Motorcycle', item.value);
                                updateField('licensing', 'MotorVisible', item.value !== 'None');
                            }}
                            disable={!isEditMode}
                        />
                        <View style={styles.switchRow}>
                            <Text>Show Motorcycle License?</Text>
                            <Switch
                                value={(licensing.Motorcycle && licensing.Motorcycle !== 'None') ? (licensing.MotorVisible !== false) : false}
                                onValueChange={(val) => updateField('licensing', 'MotorVisible', val)}
                                disabled={!isEditMode || !licensing.Motorcycle || licensing.Motorcycle === 'None'}
                            />
                        </View>
                    </Card.Content>
                )}
            </Card>

            {/* 7. Legal Section */}
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
                                disabled={!isEditMode}
                            />
                        </View>
                        {legal["Criminal Record"] && (
                            <TextInput
                                label="Details (Optional)"
                                value={legal.Details || ''}
                                onChangeText={(text) => updateField('legal', 'Details', text)}
                                style={styles.input}
                                multiline
                                editable={isEditMode}
                            />
                        )}
                    </Card.Content>
                )}
            </Card>

            {/* 8. Languages Section */}
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
                        {languages.map((lang: any, index: number) => (
                            <View key={index} style={styles.repeaterBox}>
                                <TextInput
                                    label="Language"
                                    value={lang.Language || ''}
                                    onChangeText={(text) => updateLanguage(index, 'Language', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <Dropdown
                                    style={styles.dropdown}
                                    dropdownPosition="auto"
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
                                    disable={!isEditMode}
                                />
                                {isEditMode && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#ff5252"
                                        size={20}
                                        onPress={() => removeLanguage(index)}
                                        style={styles.deleteBtn}
                                    />
                                )}
                            </View>
                        ))}
                        {isEditMode && (
                            <Button mode="outlined" icon="plus" onPress={addLanguage} style={{ marginBottom: 10, alignSelf: 'flex-start' }}>
                                Add Language
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { marginBottom: 10 },
    input: { marginBottom: 10, backgroundColor: '#fff', fontSize: 14 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
    dropdown: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 10, backgroundColor: '#fff' },
    label: { fontSize: 12, color: '#777', marginBottom: 5, marginLeft: 2 },
    repeaterBox: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 15, marginBottom: 10, backgroundColor: '#fafafa', position: 'relative' },
    deleteBtn: { position: 'absolute', top: -5, right: -5 }
});

export default PersonalDetails;
