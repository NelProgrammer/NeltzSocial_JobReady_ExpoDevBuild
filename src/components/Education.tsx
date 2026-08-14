import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Card, IconButton, Divider, Text, Portal, Dialog } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { ProfessionalCertItem, TechCertItem, RegulatoryCertItem, TertiaryEducationItem } from '../types/resume';

interface EducationProps {
    isEditMode?: boolean;
}

const MONTHS = [
    { label: 'Jan', value: '01' },
    { label: 'Feb', value: '02' },
    { label: 'Mar', value: '03' },
    { label: 'Apr', value: '04' },
    { label: 'May', value: '05' },
    { label: 'Jun', value: '06' },
    { label: 'Jul', value: '07' },
    { label: 'Aug', value: '08' },
    { label: 'Sep', value: '09' },
    { label: 'Oct', value: '10' },
    { label: 'Nov', value: '11' },
    { label: 'Dec', value: '12' },
];

const Education: React.FC<EducationProps> = ({ isEditMode = true }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext) as any;
    
    // Level 1 category expand states
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        highschool: false,
        tertiary: false,
        professional: false,
        technical: false,
        regulatory: false
    });

    // Level 2 sub-item expand states
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Calendar Picker Dialog State
    const [pickerVisible, setPickerVisible] = useState<boolean>(false);
    const [pickerTitle, setPickerTitle] = useState<string>('Select Year / Date');
    const [pickerValueSetter, setPickerValueSetter] = useState<((val: string) => void) | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>('01');

    if (!resumeData || !updateResumeData) return null;

    const education = resumeData.education || {};
    const highschool = education.highschool || {};
    const tertiary: TertiaryEducationItem[] = education.tertiary || [];
    const profCerts: ProfessionalCertItem[] = education.professionalCertifications || [];
    const techCerts: TechCertItem[] = education.technicalCertifications || [];
    const regCerts: RegulatoryCertItem[] = education.regulatoryCertifications || [];

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const openCalendarPicker = (title: string, currentVal: any, onSelect: (dateStr: string) => void) => {
        if (!isEditMode) return;
        setPickerTitle(title);
        setPickerValueSetter(() => onSelect);

        const valStr = String(currentVal || '');
        if (valStr.includes('-')) {
            const parts = valStr.split('-');
            const yearNum = parseInt(parts[0], 10);
            if (!isNaN(yearNum)) setSelectedYear(yearNum);
            if (parts[1]) setSelectedMonth(parts[1]);
        } else {
            const yearNum = parseInt(valStr, 10);
            if (!isNaN(yearNum) && yearNum > 1950 && yearNum < 2100) {
                setSelectedYear(yearNum);
            } else {
                setSelectedYear(new Date().getFullYear());
            }
            setSelectedMonth('01');
        }

        setPickerVisible(true);
    };

    const applyCalendarDate = (dateVal: string) => {
        if (pickerValueSetter) {
            pickerValueSetter(dateVal);
        }
        setPickerVisible(false);
    };

    const getCsvSummary = (items: any[], nameKey: string) => {
        const names = items.map(i => (i[nameKey] || '').trim()).filter(Boolean);
        if (names.length === 0) return 'CSV: No items added';
        const joined = names.join(', ');
        return `CSV: ${joined.length > 70 ? `${joined.substring(0, 67)}...` : joined}`;
    };

    // --- High School ---
    const updateHighSchool = (key: string, value: any) => {
        if (!isEditMode) return;
        const newEdu = { ...education, highschool: { ...highschool, [key]: value } };
        updateResumeData({ ...resumeData, education: newEdu });
    };

    // --- Tertiary ---
    const addTertiary = () => {
        if (!isEditMode) return;
        const itemId = `edu_tertiary_${Date.now()}_${tertiary.length + 1}`;
        const newQual: TertiaryEducationItem = {
            id: itemId,
            "Institution": "", "Qualification Name": "", "NQF Level": "", "Year": "", Completed: true, visible: true
        };
        updateResumeData({ ...resumeData, education: { ...education, tertiary: [...tertiary, newQual] } });
        setExpandedCategories(prev => ({ ...prev, tertiary: true }));
        setExpandedItems(prev => ({ ...prev, [itemId]: true }));
    };

    const removeTertiary = (index: number) => {
        if (!isEditMode) return;
        Alert.alert("Remove Qualification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...tertiary];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, tertiary: newList } });
                }
            }
        ]);
    };

    const updateTertiary = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newList = [...tertiary];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, tertiary: newList } });
    };

    // --- Professional Certifications ---
    const addProfCert = () => {
        if (!isEditMode) return;
        const itemId = `edu_prof_${Date.now()}_${profCerts.length + 1}`;
        const newCert: ProfessionalCertItem = {
            id: itemId, name: '', institution: '', yearObtained: '', certNumber: '', visible: true
        };
        updateResumeData({ ...resumeData, education: { ...education, professionalCertifications: [...profCerts, newCert] } });
        setExpandedCategories(prev => ({ ...prev, professional: true }));
        setExpandedItems(prev => ({ ...prev, [itemId]: true }));
    };

    const removeProfCert = (index: number) => {
        if (!isEditMode) return;
        Alert.alert("Remove Certification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...profCerts];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, professionalCertifications: newList } });
                }
            }
        ]);
    };

    const updateProfCert = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newList = [...profCerts];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, professionalCertifications: newList } });
    };

    // --- Technical Certifications ---
    const addTechCert = () => {
        if (!isEditMode) return;
        const itemId = `edu_tech_${Date.now()}_${techCerts.length + 1}`;
        const newCert: TechCertItem = {
            id: itemId, name: '', provider: '', yearObtained: '', certNumber: '', visible: true
        };
        updateResumeData({ ...resumeData, education: { ...education, technicalCertifications: [...techCerts, newCert] } });
        setExpandedCategories(prev => ({ ...prev, technical: true }));
        setExpandedItems(prev => ({ ...prev, [itemId]: true }));
    };

    const removeTechCert = (index: number) => {
        if (!isEditMode) return;
        Alert.alert("Remove Technical Certification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...techCerts];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, technicalCertifications: newList } });
                }
            }
        ]);
    };

    const updateTechCert = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newList = [...techCerts];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, technicalCertifications: newList } });
    };

    // --- Regulatory Certifications ---
    const addRegCert = () => {
        if (!isEditMode) return;
        const itemId = `edu_reg_${Date.now()}_${regCerts.length + 1}`;
        const newCert: RegulatoryCertItem = {
            id: itemId, name: '', issuingBody: '', licenseNumber: '', yearObtained: '', expiryYear: '', visible: true
        };
        updateResumeData({ ...resumeData, education: { ...education, regulatoryCertifications: [...regCerts, newCert] } });
        setExpandedCategories(prev => ({ ...prev, regulatory: true }));
        setExpandedItems(prev => ({ ...prev, [itemId]: true }));
    };

    const removeRegCert = (index: number) => {
        if (!isEditMode) return;
        Alert.alert("Remove Regulatory Certification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: "destructive",
                onPress: () => {
                    const newList = [...regCerts];
                    newList.splice(index, 1);
                    updateResumeData({ ...resumeData, education: { ...education, regulatoryCertifications: newList } });
                }
            }
        ]);
    };

    const updateRegCert = (index: number, key: string, value: any) => {
        if (!isEditMode) return;
        const newList = [...regCerts];
        newList[index] = { ...newList[index], [key]: value };
        updateResumeData({ ...resumeData, education: { ...education, regulatoryCertifications: newList } });
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
            {/* Category 1: High School */}
            <Card style={styles.card}>
                <Card.Title
                    title="🏫 High School"
                    subtitle={highschool["Province Department"] ? `CSV: ${highschool["Province Department"]} (${highschool["Year Completed"] || ''})` : 'CSV: No high school added'}
                    subtitleNumberOfLines={2}
                    titleStyle={styles.catTitle}
                    subtitleStyle={styles.catSubtitle}
                    left={(props) => <IconButton {...props} icon="school" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={expandedCategories.highschool ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('highschool')}
                        />
                    )}
                />
                {expandedCategories.highschool && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        <TextInput
                            label="School Name / Province"
                            value={highschool["Province Department"] || ''}
                            onChangeText={(text) => updateHighSchool("Province Department", text)}
                            style={styles.input}
                            editable={isEditMode}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                style={{ flex: 1, marginRight: 5 }}
                                onPress={() => openCalendarPicker("High School Year Completed", highschool["Year Completed"], (val) => updateHighSchool("Year Completed", val))}
                                disabled={!isEditMode}
                                activeOpacity={0.8}
                            >
                                <TextInput
                                    label="Year Completed"
                                    value={String(highschool["Year Completed"] || '')}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="calendar" onPress={() => openCalendarPicker("High School Year Completed", highschool["Year Completed"], (val) => updateHighSchool("Year Completed", val))} />}
                                    right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("High School Year Completed", highschool["Year Completed"], (val) => updateHighSchool("Year Completed", val))} />}
                                    placeholder="YYYY or YYYY-MM"
                                    editable={false}
                                    pointerEvents="none"
                                />
                            </TouchableOpacity>

                            <TextInput
                                label="Highest Grade Passed"
                                value={String(highschool["Highest Grade Passed"] || '')}
                                onChangeText={(text) => updateHighSchool("Highest Grade Passed", text)}
                                style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                editable={isEditMode}
                            />
                        </View>
                    </Card.Content>
                )}
            </Card>

            {/* Category 2: Tertiary Education */}
            <Card style={styles.card}>
                <Card.Title
                    title={`🎓 Tertiary / Higher Education (${tertiary.length})`}
                    subtitle={getCsvSummary(tertiary, 'Qualification Name')}
                    subtitleNumberOfLines={2}
                    titleStyle={styles.catTitle}
                    subtitleStyle={styles.catSubtitle}
                    left={(props) => <IconButton {...props} icon="file-certificate-outline" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={expandedCategories.tertiary ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('tertiary')}
                        />
                    )}
                />
                {expandedCategories.tertiary && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {tertiary.length === 0 ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyText}>ℹ️ No tertiary qualifications added yet.</Text></View>
                        ) : (
                            tertiary.map((qual, index) => {
                                const itemId = qual.id || `tert_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {qual["Qualification Name"] ? `🎓 ${qual["Qualification Name"]}` : `Qualification #${index + 1}`}
                                                {qual.Institution ? ` (${qual.Institution})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton icon={isItemExpanded ? "chevron-up" : "chevron-down"} size={20} onPress={() => toggleItem(itemId)} />
                                                {isEditMode && <IconButton icon="delete" iconColor="#B00020" size={20} onPress={() => removeTertiary(index)} />}
                                            </View>
                                        </View>
                                        {isItemExpanded && (
                                            <View style={{ marginTop: 8 }}>
                                                <Divider style={{ marginBottom: 8 }} />
                                                <TextInput label="Qualification Name" value={qual["Qualification Name"] || ''} onChangeText={(text) => updateTertiary(index, 'Qualification Name', text)} style={styles.input} editable={isEditMode} />
                                                <TextInput label="Institution" value={qual["Institution"] || ''} onChangeText={(text) => updateTertiary(index, 'Institution', text)} style={styles.input} editable={isEditMode} />
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginRight: 5 }}
                                                        onPress={() => openCalendarPicker("Tertiary Year Completed", qual["Year"], (val) => updateTertiary(index, 'Year', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Year Completed"
                                                            value={String(qual["Year"] || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar" onPress={() => openCalendarPicker("Tertiary Year Completed", qual["Year"], (val) => updateTertiary(index, 'Year', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Tertiary Year Completed", qual["Year"], (val) => updateTertiary(index, 'Year', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>

                                                    <TextInput label="NQF Level (Optional)" value={String(qual["NQF Level"] || '')} onChangeText={(text) => updateTertiary(index, 'NQF Level', text)} style={[styles.input, { flex: 1, marginLeft: 5 }]} editable={isEditMode} />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && <Button mode="contained" icon="plus" onPress={addTertiary} style={styles.addBtn}>Add Tertiary Qualification</Button>}
                    </Card.Content>
                )}
            </Card>

            {/* Category 3: Professional Certifications */}
            <Card style={styles.card}>
                <Card.Title
                    title={`📜 Professional Certifications (${profCerts.length})`}
                    subtitle={getCsvSummary(profCerts, 'name')}
                    subtitleNumberOfLines={2}
                    titleStyle={styles.catTitle}
                    subtitleStyle={styles.catSubtitle}
                    left={(props) => <IconButton {...props} icon="badge-account-horizontal-outline" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={expandedCategories.professional ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('professional')}
                        />
                    )}
                />
                {expandedCategories.professional && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {profCerts.length === 0 ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyText}>ℹ️ No professional certifications added yet.</Text></View>
                        ) : (
                            profCerts.map((cert, index) => {
                                const itemId = cert.id || `prof_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {cert.name ? `📜 ${cert.name}` : `Certification #${index + 1}`}
                                                {cert.institution ? ` (${cert.institution})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton icon={isItemExpanded ? "chevron-up" : "chevron-down"} size={20} onPress={() => toggleItem(itemId)} />
                                                {isEditMode && <IconButton icon="delete" iconColor="#B00020" size={20} onPress={() => removeProfCert(index)} />}
                                            </View>
                                        </View>
                                        {isItemExpanded && (
                                            <View style={{ marginTop: 8 }}>
                                                <Divider style={{ marginBottom: 8 }} />
                                                <TextInput label="Certification Name" value={cert.name || ''} onChangeText={(text) => updateProfCert(index, 'name', text)} style={styles.input} editable={isEditMode} />
                                                <TextInput label="Issuing Body / Institution" value={cert.institution || ''} onChangeText={(text) => updateProfCert(index, 'institution', text)} style={styles.input} editable={isEditMode} />
                                                
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginRight: 5 }}
                                                        onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateProfCert(index, 'yearObtained', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Year Obtained"
                                                            value={String(cert.yearObtained || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar" onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateProfCert(index, 'yearObtained', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateProfCert(index, 'yearObtained', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginLeft: 5 }}
                                                        onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateProfCert(index, 'expiryYear', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Expiry Year"
                                                            value={String(cert.expiryYear || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar-end" onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateProfCert(index, 'expiryYear', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateProfCert(index, 'expiryYear', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                                <TextInput label="Registration No." value={cert.certNumber || ''} onChangeText={(text) => updateProfCert(index, 'certNumber', text)} style={styles.input} editable={isEditMode} />
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && <Button mode="contained" icon="plus" onPress={addProfCert} style={styles.addBtn}>Add Professional Certification</Button>}
                    </Card.Content>
                )}
            </Card>

            {/* Category 4: Technical Certifications */}
            <Card style={styles.card}>
                <Card.Title
                    title={`💻 Technical Certifications (${techCerts.length})`}
                    subtitle={getCsvSummary(techCerts, 'name')}
                    subtitleNumberOfLines={2}
                    titleStyle={styles.catTitle}
                    subtitleStyle={styles.catSubtitle}
                    left={(props) => <IconButton {...props} icon="laptop-account" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={expandedCategories.technical ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('technical')}
                        />
                    )}
                />
                {expandedCategories.technical && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {techCerts.length === 0 ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyText}>ℹ️ No technical certifications added yet (e.g. AWS, Cisco CCNA, CompTIA).</Text></View>
                        ) : (
                            techCerts.map((cert, index) => {
                                const itemId = cert.id || `tech_cert_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {cert.name ? `💻 ${cert.name}` : `Technical Cert #${index + 1}`}
                                                {cert.provider ? ` (${cert.provider})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton icon={isItemExpanded ? "chevron-up" : "chevron-down"} size={20} onPress={() => toggleItem(itemId)} />
                                                {isEditMode && <IconButton icon="delete" iconColor="#B00020" size={20} onPress={() => removeTechCert(index)} />}
                                            </View>
                                        </View>
                                        {isItemExpanded && (
                                            <View style={{ marginTop: 8 }}>
                                                <Divider style={{ marginBottom: 8 }} />
                                                <TextInput label="Technical Cert Name (e.g. AWS Architect, CCNA)" value={cert.name || ''} onChangeText={(text) => updateTechCert(index, 'name', text)} style={styles.input} editable={isEditMode} />
                                                <TextInput label="Provider / Platform (e.g. AWS, Cisco, Microsoft)" value={cert.provider || ''} onChangeText={(text) => updateTechCert(index, 'provider', text)} style={styles.input} editable={isEditMode} />
                                                
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginRight: 5 }}
                                                        onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateTechCert(index, 'yearObtained', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Year Obtained"
                                                            value={String(cert.yearObtained || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar" onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateTechCert(index, 'yearObtained', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Year Obtained", cert.yearObtained, (val) => updateTechCert(index, 'yearObtained', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>

                                                    <TextInput label="Cert ID / License No." value={cert.certNumber || ''} onChangeText={(text) => updateTechCert(index, 'certNumber', text)} style={[styles.input, { flex: 1, marginLeft: 5 }]} editable={isEditMode} />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && <Button mode="contained" icon="plus" onPress={addTechCert} style={styles.addBtn}>Add Technical Certification</Button>}
                    </Card.Content>
                )}
            </Card>

            {/* Category 5: Regulatory & Statutory Certifications */}
            <Card style={styles.card}>
                <Card.Title
                    title={`⚖️ Regulatory & Statutory Certifications (${regCerts.length})`}
                    subtitle={getCsvSummary(regCerts, 'name')}
                    subtitleNumberOfLines={2}
                    titleStyle={styles.catTitle}
                    subtitleStyle={styles.catSubtitle}
                    left={(props) => <IconButton {...props} icon="scale-balance" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={expandedCategories.regulatory ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('regulatory')}
                        />
                    )}
                />
                {expandedCategories.regulatory && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {regCerts.length === 0 ? (
                            <View style={styles.emptyCard}><Text style={styles.emptyText}>ℹ️ No regulatory/statutory certs added yet (e.g. FSCA RE5, OHS Safety Officer, PSIRA).</Text></View>
                        ) : (
                            regCerts.map((cert, index) => {
                                const itemId = cert.id || `reg_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {cert.name ? `⚖️ ${cert.name}` : `Regulatory Cert #${index + 1}`}
                                                {cert.issuingBody ? ` (${cert.issuingBody})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton icon={isItemExpanded ? "chevron-up" : "chevron-down"} size={20} onPress={() => toggleItem(itemId)} />
                                                {isEditMode && <IconButton icon="delete" iconColor="#B00020" size={20} onPress={() => removeRegCert(index)} />}
                                            </View>
                                        </View>
                                        {isItemExpanded && (
                                            <View style={{ marginTop: 8 }}>
                                                <Divider style={{ marginBottom: 8 }} />
                                                <TextInput label="Regulatory Cert / License Name" value={cert.name || ''} onChangeText={(text) => updateRegCert(index, 'name', text)} style={styles.input} editable={isEditMode} />
                                                <TextInput label="Issuing Authority / Statutory Body" value={cert.issuingBody || ''} onChangeText={(text) => updateRegCert(index, 'issuingBody', text)} style={styles.input} editable={isEditMode} />
                                                <TextInput label="License / Practice Number" value={cert.licenseNumber || ''} onChangeText={(text) => updateRegCert(index, 'licenseNumber', text)} style={styles.input} editable={isEditMode} />
                                                
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginRight: 5 }}
                                                        onPress={() => openCalendarPicker("Year Issued", cert.yearObtained, (val) => updateRegCert(index, 'yearObtained', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Year Issued"
                                                            value={String(cert.yearObtained || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar" onPress={() => openCalendarPicker("Year Issued", cert.yearObtained, (val) => updateRegCert(index, 'yearObtained', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Year Issued", cert.yearObtained, (val) => updateRegCert(index, 'yearObtained', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={{ flex: 1, marginLeft: 5 }}
                                                        onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateRegCert(index, 'expiryYear', val))}
                                                        disabled={!isEditMode}
                                                        activeOpacity={0.8}
                                                    >
                                                        <TextInput
                                                            label="Expiry Year"
                                                            value={String(cert.expiryYear || '')}
                                                            style={styles.input}
                                                            left={<TextInput.Icon icon="calendar-end" onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateRegCert(index, 'expiryYear', val))} />}
                                                            right={<TextInput.Icon icon="calendar-month" onPress={() => openCalendarPicker("Expiry Year", cert.expiryYear, (val) => updateRegCert(index, 'expiryYear', val))} />}
                                                            placeholder="YYYY or YYYY-MM"
                                                            editable={false}
                                                            pointerEvents="none"
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && <Button mode="contained" icon="plus" onPress={addRegCert} style={styles.addBtn}>Add Regulatory Certification</Button>}
                    </Card.Content>
                )}
            </Card>

            {/* Interactive Calendar Month-Year Picker Dialog */}
            <Portal>
                <Dialog visible={pickerVisible} onDismiss={() => setPickerVisible(false)}>
                    <Dialog.Title style={{ textAlign: 'center', fontSize: 16 }}>
                        📅 {pickerTitle}
                    </Dialog.Title>
                    <Dialog.Content>
                        {/* Quick Set Full Year Only */}
                        <Button
                            mode="contained-tonal"
                            icon="calendar-check"
                            onPress={() => applyCalendarDate(String(selectedYear))}
                            style={{ marginBottom: 12, backgroundColor: '#e0e7ff' }}
                            labelStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                        >
                            Set Full Year ({selectedYear}) Only
                        </Button>

                        {/* Year Selector */}
                        <View style={styles.yearSelectorRow}>
                            <IconButton icon="chevron-left" size={24} onPress={() => setSelectedYear(y => y - 1)} />
                            <Text style={styles.yearText}>{selectedYear}</Text>
                            <IconButton icon="chevron-right" size={24} onPress={() => setSelectedYear(y => y + 1)} />
                        </View>

                        {/* Month Grid */}
                        <Text style={styles.monthGridTitle}>Select Specific Month (Optional):</Text>
                        <View style={styles.monthGrid}>
                            {MONTHS.map(m => {
                                const isSelected = selectedMonth === m.value;

                                return (
                                    <TouchableOpacity
                                        key={m.value}
                                        style={[styles.monthItem, isSelected && styles.selectedMonthItem]}
                                        onPress={() => {
                                            setSelectedMonth(m.value);
                                            applyCalendarDate(`${selectedYear}-${m.value}`);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.monthText, isSelected && styles.selectedMonthText]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setPickerVisible(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 14, backgroundColor: '#ffffff' },
    catTitle: { fontSize: 14, fontWeight: 'bold' },
    catSubtitle: { fontSize: 11, color: '#64748b' },
    subItemBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f8fafc' },
    subItemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    subItemTitle: { fontWeight: 'bold', fontSize: 13, color: '#1e293b', flex: 1 },
    input: { marginBottom: 8, backgroundColor: '#ffffff' },
    addBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#6200EE' },
    emptyCard: { padding: 12, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 10 },
    emptyText: { color: '#64748b', fontSize: 13 },
    yearSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    yearText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, color: '#1e293b' },
    monthGridTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textAlign: 'center' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monthItem: { width: '30%', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', marginBottom: 8, backgroundColor: '#f8fafc' },
    selectedMonthItem: { backgroundColor: '#6200EE', borderColor: '#6200EE' },
    monthText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
    selectedMonthText: { color: '#ffffff' }
});

export default Education;
