import React, { useContext, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Switch, Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { ThemedTextInput as TextInput } from './common/ThemedTextInput';
import { ThemedDropdown as Dropdown } from './common/ThemedDropdown';
import { ResumeContext } from '../context/ResumeContext';
import { AuthContext } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { CompositeAddressItem } from '../types/resume';
import { getPlacesByPostalCode, searchPlaces, searchBySuburb, searchByCity, SAPlace } from '../utils/postalCodeLookup';
import languagesData from '../../assets/data/languages.json';

interface PersonalDetailsProps {
    isEditMode?: boolean;
}

const ADDRESS_TYPES = [
    { label: '🏡 Home / Physical (Free-standing House)', value: 'Home / Physical' },
    { label: '🏢 Flat / Apartment', value: 'Flat / Apartment' },
    { label: '🏘️ Townhouse / Cluster', value: 'Townhouse / Cluster' },
    { label: '💼 Office Block / Commercial', value: 'Office Block / Commercial' },
    { label: '🏞️ Rural / Village (Traditional Authority)', value: 'Rural / Village' },
    { label: '⛺ Informal Settlement', value: 'Informal Settlement' },
    { label: '🌾 Farm / Agricultural', value: 'Farm' },
    { label: '📬 Postal Address (P.O. Box / Private Bag)', value: 'Postal' },
    { label: '👥 Next of Kin / Relative', value: 'Next of Kin / Relative' },
    { label: '📌 Other', value: 'Other' },
];

const PROVINCES = [
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
];

const PROFICIENCY_LEVELS = [
    { label: 'Basic', value: 'Basic' },
    { label: 'Conversational', value: 'Conversational' },
    { label: 'Professional Working', value: 'Professional Working' },
    { label: 'Fluent', value: 'Fluent' },
    { label: 'Native / Bilingual', value: 'Native / Bilingual' }
];

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext) as any;
    const { user, autoUpgradeGuestToLocal } = useContext(AuthContext) as any;
    const { theme } = useThemeContext();
    const [expandedSection, setExpandedSection] = useState<string | null>('Names');
    const [expandedAddressIndex, setExpandedAddressIndex] = useState<number | null>(0);

    const toggleSection = (section: any) => setExpandedSection(expandedSection === section ? null : section);
    const toggleAddressItem = (index: number) => setExpandedAddressIndex(expandedAddressIndex === index ? null : index);

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
        try {
            const nationalitiesData = require('../../assets/data/nationalities_dropdown.json');
            setNationalities(nationalitiesData.map((n: any) => ({ label: n, value: n })));
        } catch {
            setNationalities([{ label: 'South African', value: 'South African' }]);
        }
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

    // Composite Address Guard & Management
    const isAddressBlank = (addr: CompositeAddressItem) => {
        return (
            !addr.streetName?.trim() &&
            !addr.suburbOrTownship?.trim() &&
            !addr.cityOrTown?.trim() &&
            !addr.villageName?.trim() &&
            !addr.settlementName?.trim() &&
            !addr.farmName?.trim() &&
            !addr.boxOrBagNumber?.trim()
        );
    };

    const addAddress = () => {
        if (!isEditMode) return;
        if (addresses.some(isAddressBlank)) {
            Alert.alert('Incomplete Address Entry', 'Please complete the details of the current blank address before adding another.');
            return;
        }

        const newAddr: CompositeAddressItem = {
            id: `addr_${Date.now()}_${addresses.length + 1}`,
            addressType: 'Home / Physical',
            streetNumber: '',
            streetName: '',
            standNumber: '',
            suburbOrTownship: '',
            cityOrTown: '',
            province: 'Gauteng',
            postalCode: '',
            visible: true
        };
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        newData.personal.addresses = [...addresses, newAddr];
        newData["personal details"] = newData.personal;
        updateResumeData(newData);
        setExpandedAddressIndex(addresses.length);
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
        if (expandedAddressIndex === index) {
            setExpandedAddressIndex(newAddrs.length > 0 ? 0 : null);
        }
    };

    const applyPlaceToAddress = (index: number, place: SAPlace) => {
        updateAddressItem(index, 'province', place.province);
        updateAddressItem(index, 'cityOrTown', place.city);
        updateAddressItem(index, 'postalCode', place.postalCode);

        const addr = addresses[index] || {};
        if (addr.addressType === 'Rural / Village') {
            updateAddressItem(index, 'villageName', place.suburb);
            updateAddressItem(index, 'townOrDistrict', place.city);
        } else if (addr.addressType === 'Informal Settlement') {
            updateAddressItem(index, 'settlementName', place.suburb);
        } else if (addr.addressType === 'Farm / Smallholding' || addr.addressType === 'Farm') {
            if (!addr.districtOrNearestTown) updateAddressItem(index, 'districtOrNearestTown', place.city);
            updateAddressItem(index, 'suburbOrTownship', place.suburb);
        } else {
            updateAddressItem(index, 'suburbOrTownship', place.suburb);
            updateAddressItem(index, 'suburbOrVillage', place.suburb);
        }
    };

    const handlePostalCodeChange = (index: number, text: string) => {
        updateAddressItem(index, 'postalCode', text);
        if (text.trim().length === 4) {
            const matches = getPlacesByPostalCode(text.trim());
            if (matches.length > 0) {
                const primary = matches[0];
                const currentAddr = addresses[index] || {};
                if (!currentAddr.province || (currentAddr.province === 'Gauteng' && primary.province !== 'Gauteng')) {
                    updateAddressItem(index, 'province', primary.province);
                }
                if (!currentAddr.cityOrTown) {
                    updateAddressItem(index, 'cityOrTown', primary.city);
                }
            }
        }
    };

    // Composite Language Guard & Management
    const addLanguage = () => {
        if (!isEditMode) return;
        if (languages.some((l: any) => !l.Language || !l.Language.trim() || (l.Language === 'Other' && (!l.customLanguage || !l.customLanguage.trim())))) {
            Alert.alert('Incomplete Language Entry', 'Please specify a language name for the current blank or Other entry before adding another.');
            return;
        }
        const newData = { ...resumeData };
        if (!newData.personal) newData.personal = {};
        if (!newData.personal.languages) newData.personal.languages = [];
        newData.personal.languages.push({ Language: "", customLanguage: "", proficiency: "Basic", visible: true });
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

    // Live Accordion Summaries
    const fullNameSummary = [names.firstName, names.Surname].filter(Boolean).join(' ') || 'No names configured';
    const contactCount = [contact.Email, contact.Phone, contact['Phone-alt'], contact.LinkedIn, contact.Website].filter(Boolean).length;
    const contactSummary = contactCount > 0 ? `${contactCount} contact item${contactCount > 1 ? 's' : ''} added` : 'No contact details added';
    const addressSummary = addresses.length > 0 ? `${addresses.length} address${addresses.length > 1 ? 'es' : ''} configured` : 'No address configured';
    const identitySummary = identity.idNumber ? `ID Number: ${identity.idNumber}` : 'No ID configured';
    const demographicsSummary = [demographics.Gender, demographics.Race, demographics.MaritalStatus].filter(Boolean).join(' · ') || 'Not specified';
    const licensingSummary = [
        licensing.Drivers && licensing.Drivers !== 'None' ? `🚗 ${licensing.Drivers}` : '',
        licensing.Motorcycle && licensing.Motorcycle !== 'None' ? `🏍️ ${licensing.Motorcycle}` : ''
    ].filter(Boolean).join(' · ') || 'No licenses added';
    const languagesSummary = languages.length > 0
        ? languages.map((l: any) => (l.Language === 'Other' ? (l.customLanguage || 'Other') : l.Language)).filter(Boolean).join(', ') || `${languages.length} language${languages.length > 1 ? 's' : ''}`
        : 'No languages added';

    return (
        <KeyboardAwareScrollView
            style={[styles.container, { backgroundColor: theme.bgDark }]}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            enableOnAndroid
            extraScrollHeight={80}
            keyboardShouldPersistTaps="handled"
        >
            {/* 1. Names Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Names"
                    subtitle={expandedSection !== 'Names' ? fullNameSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
                    left={(props) => <IconButton {...props} icon="account" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Names' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Names')} />
                    )}
                />
                {expandedSection === 'Names' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Title / Prefix</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'None', value: 'None' },
                                { label: 'Mr.', value: 'Mr.' },
                                { label: 'Mrs.', value: 'Mrs.' },
                                { label: 'Ms.', value: 'Ms.' },
                                { label: 'Dr.', value: 'Dr.' },
                                { label: 'Prof.', value: 'Prof.' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Title"
                            value={names.Prefix || 'None'}
                            onChange={item => updateField('names', 'Prefix', item.value)}
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
                    title="Contact Details"
                    subtitle={expandedSection !== 'Contact' ? contactSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
                    left={(props) => <IconButton {...props} icon="phone" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Contact' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Contact')} />
                    )}
                />
                {expandedSection === 'Contact' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <TextInput
                            label="Primary Email Address"
                            value={contact.Email || ''}
                            onChangeText={(text) => updateField('contact', 'Email', text)}
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Mobile / Cell Phone"
                            value={contact.Phone || ''}
                            onChangeText={(text) => updateField('contact', 'Phone', text)}
                            style={styles.input}
                            keyboardType="phone-pad"
                            editable={isEditMode}
                        />
                        <TextInput
                            label="Alternative Phone / WhatsApp"
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

            {/* 3. Composite Address Section (Individual Collapsible Accordions) */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title={`Addresses (${addresses.length})`}
                    subtitle={expandedSection !== 'Address' ? addressSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
                    left={(props) => <IconButton {...props} icon="map-marker" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Address' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Address')} />
                    )}
                />
                {expandedSection === 'Address' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        {addresses.map((addr, index) => {
                            const isExpanded = expandedAddressIndex === index;
                            const addrSummary = [
                                addr.unitOrFlatNo || addr.unitNo || addr.shackOrSectionOrStandNo || addr.portionOrPlotNo || addr.boxOrBagNumber,
                                addr.buildingName || addr.complexName || addr.farmName || addr.villageName || addr.streetName || addr.postOfficeName,
                                addr.cityOrTown || addr.suburbOrTownship
                            ].filter(Boolean).join(', ') || 'Incomplete Address';

                            return (
                                <View key={addr.id || index} style={[styles.addressAccordionBox, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                                    <TouchableOpacity
                                        style={styles.addressAccordionHeader}
                                        onPress={() => toggleAddressItem(index)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 13 }}>
                                                📍 Address {index + 1}: {addr.addressType || 'Home / Physical'}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                                {addrSummary}
                                            </Text>
                                        </View>
                                        <IconButton
                                            icon={isExpanded ? "chevron-up" : "chevron-down"}
                                            iconColor={theme.textPrimary}
                                            size={20}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                                            <Divider style={{ marginVertical: 8, backgroundColor: theme.border }} />
                                            
                                            <Text style={[styles.label, { color: theme.textSecondary }]}>Address Type</Text>
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

                                            {/* Specific Fields by Address Type */}
                                            {addr.addressType === 'Flat / Apartment' && (
                                                <>
                                                    <TextInput
                                                        label="Flat / Unit Number (e.g. Flat 4B)"
                                                        value={addr.unitOrFlatNo || addr.unitOrHouseNo || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'unitOrFlatNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Building / Apartment Block Name"
                                                        value={addr.buildingName || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'buildingName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {addr.addressType === 'Townhouse / Cluster' && (
                                                <>
                                                    <TextInput
                                                        label="Unit Number (e.g. Unit 15)"
                                                        value={addr.unitNo || addr.unitOrHouseNo || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'unitNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Complex / Estate Name"
                                                        value={addr.complexName || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'complexName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {addr.addressType === 'Office Block / Commercial' && (
                                                <>
                                                    <TextInput
                                                        label="Suite / Office / Room Number"
                                                        value={addr.suiteOrRoomOrUnitNo || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'suiteOrRoomOrUnitNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Commercial Building Name"
                                                        value={addr.buildingName || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'buildingName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Floor (e.g. 3rd Floor)"
                                                        value={addr.floor || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'floor', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {/* Street Fields for Houses, Flats, Townhouses, Offices */}
                                            {addr.addressType !== 'Rural / Village' && addr.addressType !== 'Informal Settlement' && addr.addressType !== 'Farm' && addr.addressType !== 'Postal' && (
                                                <>
                                                    <TextInput
                                                        label="Street Number (e.g. 45)"
                                                        value={addr.streetNumber || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'streetNumber', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Street Name (e.g. Main Road)"
                                                        value={addr.streetName || addr.streetAddress || ''}
                                                        onChangeText={(text) => {
                                                            updateAddressItem(index, 'streetName', text);
                                                            updateAddressItem(index, 'streetAddress', text);
                                                        }}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    {/* Stand Number strictly below Street Name */}
                                                    <TextInput
                                                        label="Stand / Erf Number (Optional - Below Street Name)"
                                                        value={addr.standNumber || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'standNumber', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Suburb / Township"
                                                        value={addr.suburbOrTownship || addr.suburbOrVillage || ''}
                                                        onChangeText={(text) => {
                                                            updateAddressItem(index, 'suburbOrTownship', text);
                                                            updateAddressItem(index, 'suburbOrVillage', text);
                                                        }}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    {isEditMode && (addr.suburbOrTownship || addr.suburbOrVillage) && (addr.suburbOrTownship || addr.suburbOrVillage || '').trim().length >= 2 && searchBySuburb(addr.suburbOrTownship || addr.suburbOrVillage || '', 6).length > 0 && (
                                                        <View style={{ marginTop: 2, marginBottom: 8 }}>
                                                            <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600', marginBottom: 4 }}>
                                                                📍 Matching Suburbs, Cities & Postal Codes (Tap to apply all):
                                                            </Text>
                                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                {searchBySuburb(addr.suburbOrTownship || addr.suburbOrVillage || '', 6).map((p, pIdx) => (
                                                                    <TouchableOpacity
                                                                        key={pIdx}
                                                                        onPress={() => applyPlaceToAddress(index, p)}
                                                                        style={{
                                                                            backgroundColor: theme.bgDark,
                                                                            borderColor: theme.border,
                                                                            borderWidth: 1,
                                                                            borderRadius: 12,
                                                                            paddingHorizontal: 8,
                                                                            paddingVertical: 4,
                                                                            marginRight: 6
                                                                        }}
                                                                    >
                                                                        <Text style={{ color: theme.accent, fontSize: 11 }}>
                                                                            📍 {p.suburb} · {p.city} ({p.postalCode})
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    )}
                                                </>
                                            )}

                                            {/* Rural / Village Fields */}
                                            {addr.addressType === 'Rural / Village' && (
                                                <>
                                                    <TextInput
                                                        label="Stand / Erf / House Number (e.g. Stand 1420)"
                                                        value={addr.standOrErfOrHouseNo || addr.standNumber || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'standOrErfOrHouseNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Village Name (e.g. Ga-Molepo / Qunu)"
                                                        value={addr.villageName || addr.suburbOrVillage || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'villageName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    {isEditMode && (addr.villageName || addr.suburbOrVillage) && (addr.villageName || addr.suburbOrVillage || '').trim().length >= 2 && searchBySuburb(addr.villageName || addr.suburbOrVillage || '', 6).length > 0 && (
                                                        <View style={{ marginTop: 2, marginBottom: 8 }}>
                                                            <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600', marginBottom: 4 }}>
                                                                📍 Matching Places & Postal Codes (Tap to apply all):
                                                            </Text>
                                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                {searchBySuburb(addr.villageName || addr.suburbOrVillage || '', 6).map((p, pIdx) => (
                                                                    <TouchableOpacity
                                                                        key={pIdx}
                                                                        onPress={() => applyPlaceToAddress(index, p)}
                                                                        style={{
                                                                            backgroundColor: theme.bgDark,
                                                                            borderColor: theme.border,
                                                                            borderWidth: 1,
                                                                            borderRadius: 12,
                                                                            paddingHorizontal: 8,
                                                                            paddingVertical: 4,
                                                                            marginRight: 6
                                                                        }}
                                                                    >
                                                                        <Text style={{ color: theme.accent, fontSize: 11 }}>
                                                                            📍 {p.suburb} · {p.city} ({p.postalCode})
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    )}
                                                    <TextInput
                                                        label="Traditional Authority / Tribal Council"
                                                        value={addr.traditionalAuthorityOrTribalCouncil || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'traditionalAuthorityOrTribalCouncil', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Nearest Postal Agency / Post Office"
                                                        value={addr.postalAgencyOrPostOffice || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'postalAgencyOrPostOffice', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Town / District (e.g. Polokwane / Mthatha)"
                                                        value={addr.townOrDistrict || addr.cityOrTown || ''}
                                                        onChangeText={(text) => {
                                                            updateAddressItem(index, 'townOrDistrict', text);
                                                            updateAddressItem(index, 'cityOrTown', text);
                                                        }}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {/* Informal Settlement Fields */}
                                            {addr.addressType === 'Informal Settlement' && (
                                                <>
                                                    <TextInput
                                                        label="Shack / Section / Stand Number (e.g. Shack 1084)"
                                                        value={addr.shackOrSectionOrStandNo || addr.standNumber || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'shackOrSectionOrStandNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Settlement Name (e.g. Diepsloot Ext 2 / Joe Slovo)"
                                                        value={addr.settlementName || addr.suburbOrVillage || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'settlementName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    {isEditMode && (addr.settlementName || addr.suburbOrVillage) && (addr.settlementName || addr.suburbOrVillage || '').trim().length >= 2 && searchBySuburb(addr.settlementName || addr.suburbOrVillage || '', 6).length > 0 && (
                                                        <View style={{ marginTop: 2, marginBottom: 8 }}>
                                                            <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600', marginBottom: 4 }}>
                                                                📍 Matching Settlements & Postal Codes (Tap to apply all):
                                                            </Text>
                                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                {searchBySuburb(addr.settlementName || addr.suburbOrVillage || '', 6).map((p, pIdx) => (
                                                                    <TouchableOpacity
                                                                        key={pIdx}
                                                                        onPress={() => applyPlaceToAddress(index, p)}
                                                                        style={{
                                                                            backgroundColor: theme.bgDark,
                                                                            borderColor: theme.border,
                                                                            borderWidth: 1,
                                                                            borderRadius: 12,
                                                                            paddingHorizontal: 8,
                                                                            paddingVertical: 4,
                                                                            marginRight: 6
                                                                        }}
                                                                    >
                                                                        <Text style={{ color: theme.accent, fontSize: 11 }}>
                                                                            📍 {p.suburb} · {p.city} ({p.postalCode})
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    )}
                                                    <TextInput
                                                        label="Section / Block (e.g. Section C / Block 4)"
                                                        value={addr.sectionOrBlock || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'sectionOrBlock', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Nearest Landmark / Zone (e.g. Near Community Hall)"
                                                        value={addr.nearestLandmarkOrZone || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'nearestLandmarkOrZone', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {/* Farm / Agricultural Fields */}
                                            {addr.addressType === 'Farm' && (
                                                <>
                                                    <TextInput
                                                        label="Portion / Plot Number (e.g. Portion 12 / Plot 45)"
                                                        value={addr.portionOrPlotNo || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'portionOrPlotNo', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Farm Name (e.g. Rietfontein Farm 345)"
                                                        value={addr.farmName || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'farmName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Road / Route / Access Road (e.g. R511 / D124)"
                                                        value={addr.roadOrRoute || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'roadOrRoute', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="District / Nearest Town"
                                                        value={addr.districtOrNearestTown || addr.cityOrTown || ''}
                                                        onChangeText={(text) => {
                                                            updateAddressItem(index, 'districtOrNearestTown', text);
                                                            updateAddressItem(index, 'cityOrTown', text);
                                                        }}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {/* Postal Address Fields */}
                                            {addr.addressType === 'Postal' && (
                                                <>
                                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Box or Bag Type</Text>
                                                    <Dropdown
                                                        style={styles.dropdown}
                                                        dropdownPosition="auto"
                                                        data={[
                                                            { label: 'P.O. Box', value: 'P.O. Box' },
                                                            { label: 'Private Bag', value: 'Private Bag' }
                                                        ]}
                                                        labelField="label"
                                                        valueField="value"
                                                        value={addr.boxOrBagType || 'P.O. Box'}
                                                        onChange={item => updateAddressItem(index, 'boxOrBagType', item.value)}
                                                        disable={!isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Box / Bag Number (e.g. 1234)"
                                                        value={addr.boxOrBagNumber || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'boxOrBagNumber', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    <TextInput
                                                        label="Post Office Branch Name (e.g. Halfway House)"
                                                        value={addr.postOfficeName || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'postOfficeName', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                </>
                                            )}

                                            {/* Common City, Province, Postal Code */}
                                            {addr.addressType !== 'Postal' && (
                                                <>
                                                    <TextInput
                                                        label="City / Town"
                                                        value={addr.cityOrTown || ''}
                                                        onChangeText={(text) => updateAddressItem(index, 'cityOrTown', text)}
                                                        style={styles.input}
                                                        editable={isEditMode}
                                                    />
                                                    {isEditMode && addr.cityOrTown && (addr.cityOrTown || '').trim().length >= 2 && searchByCity(addr.cityOrTown || '', 6).length > 0 && (
                                                        <View style={{ marginTop: 2, marginBottom: 8 }}>
                                                            <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600', marginBottom: 4 }}>
                                                                📍 Matching Cities, Suburbs & Postal Codes (Tap to apply all):
                                                            </Text>
                                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                {searchByCity(addr.cityOrTown || '', 6).map((p, pIdx) => (
                                                                    <TouchableOpacity
                                                                        key={pIdx}
                                                                        onPress={() => applyPlaceToAddress(index, p)}
                                                                        style={{
                                                                            backgroundColor: theme.bgDark,
                                                                            borderColor: theme.border,
                                                                            borderWidth: 1,
                                                                            borderRadius: 12,
                                                                            paddingHorizontal: 8,
                                                                            paddingVertical: 4,
                                                                            marginRight: 6
                                                                        }}
                                                                    >
                                                                        <Text style={{ color: theme.accent, fontSize: 11 }}>
                                                                            📍 {p.city} · {p.suburb} ({p.postalCode})
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    )}
                                                </>
                                            )}

                                            <Text style={[styles.label, { color: theme.textSecondary }]}>Province / Region</Text>
                                            <Dropdown
                                                style={styles.dropdown}
                                                dropdownPosition="auto"
                                                data={PROVINCES}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Select Province"
                                                value={addr.province || 'Gauteng'}
                                                onChange={item => updateAddressItem(index, 'province', item.value)}
                                                disable={!isEditMode}
                                            />

                                            <TextInput
                                                label="Postal Code (4 Digits)"
                                                value={addr.postalCode || ''}
                                                onChangeText={(text) => handlePostalCodeChange(index, text)}
                                                style={styles.input}
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                editable={isEditMode}
                                            />
                                            {isEditMode && addr.postalCode && addr.postalCode.length === 4 && getPlacesByPostalCode(addr.postalCode).length > 0 && (
                                                <View style={{ marginTop: 4, marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600', marginBottom: 4 }}>
                                                        📍 Matching Suburbs & Cities for {addr.postalCode} (Tap to apply all):
                                                    </Text>
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                        {getPlacesByPostalCode(addr.postalCode).slice(0, 8).map((p, pIdx) => (
                                                            <TouchableOpacity
                                                                key={pIdx}
                                                                onPress={() => applyPlaceToAddress(index, p)}
                                                                style={{
                                                                    backgroundColor: theme.bgSurface,
                                                                    borderColor: theme.accent,
                                                                    borderWidth: 1,
                                                                    borderRadius: 12,
                                                                    paddingHorizontal: 10,
                                                                    paddingVertical: 5,
                                                                    marginRight: 6
                                                                }}
                                                            >
                                                                <Text style={{ color: theme.textPrimary, fontSize: 12 }}>
                                                                    📍 {p.suburb} ({p.city})
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}

                                            {isEditMode && addresses.length > 1 && (
                                                <Button
                                                    mode="outlined"
                                                    icon="delete"
                                                    textColor="#ef4444"
                                                    style={{ borderColor: '#ef4444', marginTop: 8 }}
                                                    onPress={() => removeAddressItem(index)}
                                                >
                                                    Remove This Address
                                                </Button>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {isEditMode && (
                            <Button mode="outlined" icon="plus" textColor={theme.accent} onPress={addAddress} style={{ borderColor: theme.accent, marginTop: 6, alignSelf: 'flex-start' }}>
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
                    subtitle={expandedSection !== 'Identity' ? identitySummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
                    left={(props) => <IconButton {...props} icon="card-account-details" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Identity' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Identity')} />
                    )}
                />
                {expandedSection === 'Identity' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Identity Document Type</Text>
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
                            label={identity.idType === 'Passport' ? "Passport Number" : "South African ID Number (13 Digits)"}
                            value={identity.idNumber || ''}
                            onChangeText={(text) => updateField('identity', 'idNumber', text)}
                            style={styles.input}
                            keyboardType={identity.idType === 'Passport' ? "default" : "number-pad"}
                            maxLength={identity.idType === 'Passport' ? 20 : 13}
                            editable={isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 5. Demographics Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Demographics (Optional)"
                    subtitle={expandedSection !== 'Demographics' ? demographicsSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
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
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Race (EEA Reporting)</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'African', value: 'African' },
                                { label: 'Coloured', value: 'Coloured' },
                                { label: 'Asian / Indian', value: 'Asian' },
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
                                { label: 'Physical', value: 'Physical' },
                                { label: 'Visual', value: 'Visual' },
                                { label: 'Hearing', value: 'Hearing' },
                                { label: 'Intellectual', value: 'Intellectual' },
                                { label: 'Chronic Illness', value: 'Chronic Illness' },
                                { label: 'Other', value: 'Other' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Disability"
                            value={['None', 'Physical', 'Visual', 'Hearing', 'Intellectual', 'Chronic Illness'].includes(demographics.Disability) ? demographics.Disability : (demographics.Disability ? 'Other' : 'None')}
                            onChange={item => updateField('demographics', 'Disability', item.value)}
                            disable={!isEditMode}
                        />
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
                            searchPlaceholder="Search nationality..."
                            disable={!isEditMode}
                        />
                    </Card.Content>
                )}
            </Card>

            {/* 6. Licensing Section */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title="Licensing"
                    subtitle={expandedSection !== 'Licensing' ? licensingSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
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
                            placeholder="Select Motor Vehicle License"
                            value={licensing.Drivers || 'None'}
                            onChange={item => updateField('licensing', 'Drivers', item.value)}
                            disable={!isEditMode}
                        />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Motorcycle Drivers License</Text>
                        <Dropdown
                            style={styles.dropdown}
                            dropdownPosition="auto"
                            data={[
                                { label: 'No Motorcycle Drivers License', value: 'None' },
                                { label: '🏍️ Code A1 (Motorcycle <= 125cc)', value: 'Code A1' },
                                { label: '🏍️ Code A (Motorcycle > 125cc)', value: 'Code A' }
                            ]}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Motorcycle License"
                            value={licensing.Motorcycle || 'None'}
                            onChange={item => updateField('licensing', 'Motorcycle', item.value)}
                            disable={!isEditMode}
                        />
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

            {/* 8. Languages Section (Dropdown List & Competency Guard) */}
            <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Card.Title
                    title={`Languages (${languages.length})`}
                    subtitle={expandedSection !== 'Languages' ? languagesSummary : undefined}
                    titleStyle={{ color: theme.textPrimary, fontWeight: 'bold' }}
                    subtitleStyle={{ color: theme.textSecondary, fontSize: 11 }}
                    left={(props) => <IconButton {...props} icon="translate" iconColor={theme.accent} />}
                    right={(props) => (
                        <IconButton {...props} icon={expandedSection === 'Languages' ? "chevron-up" : "chevron-down"} iconColor={theme.textPrimary} onPress={() => toggleSection('Languages')} />
                    )}
                />
                {expandedSection === 'Languages' && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
                        {languages.map((lang: any, index: number) => {
                            const isLanguageSelected = Boolean(
                                lang.Language && (lang.Language !== 'Other' || (lang.customLanguage && lang.customLanguage.trim()))
                            );

                            return (
                                <View key={index} style={[styles.repeaterBox, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Select Language</Text>
                                    <Dropdown
                                        style={styles.dropdown}
                                        dropdownPosition="auto"
                                        maxHeight={250}
                                        data={languagesData}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Choose a language..."
                                        value={lang.Language || ''}
                                        onChange={item => updateLanguage(index, 'Language', item.value)}
                                        search
                                        searchPlaceholder="Search language..."
                                        disable={!isEditMode}
                                    />

                                    {lang.Language === 'Other' && (
                                        <TextInput
                                            label="Specify Language Name (e.g. Polish, Yoruba, Korean)"
                                            value={lang.customLanguage || ''}
                                            onChangeText={(text) => updateLanguage(index, 'customLanguage', text)}
                                            style={styles.input}
                                            editable={isEditMode}
                                        />
                                    )}

                                    <Text style={[styles.label, { color: isLanguageSelected ? theme.textSecondary : '#64748b' }]}>
                                        Competency / Proficiency {!isLanguageSelected ? (lang.Language === 'Other' ? '(Specify language name first)' : '(Select language first)') : ''}
                                    </Text>
                                    <Dropdown
                                        style={[styles.dropdown, !isLanguageSelected && { opacity: 0.5 }]}
                                        dropdownPosition="auto"
                                        data={PROFICIENCY_LEVELS}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Proficiency"
                                        value={lang.proficiency || 'Basic'}
                                        onChange={item => updateLanguage(index, 'proficiency', item.value)}
                                        disable={!isEditMode || !isLanguageSelected}
                                    />

                                    {isEditMode && languages.length > 1 && (
                                        <IconButton
                                            icon="delete"
                                            iconColor="#ef4444"
                                            size={20}
                                            onPress={() => removeLanguage(index)}
                                            style={styles.deleteBtn}
                                        />
                                    )}
                                </View>
                            );
                        })}
                        {isEditMode && (
                            <Button mode="outlined" icon="plus" textColor={theme.accent} onPress={addLanguage} style={{ borderColor: theme.accent, marginTop: 4, alignSelf: 'flex-start' }}>
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
    card: { marginBottom: 12, borderRadius: 12, borderWidth: 1 },
    input: { marginBottom: 8 },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
    dropdown: {
        height: 48,
        borderWidth: 1,
        borderColor: '#475569',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
        backgroundColor: '#0f172a'
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8
    },
    repeaterBox: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10
    },
    addressAccordionBox: {
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden'
    },
    addressAccordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    deleteBtn: { alignSelf: 'flex-end', margin: 0 }
});

export default PersonalDetails;
