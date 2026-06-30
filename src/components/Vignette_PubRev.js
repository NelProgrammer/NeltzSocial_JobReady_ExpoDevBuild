import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const Vignette_PubRev = ({ data, layout = 'professional' }) => {
    if (!data) return null;

    const pd = data["personal details"] || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const address = pd.address || {};
    const experience = data.experience || [];
    const education = data.education || { highschool: {}, tertiary: [] };
    const skills = data.Skills || {};
    const references = data.References || [];
    const summary = data["professional summary"] || "";

    const renderHeader = () => {
        if (layout === 'modern') {
            return (
                <LinearGradient colors={['#1e293b', '#334155']} style={styles.headerModern}>
                    <Text style={styles.nameModern}>{names.Prefix !== 'None' ? names.Prefix + ' ' : ''}{names.firstName} {names.Surname}</Text>
                    <Text style={styles.contactModern}>
                        {contact.Email} {contact["Phone (Cell)"] ? `| ${contact["Phone (Cell)"]}` : ''}
                    </Text>
                    <Text style={styles.contactModern}>
                        {address.AddressType ? `[${address.AddressType}] ` : ''}{address["Home Address"]?.replace(/\n/g, ', ')}
                    </Text>
                </LinearGradient>
            );
        }

        if (layout === 'minimalist') {
            return (
                <View style={styles.headerMinimal}>
                    <Text style={styles.nameMinimal}>{names.firstName} {names.Surname}</Text>
                    <Divider style={{ marginVertical: 10, width: '40%', alignSelf: 'center' }} />
                    <Text style={styles.contactMinimal}>
                        {contact.Email} • {contact["Phone (Cell)"]}
                    </Text>
                    <Text style={styles.contactMinimal}>
                        {address.AddressType ? `[${address.AddressType}] ` : ''}{address["Home Address"]?.replace(/\n/g, ', ')}
                    </Text>
                </View>
            );
        }

        // Professional Default
        return (
            <View style={styles.headerPro}>
                <Text style={styles.namePro}>{names.Prefix !== 'None' ? names.Prefix + ' ' : ''}{names.firstName} {names.Surname}</Text>
                <View style={styles.contactProRow}>
                    <Text style={styles.contactProText}>{contact.Email}</Text>
                    <Text style={styles.contactProText}>{contact["Phone (Cell)"]}</Text>
                </View>
                <Text style={styles.contactProText}>{address.AddressType ? `[${address.AddressType}] ` : ''}{address["Home Address"]?.replace(/\n/g, ', ')}</Text>
                <Divider style={{ marginTop: 15, height: 2, backgroundColor: '#334155' }} />
            </View>
        );
    };

    const renderSectionHeader = (title) => (
        <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, layout === 'minimalist' && styles.sectionHeaderMinimal]}>
                {title.toUpperCase()}
            </Text>
            {layout !== 'minimalist' && <Divider style={styles.sectionDivider} />}
        </View>
    );

    return (
        <ScrollView style={styles.sheet} showsVerticalScrollIndicator={false}>
            {renderHeader()}

            {summary ? (
                <View style={styles.section}>
                    {renderSectionHeader('Professional Summary')}
                    <Text style={styles.bodyText}>{summary}</Text>
                </View>
            ) : null}

            {experience.length > 0 && (
                <View style={styles.section}>
                    {renderSectionHeader('Work Experience')}
                    {experience.map((exp, idx) => (
                        <View key={idx} style={styles.itemContainer}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>{exp.Organization}</Text>
                                <Text style={styles.itemDate}>{exp["Start Date"]} - {exp["End Date"] || 'Present'}</Text>
                            </View>
                            <Text style={styles.itemSubtitle}>{exp.Role}</Text>
                            <Text style={styles.bodyText}>{exp["Key Responsibilities"]}</Text>
                            {exp["Achievements"] ? (
                                <Text style={[styles.bodyText, { marginTop: 5, fontStyle: 'italic' }]}>
                                    Key Achievement: {exp["Achievements"]}
                                </Text>
                            ) : null}
                        </View>
                    ))}
                </View>
            )}

            {(education.tertiary?.length > 0 || education.highschool?.["Year Completed"]) && (
                <View style={styles.section}>
                    {renderSectionHeader('Education')}
                    {education.tertiary.map((edu, idx) => (
                        <View key={idx} style={styles.itemContainer}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>{edu.Institution}</Text>
                                <Text style={styles.itemDate}>{edu.Year}</Text>
                            </View>
                            <Text style={styles.itemSubtitle}>{edu["Qualification Name"]}</Text>
                        </View>
                    ))}
                    {education.highschool?.["Year Completed"] ? (
                        <View style={styles.itemContainer}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>{education.highschool["Province Department"]}</Text>
                                <Text style={styles.itemDate}>{education.highschool["Year Completed"]}</Text>
                            </View>
                            <Text style={styles.itemSubtitle}>{education.highschool["Highest Grade/Std"]}</Text>
                        </View>
                    ) : null}
                </View>
            )}

            {(skills.Tech || skills.Soft) && (
                <View style={styles.section}>
                    {renderSectionHeader('Skills')}
                    {skills.Tech ? (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>Technical:</Text>
                            <Text style={styles.skillValue}>{skills.Tech}</Text>
                        </View>
                    ) : null}
                    {skills.Soft ? (
                        <View style={styles.skillRow}>
                            <Text style={styles.skillLabel}>Soft Skills:</Text>
                            <Text style={styles.skillValue}>{skills.Soft}</Text>
                        </View>
                    ) : null}
                </View>
            )}

            {references.length > 0 && (
                <View style={styles.section}>
                    {renderSectionHeader('References')}
                    <View style={styles.refGrid}>
                        {references.filter(r => r.visible).map((ref, idx) => (
                            <View key={idx} style={styles.refItem}>
                                <Text style={styles.refName}>{ref.name}</Text>
                                <Text style={styles.refDetail}>{ref.relation} at {ref.org}</Text>
                                <Text style={styles.refDetail}>{ref["phone (Cell)"]}</Text>
                                <Text style={styles.refDetail}>{ref.email}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    sheet: { flex: 1, backgroundColor: '#fff', padding: 20 },
    
    // Header - Professional
    headerPro: { marginBottom: 20 },
    namePro: { fontSize: 24, fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1 },
    contactProRow: { flexDirection: 'row', marginTop: 5 },
    contactProText: { fontSize: 11, color: '#64748b', marginRight: 10 },

    // Header - Modern
    headerModern: { padding: 25, marginHorizontal: -20, marginTop: -20, marginBottom: 20 },
    nameModern: { fontSize: 28, fontWeight: '700', color: '#fff' },
    contactModern: { fontSize: 12, color: '#cbd5e1', marginTop: 4 },

    // Header - Minimal
    headerMinimal: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    nameMinimal: { fontSize: 22, fontWeight: '300', color: '#334155', textTransform: 'uppercase', letterSpacing: 4 },
    contactMinimal: { fontSize: 10, color: '#94a3b8', letterSpacing: 1 },

    section: { marginBottom: 20 },
    sectionHeaderContainer: { marginBottom: 10 },
    sectionHeader: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 4, letterSpacing: 1 },
    sectionHeaderMinimal: { textAlign: 'center', color: '#94a3b8', fontWeight: '400' },
    sectionDivider: { height: 1.5, backgroundColor: '#e2e8f0' },

    bodyText: { fontSize: 13, color: '#475569', lineHeight: 18 },
    
    itemContainer: { marginBottom: 15 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    itemDate: { fontSize: 11, color: '#64748b' },
    itemSubtitle: { fontSize: 13, fontStyle: 'italic', color: '#475569', marginBottom: 4 },

    skillRow: { flexDirection: 'row', marginBottom: 5 },
    skillLabel: { fontSize: 13, fontWeight: '700', color: '#475569', width: 80 },
    skillValue: { fontSize: 13, color: '#475569', flex: 1 },

    refGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    refItem: { width: '48%', marginBottom: 15 },
    refName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    refDetail: { fontSize: 11, color: '#64748b' }
});

export default Vignette_PubRev;
