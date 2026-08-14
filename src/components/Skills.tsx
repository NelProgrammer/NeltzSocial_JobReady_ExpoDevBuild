import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Card, Text, Button, IconButton, SegmentedButtons, Divider } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import { ResumeSkills, TechSkillItem, SoftSkillItem, NonAcadCertItem, SystemUsedItem } from '../types/resume';

interface SkillsProps {
    isEditMode?: boolean;
}

const Skills: React.FC<SkillsProps> = ({ isEditMode = true }) => {
    const context = useContext(ResumeContext) as any;
    const resumeData = context?.resumeData;
    const updateResumeData = context?.updateResumeData;

    // Level 1: Category Section Expand State (Collapsed by default)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        Tech: false,
        Soft: false,
        NonAcadCerts: false,
        SystemsUsed: false,
    });

    // Level 2: Individual Sub-Item Card Expand State (Collapsed by default)
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    if (!resumeData || !updateResumeData) return null;

    const skills: ResumeSkills = resumeData.skills || resumeData.Skills || {};

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const getSkillItems = (field: keyof ResumeSkills): any[] => {
        const raw = skills[field];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.split('\n').filter(line => line.trim().length > 0).map((line, idx) => ({
                id: `sk_${String(field).toLowerCase()}_${idx}_${Date.now()}`,
                name: line.replace(/^-\s*/, '').trim(),
                visible: true
            }));
        }
        return [];
    };

    const getCategoryCsvSummary = (field: keyof ResumeSkills) => {
        const items = getSkillItems(field);
        const names = items.map(i => (i.name || i.text || '').trim()).filter(Boolean);
        if (names.length === 0) return 'CSV: No items added';
        const joined = names.join(', ');
        const summary = joined.length > 70 ? `${joined.substring(0, 67)}...` : joined;
        return `CSV: ${summary}`;
    };

    const updateSkillItems = (field: keyof ResumeSkills, items: any[]) => {
        if (!isEditMode) return;
        const newSkills = { ...skills, [field]: items };
        updateResumeData({ ...resumeData, skills: newSkills, Skills: newSkills });
    };

    const addSkillItem = (field: keyof ResumeSkills) => {
        if (!isEditMode) return;
        const current = getSkillItems(field);
        const newItemId = `sk_${String(field).toLowerCase()}_${Date.now()}_${current.length + 1}`;
        let newItem: any = {
            id: newItemId,
            name: '',
            visible: true
        };

        if (field === 'Tech') {
            newItem.howObtained = 'Course';
            newItem.yearsInUse = '';
        } else if (field === 'NonAcadCerts') {
            newItem.provider = '';
            newItem.yearObtained = '';
        } else if (field === 'SystemsUsed') {
            newItem.yearsInUse = '';
        }

        updateSkillItems(field, [...current, newItem]);

        // Auto-expand category & new sub-item
        setExpandedCategories(prev => ({ ...prev, [field]: true }));
        setExpandedItems(prev => ({ ...prev, [newItemId]: true }));
    };

    const updateItemProperty = (field: keyof ResumeSkills, index: number, prop: string, value: any) => {
        if (!isEditMode) return;
        const current = [...getSkillItems(field)];
        current[index] = { ...current[index], [prop]: value };
        updateSkillItems(field, current);
    };

    const removeItem = (field: keyof ResumeSkills, index: number) => {
        if (!isEditMode) return;
        const current = [...getSkillItems(field)];
        current.splice(index, 1);
        updateSkillItems(field, current);
    };

    // Category 1: Technical Skills
    const renderTechnicalSkills = () => {
        const items: TechSkillItem[] = getSkillItems('Tech');
        const isCatExpanded = !!expandedCategories.Tech;
        const csvSummary = getCategoryCsvSummary('Tech');

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={`⚡ Technical Skills (${items.length})`}
                    subtitle={csvSummary}
                    subtitleNumberOfLines={2}
                    titleStyle={{ fontSize: 14, fontWeight: 'bold' }}
                    subtitleStyle={{ fontSize: 11, color: '#64748b' }}
                    left={(props) => <IconButton {...props} icon="laptop" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={isCatExpanded ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('Tech')}
                        />
                    )}
                />
                {isCatExpanded && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>ℹ️ No technical skills added yet. Tap "+ Add Technical Skill" to get started.</Text>
                            </View>
                        ) : (
                            items.map((item, index) => {
                                const itemId = item.id || `tech_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];
                                const subTitle = [item.howObtained, item.yearsInUse ? `${item.yearsInUse} yrs` : ''].filter(Boolean).join(' · ');

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {item.name ? `⚡ ${item.name}` : `Technical Skill #${index + 1}`}
                                                {subTitle ? ` (${subTitle})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton
                                                    icon={isItemExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    onPress={() => toggleItem(itemId)}
                                                />
                                                {isEditMode && (
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor="#B00020"
                                                        size={20}
                                                        onPress={() => removeItem('Tech', index)}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {isItemExpanded && (
                                            <View style={styles.subItemContent}>
                                                <Divider style={{ marginVertical: 8 }} />
                                                <TextInput
                                                    label="Technical Skill Name"
                                                    value={item.name || ''}
                                                    onChangeText={(text) => updateItemProperty('Tech', index, 'name', text)}
                                                    style={styles.input}
                                                    placeholder="e.g. Python, TypeScript, React Native"
                                                    editable={isEditMode}
                                                />
                                                <Text style={styles.subLabel}>How Obtained</Text>
                                                <SegmentedButtons
                                                    value={item.howObtained || 'Course'}
                                                    onValueChange={val => updateItemProperty('Tech', index, 'howObtained', val)}
                                                    buttons={[
                                                        { label: 'Course', value: 'Course', disabled: !isEditMode },
                                                        { label: 'Self-Taught', value: 'Self-Taught', disabled: !isEditMode },
                                                        { label: 'On-the-Job', value: 'On-the-Job', disabled: !isEditMode }
                                                    ]}
                                                    style={styles.segmented}
                                                />
                                                <TextInput
                                                    label="Years in Use"
                                                    value={String(item.yearsInUse || '')}
                                                    onChangeText={(text) => updateItemProperty('Tech', index, 'yearsInUse', text)}
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    placeholder="e.g. 4"
                                                    editable={isEditMode}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && (
                            <Button mode="contained" icon="plus" onPress={() => addSkillItem('Tech')} style={styles.addButton}>
                                Add Technical Skill
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
        );
    };

    // Category 2: Soft / Interpersonal Skills
    const renderSoftSkills = () => {
        const items: SoftSkillItem[] = getSkillItems('Soft');
        const isCatExpanded = !!expandedCategories.Soft;
        const csvSummary = getCategoryCsvSummary('Soft');

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={`🧠 Soft / Interpersonal Skills (${items.length})`}
                    subtitle={csvSummary}
                    subtitleNumberOfLines={2}
                    titleStyle={{ fontSize: 14, fontWeight: 'bold' }}
                    subtitleStyle={{ fontSize: 11, color: '#64748b' }}
                    left={(props) => <IconButton {...props} icon="account-group" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={isCatExpanded ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('Soft')}
                        />
                    )}
                />
                {isCatExpanded && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>ℹ️ No soft skills added yet. Tap "+ Add Soft Skill" to get started.</Text>
                            </View>
                        ) : (
                            items.map((item, index) => {
                                const itemId = item.id || `soft_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {item.name ? `🧠 ${item.name}` : `Soft Skill #${index + 1}`}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton
                                                    icon={isItemExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    onPress={() => toggleItem(itemId)}
                                                />
                                                {isEditMode && (
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor="#B00020"
                                                        size={20}
                                                        onPress={() => removeItem('Soft', index)}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {isItemExpanded && (
                                            <View style={styles.subItemContent}>
                                                <Divider style={{ marginVertical: 8 }} />
                                                <TextInput
                                                    label="Soft Skill Name"
                                                    value={item.name || ''}
                                                    onChangeText={(text) => updateItemProperty('Soft', index, 'name', text)}
                                                    style={styles.input}
                                                    placeholder="e.g. Communication, Leadership, Teamwork"
                                                    editable={isEditMode}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && (
                            <Button mode="contained" icon="plus" onPress={() => addSkillItem('Soft')} style={styles.addButton}>
                                Add Soft Skill
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
        );
    };

    // Category 3: Non-Academic Certifications
    const renderNonAcadCerts = () => {
        const items: NonAcadCertItem[] = getSkillItems('NonAcadCerts');
        const isCatExpanded = !!expandedCategories.NonAcadCerts;
        const csvSummary = getCategoryCsvSummary('NonAcadCerts');

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={`📜 Non-Academic Certifications (${items.length})`}
                    subtitle={csvSummary}
                    subtitleNumberOfLines={2}
                    titleStyle={{ fontSize: 14, fontWeight: 'bold' }}
                    subtitleStyle={{ fontSize: 11, color: '#64748b' }}
                    left={(props) => <IconButton {...props} icon="certificate" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={isCatExpanded ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('NonAcadCerts')}
                        />
                    )}
                />
                {isCatExpanded && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>ℹ️ No non-academic certifications added yet. Tap "+ Add Non-Academic Cert" to get started.</Text>
                            </View>
                        ) : (
                            items.map((item, index) => {
                                const itemId = item.id || `nonacad_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];
                                const subTitle = [item.provider, item.yearObtained].filter(Boolean).join(' · ');

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {item.name ? `📜 ${item.name}` : `Certification #${index + 1}`}
                                                {subTitle ? ` (${subTitle})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton
                                                    icon={isItemExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    onPress={() => toggleItem(itemId)}
                                                />
                                                {isEditMode && (
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor="#B00020"
                                                        size={20}
                                                        onPress={() => removeItem('NonAcadCerts', index)}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {isItemExpanded && (
                                            <View style={styles.subItemContent}>
                                                <Divider style={{ marginVertical: 8 }} />
                                                <TextInput
                                                    label="Certification / Course Name"
                                                    value={item.name || ''}
                                                    onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'name', text)}
                                                    style={styles.input}
                                                    placeholder="e.g. First Aid Level 1, Agile Fundamentals"
                                                    editable={isEditMode}
                                                />
                                                <TextInput
                                                    label="Provider / Platform (Optional)"
                                                    value={item.provider || ''}
                                                    onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'provider', text)}
                                                    style={styles.input}
                                                    placeholder="e.g. Udemy, Red Cross, Coursera"
                                                    editable={isEditMode}
                                                />
                                                <TextInput
                                                    label="Year Obtained (Optional)"
                                                    value={String(item.yearObtained || '')}
                                                    onChangeText={(text) => updateItemProperty('NonAcadCerts', index, 'yearObtained', text)}
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    placeholder="e.g. 2021"
                                                    editable={isEditMode}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && (
                            <Button mode="contained" icon="plus" onPress={() => addSkillItem('NonAcadCerts')} style={styles.addButton}>
                                Add Non-Academic Cert
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
        );
    };

    // Category 4: Systems & Tools Used
    const renderSystemsUsed = () => {
        const items: SystemUsedItem[] = getSkillItems('SystemsUsed');
        const isCatExpanded = !!expandedCategories.SystemsUsed;
        const csvSummary = getCategoryCsvSummary('SystemsUsed');

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={`🛠️ Systems & Tools Used (${items.length})`}
                    subtitle={csvSummary}
                    subtitleNumberOfLines={2}
                    titleStyle={{ fontSize: 14, fontWeight: 'bold' }}
                    subtitleStyle={{ fontSize: 11, color: '#64748b' }}
                    left={(props) => <IconButton {...props} icon="wrench-clock" />}
                    right={(props) => (
                        <IconButton
                            {...props}
                            icon={isCatExpanded ? "chevron-up" : "chevron-down"}
                            onPress={() => toggleCategory('SystemsUsed')}
                        />
                    )}
                />
                {isCatExpanded && (
                    <Card.Content>
                        <Divider style={{ marginBottom: 10 }} />
                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>ℹ️ No systems or tools added yet. Tap "+ Add System / Tool" to get started.</Text>
                            </View>
                        ) : (
                            items.map((item, index) => {
                                const itemId = item.id || `sys_${index}`;
                                const isItemExpanded = !!expandedItems[itemId];
                                const subTitle = item.yearsInUse ? `${item.yearsInUse} yrs` : '';

                                return (
                                    <View key={itemId} style={styles.subItemBox}>
                                        <View style={styles.subItemHeaderRow}>
                                            <Text style={styles.subItemTitle}>
                                                {item.name ? `🛠️ ${item.name}` : `System / Software #${index + 1}`}
                                                {subTitle ? ` (${subTitle})` : ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconButton
                                                    icon={isItemExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    onPress={() => toggleItem(itemId)}
                                                />
                                                {isEditMode && (
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor="#B00020"
                                                        size={20}
                                                        onPress={() => removeItem('SystemsUsed', index)}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {isItemExpanded && (
                                            <View style={styles.subItemContent}>
                                                <Divider style={{ marginVertical: 8 }} />
                                                <TextInput
                                                    label="System / Software Name"
                                                    value={item.name || ''}
                                                    onChangeText={(text) => updateItemProperty('SystemsUsed', index, 'name', text)}
                                                    style={styles.input}
                                                    placeholder="e.g. SAP, Jira, Salesforce, Git"
                                                    editable={isEditMode}
                                                />
                                                <TextInput
                                                    label="Years in Use (Optional)"
                                                    value={String(item.yearsInUse || '')}
                                                    onChangeText={(text) => updateItemProperty('SystemsUsed', index, 'yearsInUse', text)}
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    placeholder="e.g. 3"
                                                    editable={isEditMode}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                        {isEditMode && (
                            <Button mode="contained" icon="plus" onPress={() => addSkillItem('SystemsUsed')} style={styles.addButton}>
                                Add System / Tool
                            </Button>
                        )}
                    </Card.Content>
                )}
            </Card>
        );
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
            {renderTechnicalSkills()}
            {renderSoftSkills()}
            {renderNonAcadCerts()}
            {renderSystemsUsed()}
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 15, backgroundColor: '#ffffff' },
    subItemBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f8fafc' },
    subItemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    subItemTitle: { fontWeight: 'bold', fontSize: 13, color: '#1e293b', flex: 1 },
    subItemContent: { marginTop: 4 },
    input: { marginBottom: 8, backgroundColor: '#ffffff' },
    subLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    segmented: { marginBottom: 8 },
    addButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#6200EE' },
    emptyCard: { padding: 12, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 10 },
    emptyText: { color: '#64748b', fontSize: 13 }
});

export default Skills;
