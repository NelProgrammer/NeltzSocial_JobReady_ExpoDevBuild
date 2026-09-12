import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Switch, Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { ThemedTextInput as TextInput } from './common/ThemedTextInput';
import { ThemedDropdown as Dropdown } from './common/ThemedDropdown';
import { ResumeContext } from '../context/ResumeContext';
import { AuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
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
    const { theme } = useThemeContext();
    const [expandedSection, setExpandedSection] = useState('Names');

    const toggleSection = (section: any) => setExpandedSection(expandedSection === section ? null : section);

    if (!resumeData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.bgDark }}>
                <Text style={{ color: theme.textSecondary }}>Loading CV details...</Text>
            </View>
        );
    }

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
            style={[styles.container, { backgroundColor: theme.bgDark }]}
            enableOnAndroid={true}
            extraScrollHeight={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 6, paddingTop: 4, paddingBottom: 120, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            {/* 0. Executive Summary Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Executive / Professional Summary"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="text-box-outline" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Summary' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Summary')} />
                    )}
                />
                {expandedSection === 'Summary' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <TextInput
                            label="Professional Summary / Profile Bio"
                            placeholder="Write a concise overview of your career, strengths, and professional objectives..."
                            value={resumeData["professional summary"] || ''}
                            onChangeText={(text) => {
                                if (!isEditMode) return;
                                updateResumeData({ ...resumeData, "professional summary": text });
                            }}
                            multiline
                            numberOfLines={4}
                            style={[styles.input, { minHeight: 90 }]}
                            editable={isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 1. Names Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Names"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="account" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Names' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Names')} />
                    )}
                />
                {expandedSection === 'Names' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
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
                            label="Maiden Name (Optional)"
                            value={names.MaidenName || ''}
                            onChangeText={(text) => updateField('names', 'MaidenName', text)}
                            style={styles.input}
                            placeholder="Optional"
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Contact"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="email" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Contact' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Contact')} />
                    )}
                />
                {expandedSection === 'Contact' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title={`Addresses (${addresses.length})`}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="map-marker" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Address' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Address')} />
                    )}
                />
                {expandedSection === 'Address' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        {addresses.map((addr, index) => (
                            <View key={addr.id || index} style={[styles.repeaterBox, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Address Type (1st field after ID)</Text>
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
                                    label="Unit / House / Flat No."
                                    value={addr.unitOrHouseNo || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'unitOrHouseNo', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Street Address / Stand No."
                                    value={addr.streetAddress || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'streetAddress', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="Suburb / Township / Village"
                                    value={addr.suburbOrVillage || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'suburbOrVillage', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <TextInput
                                    label="City / Town"
                                    value={addr.cityOrTown || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'cityOrTown', text)}
                                    style={styles.input}
                                    editable={isEditMode}
                                />
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Province / State</Text>
                                <Dropdown
                                    style={styles.dropdown}
                                    dropdownPosition="auto"
                                    data={[
                                        { label: 'Gauteng', value: 'Gauteng' },
                                        { label: 'Western Cape', value: 'Western Cape' },
                                        { label: 'KwaZulu-Natal', value: 'KwaZulu-Natal' },
                                        { label: 'Eastern Cape', value: 'Eastern Cape' },
                                        { label: 'Free State', value: 'Free State' },
                                        { label: 'Limpopo', value: 'Limpopo' },
                                        { label: 'Mpumalanga', value: 'Mpumalanga' },
                                        { label: 'North West', value: 'North West' },
                                        { label: 'Northern Cape', value: 'Northern Cape' },
                                        { label: 'Other / International', value: 'Other' }
                                    ]}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Province"
                                    value={addr.province || 'Gauteng'}
                                    onChange={item => updateAddressItem(index, 'province', item.value)}
                                    disable={!isEditMode}
                                />
                                <TextInput
                                    label="Postal Code"
                                    value={addr.postalCode || ''}
                                    onChangeText={(text) => updateAddressItem(index, 'postalCode', text)}
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    editable={isEditMode}
                                />
                                <View style={styles.switchRow}>
                                    <Text style={{ color: theme.textPrimary }}>Show on Target Resumes?</Text>
                                    <Switch
                                        value={addr.visible !== false}
                                        onValueChange={(val) => updateAddressItem(index, 'visible', val)}
                                        disabled={!isEditMode}
                                    />
                                </View>
                                {isEditMode && addresses.length > 1 && (
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
                            <Button mode="outlined" icon="plus" textColor={theme.accent} onPress={addAddress} style={{ borderColor: theme.accent, marginBottom: 10, alignSelf: 'flex-start' }}>
                                Add Address
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>

            {/* 4. Identity Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Identity"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="card-account-details" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Identity' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Identity')} />
                    )}
                />
                {expandedSection === 'Identity' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Identity Type</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'South African ID', value: 'National ID' },
                                { label: 'Passport', value: 'Passport' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select ID Type"
                            value={identity.idType || 'National ID'}
                            onChange={item => updateField('identity', 'idType', item.value)}
                            disable={!isEditMode}
                        />
                        <TextInput
                            label={identity.idType === 'Passport' ? "Passport Number" : "South African ID Number"}
                            value={identity.idNumber || ''}
                            onChangeText={(text) => updateField('identity', 'idNumber', text)}
                            style={styles.input}
                            keyboardType={identity.idType === 'Passport' ? "default" : "number-pad"}
                            maxLength={identity.idType === 'Passport' ? 20 : 13}
                            editable={isEditMode}
                        />
                        <View style={styles.switchRow}>
                            <Text style={{ color: theme.textPrimary }}>Mask ID on Resume? (e.g. 850101 **** ***)</Text>
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Demographics (Optional)"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="human-greeting-variant" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Demographics' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Demographics')} />
                    )}
                />
                {expandedSection === 'Demographics' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Gender</Text>
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
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Race</Text>
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
                            value={demographics.Race || 'African'}
                            onChange={item => updateField('demographics', 'Race', item.value)}
                            disable={!isEditMode}
                        />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Marital Status</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'Single', value: 'Single' },
                                { label: 'Married', value: 'Married' },
                                { label: 'Divorced', value: 'Divorced' },
                                { label: 'Widowed', value: 'Widowed' },
                                { label: 'Separated', value: 'Separated' },
                                { label: 'Domestic Partnership', value: 'Domestic Partnership' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Marital Status"
                            value={demographics.MaritalStatus || demographics.maritalStatus || 'Single'}
                            onChange={item => updateField('demographics', 'MaritalStatus', item.value)}
                            disable={!isEditMode}
                        />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Disability Status</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'None', value: 'None' },
                                { label: 'Physical Disability', value: 'Physical' },
                                { label: 'Visual Impairment', value: 'Visual' },
                                { label: 'Hearing Impairment', value: 'Hearing' },
                                { label: 'Intellectual / Learning Disability', value: 'Intellectual' },
                                { label: 'Chronic Illness', value: 'Chronic Illness' },
                                { label: 'Other', value: 'Other' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Disability Status"
                            value={demographics.Disability || demographics.disability || 'None'}
                            onChange={item => updateField('demographics', 'Disability', item.value)}
                            disable={!isEditMode}
                        />
                        {(demographics.Disability === 'Other' || demographics.disability === 'Other' || (demographics.Disability && !['None', 'Physical', 'Visual', 'Hearing', 'Intellectual', 'Chronic Illness', 'Other'].includes(demographics.Disability))) && (
                            <TextInput
                                label="Specify Disability Details"
                                placeholder="Specify disability details"
                                value={demographics.DisabilityDetails || (['None', 'Physical', 'Visual', 'Hearing', 'Intellectual', 'Chronic Illness', 'Other'].includes(demographics.Disability) ? '' : demographics.Disability) || ''}
                                onChangeText={(text) => updateField('demographics', 'DisabilityDetails', text)}
                                style={styles.input}
                                editable={isEditMode}
                            />
                        )}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Nationality</Text>
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Licensing"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="car-sports" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Licensing' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Licensing')} />
                    )}
                />
                {expandedSection === 'Licensing' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Motor Vehicle Drivers License</Text>
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
                            <Text style={{ color: theme.textPrimary }}>Show Drivers License?</Text>
                            <Switch
                                value={licensing.DriversVisible !== false}
                                onValueChange={(val) => updateField('licensing', 'DriversVisible', val)}
                                disabled={!isEditMode}
                            />
                        </View>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Motorcycle Drivers License</Text>
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
                            <Text style={{ color: theme.textPrimary }}>Show Motorcycle License?</Text>
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Legal"
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="gavel" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Legal' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Legal')} />
                    )}
                />
                {expandedSection === 'Legal' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <View style={styles.switchRow}>
                            <Text style={{ color: theme.textPrimary }}>Criminal Record?</Text>
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
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title={`Languages (${languages.length})`}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    left={(props) => <IconButton {...props} icon="translate" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Languages' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Languages')} />
                    )}
                />
                {expandedSection === 'Languages' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        {languages.map((lang: any, index: number) => (
                            <View key={index} style={[styles.repeaterBox, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
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
                            <Button mode="outlined" icon="plus" textColor={theme.accent} onPress={addLanguage} style={{ borderColor: theme.accent, marginBottom: 10, alignSelf: 'flex-start' }}>
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
    container: { flex: 1 },
    card: { marginBottom: 10, borderRadius: 12, borderWidth: 1 },
    input: { marginBottom: 10 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
    dropdown: { marginBottom: 10 },
    label: { fontSize: 12, marginBottom: 5, marginLeft: 2, fontWeight: '600' },
    repeaterBox: { borderWidth: 1, borderRadius: 8, padding: 15, marginBottom: 10, position: 'relative' },
    deleteBtn: { position: 'absolute', top: -5, right: -5 }
});

export default PersonalDetails;
