import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeData } from '../../types/resume';

const A4_RATIO = 1.4142;
const VIGNETTE_PADDING = 12;

interface NativeVignetteProps {
    data: ResumeData | any;
    layout?: string;
    glow?: string | null;
    exportFormat?: string;
    fitMode?: string;
    uiSettings?: any;
}

const NativeVignette_Preview: React.FC<NativeVignetteProps> = ({ data, layout = 'professional', glow = null, exportFormat = 'pdf', fitMode = 'a4', uiSettings = null }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    if (!data) return null;

    // Dual-axis responsive dimensions for 100% paper edge visibility
    const availableWidth = Math.max(windowWidth - 24, 280);
    const availableHeight = Math.max(windowHeight - 200, 360);

    let scale = 1;
    if (fitMode === 'a4' || fitMode === 'page') {
        const scaleX = availableWidth / 794;
        const scaleY = availableHeight / (794 * A4_RATIO);
        scale = Math.min(scaleX, scaleY) * 0.94; // 0.94 guarantees 100% sheet & shadow visibility with breathing margin
    } else {
        scale = (availableWidth - 16) / 794;
    }

    const pageWidth = Math.max(794 * scale, 260);
    const pageHeight = fitMode === 'page' ? Math.min(availableHeight * 0.94, pageWidth * A4_RATIO) : (pageWidth * A4_RATIO);

    // Glow setup
    const getGlowColor = () => {
        switch (glow) {
            case 'source': return '#A855F7'; // Purple
            case 'target': return '#0EA5E9'; // Sky Blue
            case 'amber': return '#F59E0B';  // Amber
            case 'red': return '#EF4444';    // Red
            default: return 'transparent';
        }
    };

    const glowColor = getGlowColor();

    const pd = data["personal details"] || data.personal || {};
    const names = pd.names || {};
    const contact = pd.contact || {};
    const address = pd.address || {};
    const identity = pd.identity || {};
    const licensing = pd.licensing || {};
    const demographics = pd.demographics || {};
    const legal = pd.legal || {};
    const languages = pd.languages || [];
    const expList = data.experience || [];
    const eduList = data.education || { tertiary: [], highschool: {} };
    const skills = data.skills || data.Skills || {};
    const summary = data["professional summary"];
    const refList = (data.References || data.references || []).filter((r: any) => r.visible !== false);

    // Master Field Visibility Map
    const vis = data.visibility || {};
    const isFieldVisible = (key: string) => vis[key] !== false;

    // Names presentation respecting visibility and formatting tokens
    const rawFirst = isFieldVisible('pd_name_first') ? (names.firstName || '') : '';
    const rawSurname = isFieldVisible('pd_name_surname') ? (names.Surname || '') : '';
    let middleStr = '';
    if (isFieldVisible('pd_name_middle') && (names.middleName || names.MiddleName)) {
        const m = names.middleName || names.MiddleName;
        if (uiSettings?.MiddleNameFormat === 'initial') {
            middleStr = `${m.charAt(0)}.`;
        } else if (uiSettings?.MiddleNameFormat !== 'omit') {
            middleStr = m;
        }
    }
    let maidenStr = '';
    if (isFieldVisible('pd_name_maiden') && names.MaidenName) {
        if (uiSettings?.MaidenNameFormat === 'hyphen') {
            maidenStr = `- ${names.MaidenName}`;
        } else if (uiSettings?.MaidenNameFormat !== 'omit') {
            maidenStr = `(née ${names.MaidenName})`;
        }
    }

    let fullName = [rawFirst, middleStr, maidenStr, rawSurname].filter(Boolean).join(' ');
    if (!fullName.trim()) fullName = 'Job Applicant';
    if (uiSettings?.NameCase === 'upper') {
        fullName = fullName.toUpperCase();
    }

    // Contact separator
    const getContactSeparator = () => {
        switch (uiSettings?.ContactSeparator) {
            case 'pipe': return ' | ';
            case 'comma': return ', ';
            case 'slash': return ' / ';
            case 'dot':
            default: return ' • ';
        }
    };
    const contactSep = getContactSeparator();

    // Contact elements respecting visibility
    const contactElements: string[] = [];
    if (contact.Email && isFieldVisible('pd_contact_email')) {
        contactElements.push(uiSettings?.ContactDisplayMode === 'keyValue' ? `Email: ${contact.Email}` : (uiSettings?.ContactDisplayMode === 'valuesOnly' ? contact.Email : `📧 ${contact.Email}`));
    }
    if (contact.Phone && isFieldVisible('pd_contact_phone')) {
        contactElements.push(uiSettings?.ContactDisplayMode === 'keyValue' ? `Phone: ${contact.Phone}` : (uiSettings?.ContactDisplayMode === 'valuesOnly' ? contact.Phone : `📱 ${contact.Phone}`));
    }
    if ((contact.AltPhone || contact["Phone-alt"]) && isFieldVisible('pd_contact_alt_phone')) {
        const p = contact.AltPhone || contact["Phone-alt"];
        contactElements.push(uiSettings?.ContactDisplayMode === 'keyValue' ? `Alt Phone: ${p}` : (uiSettings?.ContactDisplayMode === 'valuesOnly' ? p : `📱 ${p}`));
    }
    if (contact.LinkedIn && isFieldVisible('pd_contact_linkedin')) {
        contactElements.push(uiSettings?.ContactDisplayMode === 'keyValue' ? `LinkedIn: ${contact.LinkedIn}` : (uiSettings?.ContactDisplayMode === 'valuesOnly' ? contact.LinkedIn : `🔗 ${contact.LinkedIn}`));
    }
    if ((contact.Website || contact.Portfolio) && isFieldVisible('pd_contact_website')) {
        const w = contact.Website || contact.Portfolio;
        contactElements.push(uiSettings?.ContactDisplayMode === 'keyValue' ? `Website: ${w}` : (uiSettings?.ContactDisplayMode === 'valuesOnly' ? w : `🌐 ${w}`));
    }

    // Addresses respecting individual visibility
    const addressList = (pd.addresses || []).filter((a: any, idx: number) => a.visible !== false && isFieldVisible(`pd_addr_${idx}`));
    const addressStrings = addressList.map((a: any, idx: number) => {
        const parts: string[] = [];
        const isMasked = isFieldVisible(`pd_addr_mask_${idx}`) === false || uiSettings?.AddressMaskStreet;
        const includeStand = isFieldVisible(`pd_addr_stand_${idx}`) !== false && uiSettings?.AddressIncludeStand !== false;

        if (a.unitOrFlatNo || a.buildingName) {
            parts.push([a.unitOrFlatNo, a.buildingName].filter(Boolean).join(' '));
        }
        if (a.unitNo || a.complexName) {
            parts.push([a.unitNo, a.complexName].filter(Boolean).join(' '));
        }
        if (a.streetName) {
            const streetLine = isMasked ? `**** ${a.streetName}` : [a.streetNumber, a.streetName].filter(Boolean).join(' ');
            parts.push(streetLine);
        }
        if (includeStand && a.standNumber) {
            parts.push(`Stand: ${isMasked ? '****' : a.standNumber}`);
        }
        if (a.villageName || a.traditionalAuthorityOrTribalCouncil) {
            parts.push([a.standOrErfOrHouseNo, a.villageName, a.traditionalAuthorityOrTribalCouncil].filter(Boolean).join(', '));
        }
        if (a.shackOrSectionOrStandNo || a.settlementName) {
            parts.push([a.shackOrSectionOrStandNo, a.settlementName, a.sectionOrBlock, a.nearestLandmarkOrZone].filter(Boolean).join(', '));
        }
        if (a.farmName || a.portionOrPlotNo) {
            parts.push([a.portionOrPlotNo, a.farmName, a.roadOrRoute].filter(Boolean).join(', '));
        }
        if (a.boxOrBagNumber) {
            parts.push(`${a.boxOrBagType || 'P.O. Box'} ${a.boxOrBagNumber}${a.postOfficeName ? `, ${a.postOfficeName}` : ''}`);
        }
        if (a.suburbOrTownship || a.suburbOrVillage) {
            parts.push(a.suburbOrTownship || a.suburbOrVillage);
        }
        if (a.cityOrTown) {
            parts.push(a.cityOrTown);
        }
        if (uiSettings?.AddressIncludeProvince !== false && a.province) {
            parts.push(a.province);
        }
        if (uiSettings?.AddressIncludePostalCode !== false && a.postalCode) {
            parts.push(a.postalCode);
        }
        if (parts.length === 0 && a.streetAddress) {
            parts.push(a.streetAddress);
        }

        const isInline = uiSettings?.AddressFormat === 'comma';
        return parts.join(isInline ? ', ' : '\n');
    });

    const addressText = addressStrings.length > 0 ? addressStrings.join(' | ') : (address["Home Address"] ? address["Home Address"] : '');

    // Calculate content density for 1-Page Fitting
    const totalItemCount = expList.length + (eduList.tertiary?.length || 0) + (eduList.artisanalCertifications?.length || 0) + (refList.length || 0) + (skills.Tech ? 1 : 0) + (summary ? 1 : 0);
    const isDense = fitMode === 'page' || totalItemCount > 5;

    // Density Scale Tokens
    const pagePadding = isDense ? 20 : 24;
    const nameFontSize = isDense ? 20 : 24;
    const sectionMargin = isDense ? 12 : 18;
    const bodyFontSize = isDense ? 11 : 12;
    const bodyLineHeight = isDense ? 15 : 17;

    const renderHeader = () => {
        if (layout === 'modern') {
            return (
                <View style={[styles.headerModern, { marginHorizontal: -pagePadding, marginTop: -pagePadding, padding: pagePadding }]}>
                    <Text style={[styles.nameModern, { fontSize: nameFontSize }]}>{fullName}</Text>
                    <View style={styles.contactRowModern}>
                        {contactElements.map((c, i) => (
                            <Text key={i} style={styles.contactTextModern}>{c}</Text>
                        ))}
                    </View>
                </View>
            );
        } else if (layout === 'minimalist') {
            return (
                <View style={styles.headerMinimalist}>
                    <Text style={[styles.nameMinimalist, { fontSize: nameFontSize - 2 }]}>{fullName}</Text>
                    <Divider style={{ marginVertical: 8 }} />
                    {contactElements.length > 0 && (
                        <Text style={styles.contactTextMinimalist}>
                            {contactElements.join(contactSep)}
                        </Text>
                    )}
                </View>
            );
        } else if (layout === 'chronological') {
            return (
                <View style={styles.headerChrono}>
                    <View style={styles.headerChronoMain}>
                        <Text style={[styles.nameChrono, { fontSize: nameFontSize }]}>{fullName}</Text>
                        <Text style={styles.titleChrono}>{expList[0]?.Role || 'Professional'}</Text>
                    </View>
                    {contactElements.length > 0 && (
                        <View style={styles.contactBoxChrono}>
                            {contactElements.map((c, i) => (
                                <Text key={i} style={styles.contactTextChrono}>{c}</Text>
                            ))}
                        </View>
                    )}
                </View>
            );
        } else if (layout === 'functional') {
            return (
                <View style={styles.headerFunc}>
                    <Text style={[styles.nameFunc, { fontSize: nameFontSize + 4 }]}>{fullName}</Text>
                    <View style={styles.funcDivider} />
                    {contactElements.length > 0 && (
                        <Text style={styles.contactTextFunc}>{contactElements.join(contactSep)}</Text>
                    )}
                </View>
            );
        } else {
            return (
                <View style={styles.headerPro}>
                    <Text style={[styles.namePro, { fontSize: nameFontSize }]}>{fullName}</Text>
                    <View style={styles.contactRowPro}>
                        {contactElements.length > 0 && (
                            <Text style={styles.contactTextPro}>
                                {contactElements.join(contactSep)}
                            </Text>
                        )}
                        {addressText ? (
                            <Text style={styles.contactTextPro}>
                                {addressText}
                            </Text>
                        ) : null}
                    </View>
                </View>
            );
        }
    };

    const renderSectionHeader = (title: string) => {
        if (exportFormat === 'word_text') {
            return <Text style={styles.plainSectionTitle}>{title.toUpperCase()}</Text>;
        }
        const titleStyle = layout === 'minimalist' ? styles.sectionTitleMin : styles.sectionTitle;
        return <Text style={titleStyle}>{title.toUpperCase()}</Text>;
    };

    if (exportFormat === 'word_text') {
        const validWordExp = expList.filter((job: any) => job.visible !== false && ((job.Organization && job.Organization.trim().length > 0) || (job.Role && job.Role.trim().length > 0)));
        const validWordEdu = (eduList.tertiary || []).filter((edu: any) => edu.visible !== false && ((edu.Institution && edu.Institution.trim().length > 0) || (edu["Qualification Name"] && edu["Qualification Name"].trim().length > 0)));

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                    <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                        <Text style={styles.plainTextHeader}>{names.firstName} {names.Surname}</Text>
                        {contactElements.length > 0 && <Text style={styles.plainTextContact}>{contactElements.join(' | ')}</Text>}
                        {addressText ? <Text style={styles.plainTextContact}>{addressText}</Text> : null}
                        <Divider style={{ marginVertical: 10 }} />

                        {summary && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Executive Summary')}
                                <Text style={styles.plainTextBody}>{summary}</Text>
                            </View>
                        )}
                        
                        {validWordExp.length > 0 && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Professional Experience')}
                                {validWordExp.map((job: any, idx: number) => {
                                    const dateRange = [job["Start Date"], job["End Date"] || (job["Start Date"] ? 'Present' : '')].filter(Boolean).join(' - ');
                                    const resp = formatFieldItems(job["Key Responsibilities"], uiSettings?.RespFormat || uiSettings?.ResponsibilityFormat);
                                    return (
                                        <View key={idx} style={styles.entry}>
                                            <Text style={styles.plainTextBold}>{job.Organization || 'Organization'} | {job.Role || 'Role'}</Text>
                                            {dateRange ? <Text style={styles.plainTextSub}>{dateRange}</Text> : null}
                                            {resp ? <Text style={styles.plainTextBody}>{resp}</Text> : null}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {validWordEdu.length > 0 && (
                            <View style={[styles.section, { marginBottom: sectionMargin }]}>
                                {renderSectionHeader('Education')}
                                {validWordEdu.map((edu: any, idx: number) => (
                                    <View key={idx} style={styles.entry}>
                                        <Text style={styles.plainTextBold}>{edu.Institution} | {edu["Qualification Name"]}</Text>
                                        <Text style={styles.plainTextSub}>{edu.Year}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Surface>
                </View>
            </ScrollView>
        );
    }

    // Helper to safely format multi-item arrays or strings according to 'comma' vs 'bullet'/'list'
    const formatFieldItems = (val: any, format?: string) => {
        if (!val) return '';
        let items: string[] = [];
        if (Array.isArray(val)) {
            items = val
                .filter(item => typeof item === 'object' && item !== null ? item.visible !== false : true)
                .map(item => typeof item === 'object' && item !== null ? (item.name || item.text || item.skill || '') : String(item))
                .map(s => s.trim())
                .filter(Boolean);
        } else {
            items = String(val)
                .split('\n')
                .map(line => line.replace(/^[-•*]\s*/, '').trim())
                .filter(Boolean);
        }
        if (items.length === 0) return '';
        if (format === 'comma') {
            return items.join(', ');
        }
        // Default: Bulleted List
        return items.map(item => `• ${item}`).join('\n');
    };

    // Prepared Demographic Items respecting visibility
    const demoItems: { label: string; value: string }[] = [];
    if (identity.idNumber && isFieldVisible('pd_identity_number')) {
        const mask = uiSettings?.IdMask !== false && isFieldVisible('pd_identity_mask');
        const displayVal = mask && identity.idNumber.length >= 6 ? `${identity.idNumber.substring(0, 6)} **** ***` : identity.idNumber;
        demoItems.push({ label: 'ID Number', value: displayVal });
    }
    if (demographics.Nationality && isFieldVisible('pd_identity_nationality')) {
        demoItems.push({ label: 'Nationality', value: demographics.Nationality });
    }
    if (demographics.Gender && demographics.Gender !== 'None' && isFieldVisible('pd_identity_gender')) {
        demoItems.push({ label: 'Gender', value: demographics.Gender });
    }
    if (demographics.Race && demographics.Race !== 'Other' && isFieldVisible('pd_identity_race')) {
        demoItems.push({ label: 'Race', value: demographics.Race });
    }
    if ((demographics.MaritalStatus || demographics.maritalStatus) && isFieldVisible('pd_identity_marital')) {
        demoItems.push({ label: 'Marital Status', value: demographics.MaritalStatus || demographics.maritalStatus });
    }
    if ((demographics.Disability || demographics.disability) && (demographics.Disability !== 'None') && isFieldVisible('pd_identity_disability')) {
        demoItems.push({ label: 'Disability', value: demographics.Disability || demographics.disability });
    }
    if (licensing.Drivers && licensing.Drivers !== 'None' && isFieldVisible('pd_license_drivers')) {
        demoItems.push({ label: 'Drivers License', value: licensing.Drivers });
    }
    if (licensing.PrDP && isFieldVisible('pd_license_prdp')) {
        demoItems.push({ label: 'PrDP Permit', value: 'Valid Professional Driving Permit' });
    }
    if (licensing.OwnVehicle && isFieldVisible('pd_license_vehicle')) {
        demoItems.push({ label: 'Vehicle', value: 'Own Transport' });
    }
    if (legal["Criminal Record"] !== undefined && isFieldVisible('pd_identity_criminal')) {
        demoItems.push({ label: 'Criminal Record', value: legal["Criminal Record"] ? (legal.Details || 'Yes') : 'Clear / None' });
    }

    const isDemoComma = uiSettings?.DemoFormat === 'comma';

    // Filter valid non-empty collections to prevent ghost placeholders
    const validExpList = expList.filter((job: any) => job.visible !== false && ((job.Organization && job.Organization.trim().length > 0) || (job.Role && job.Role.trim().length > 0)));
    const validTertiary = (eduList.tertiary || []).filter((edu: any) => edu.visible !== false && ((edu.Institution && edu.Institution.trim().length > 0) || (edu["Qualification Name"] && edu["Qualification Name"].trim().length > 0)));
    const validArtisanal = (eduList.artisanalCertifications || []).filter((cert: any, idx: number) => cert.visible !== false && isFieldVisible(`edu_art_${idx}`) && ((cert.trade && cert.trade.trim().length > 0) || (cert.name && cert.name.trim().length > 0)));
    const validTechCerts = (eduList.technicalCertifications || []).filter((cert: any) => cert.visible !== false && cert.name && cert.name.trim().length > 0);
    const validRegCerts = (eduList.regulatoryCertifications || []).filter((cert: any) => cert.visible !== false && cert.name && cert.name.trim().length > 0);
    const hasHighschool = eduList.highschool && (eduList.highschool["Province Department"] || eduList.highschool["Year Completed"]) && eduList.highschool.visible !== false;
    const hasEducation = validTertiary.length > 0 || validArtisanal.length > 0 || validTechCerts.length > 0 || validRegCerts.length > 0 || hasHighschool;

    const techText = formatFieldItems(skills.Tech, uiSettings?.TechFormat);
    const softText = formatFieldItems(skills.Soft, uiSettings?.SoftFormat);
    const certsText = formatFieldItems(skills.Certifications || skills.Certs || skills.professionalCertifications, uiSettings?.ProfCertsFormat);
    const nonAcadText = formatFieldItems(skills.NonAcadCerts, uiSettings?.NonAcadCertsFormat);
    const hasSkills = !!(techText || softText || certsText || nonAcadText);

    const validLanguages = languages.filter((l: any) => l.visible !== false && l.Language && l.Language.trim().length > 0);
    const validRefs = refList.filter((ref: any) => (ref.name || ref.Name || '').trim().length > 0 || (ref.role || ref.Role || ref.relation || '').trim().length > 0);

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.glowWrapper, glow && { borderColor: glowColor, borderWidth: 4, elevation: 15 }]}>
                <Surface style={[styles.page, { width: pageWidth, minHeight: pageHeight, padding: pagePadding }]} elevation={4}>
                {renderHeader()}

                {/* Section Priority Logic: Functional Layout Expertise */}
                {layout === 'functional' && hasSkills && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Expertise & Skills')}
                        {techText ? <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Technical:</Text> {techText}</Text> : null}
                        {softText ? <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}><Text style={{ fontWeight: 'bold' }}>Core Competencies:</Text> {softText}</Text> : null}
                    </View>
                )}

                {/* Personal Info Meta Section */}
                {demoItems.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Personal Information')}
                        {isDemoComma ? (
                            <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                {demoItems.map(d => `${d.label}: ${d.value}`).join(' · ')}
                            </Text>
                        ) : (
                            <View style={styles.metaGrid}>
                                {demoItems.map((item, idx) => (
                                    <View key={idx} style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>{item.label}:</Text>
                                        <Text style={styles.metaValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {summary && isFieldVisible('summary_visibility') ? (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader(layout === 'functional' ? 'Professional Profile' : 'Professional Summary')}
                        <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{summary}</Text>
                    </View>
                ) : null}

                {validExpList.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Work Experience')}
                        {validExpList.map((job: any, idx: number) => {
                            const dateRange = [job["Start Date"], job["End Date"] || (job["Start Date"] ? 'Present' : '')].filter(Boolean).join(' - ');
                            const respText = formatFieldItems(job["Key Responsibilities"], uiSettings?.RespFormat || uiSettings?.ResponsibilityFormat);
                            const achieveText = formatFieldItems(job.Achievements, 'bullet');
                            const systemsText = formatFieldItems(job["Systems Used"], uiSettings?.SystemsUsedFormat);

                            return (
                                <View key={idx} style={styles.entry}>
                                    <View style={styles.entryHeader}>
                                        <Text style={styles.entryTitle} numberOfLines={1}>{job.Organization || 'Organization'}</Text>
                                        {dateRange ? <Text style={styles.entryDate}>{dateRange}</Text> : null}
                                    </View>
                                    {job.Role ? <Text style={styles.entrySubTitle}>{job.Role}</Text> : null}
                                    {respText ? (
                                        <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1 }]}>
                                            {respText}
                                        </Text>
                                    ) : null}
                                    {achieveText ? (
                                        <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1, marginTop: 4 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Key Achievements:{'\n'}</Text>
                                            {achieveText}
                                        </Text>
                                    ) : null}
                                    {systemsText ? (
                                        <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1, marginTop: 4 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Systems Used: </Text>
                                            {systemsText}
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}

                {hasEducation && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Education')}
                        {validTertiary.map((edu: any, idx: number) => {
                            const subTitle = [edu["Qualification Name"], edu.Completed === false && edu["Qualification Name"] ? '(In Progress)' : ''].filter(Boolean).join(' ');
                            return (
                                <View key={idx} style={styles.entry}>
                                    <View style={styles.entryHeader}>
                                        <Text style={styles.entryTitle} numberOfLines={1}>{edu.Institution || 'Institution'}</Text>
                                        {edu.Year ? <Text style={styles.entryDate}>{edu.Year}</Text> : null}
                                    </View>
                                    {subTitle ? <Text style={styles.entrySubTitle}>{subTitle}</Text> : null}
                                    {edu["Key Modules"] && (Array.isArray(edu["Key Modules"]) ? edu["Key Modules"].length > 0 : String(edu["Key Modules"]).trim().length > 0) && (
                                        <Text style={[styles.entryDesc, { fontSize: bodyFontSize - 1, lineHeight: bodyLineHeight - 1 }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Key Modules: </Text>
                                            {Array.isArray(edu["Key Modules"]) ? edu["Key Modules"].join(', ') : edu["Key Modules"]}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                        {validArtisanal.map((cert: any, idx: number) => (
                            <View key={`art_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>🔧 {cert.trade || cert.name}</Text>
                                    <Text style={styles.entryDate}>{cert.date_obtained || cert.dateObtained || cert.yearObtained || ''}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{[cert.issuingBodyOrSeta ? `Centre/SETA: ${cert.issuingBodyOrSeta}` : '', cert.contractOrCertificateNumber ? `Cert No: ${cert.contractOrCertificateNumber}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        {validTechCerts.map((cert: any, idx: number) => (
                            <View key={`tc_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>💻 {cert.name}</Text>
                                    <Text style={styles.entryDate}>{cert.date_obtained || cert.yearObtained || ''}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{[cert.provider ? `Provider: ${cert.provider}` : '', cert.certNumber ? `ID: ${cert.certNumber}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        {validRegCerts.map((cert: any, idx: number) => (
                            <View key={`rc_${idx}`} style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>⚖️ {cert.name}</Text>
                                    <Text style={styles.entryDate}>{cert.date_obtained || cert.yearObtained || ''}</Text>
                                </View>
                                <Text style={styles.entrySubTitle}>{[cert.issuingBody ? `Authority: ${cert.issuingBody}` : '', cert.licenseNumber ? `License: ${cert.licenseNumber}` : ''].filter(Boolean).join(' · ')}</Text>
                            </View>
                        ))}
                        {hasHighschool && (
                            <View style={styles.entry}>
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{eduList.highschool["Province Department"] || 'High School'}</Text>
                                    {eduList.highschool["Year Completed"] ? <Text style={styles.entryDate}>{eduList.highschool["Year Completed"]}</Text> : null}
                                </View>
                                <Text style={styles.entrySubTitle}>
                                    {eduList.highschool["Highest Grade Passed"] || eduList.highschool["Highest Grade/Std"] || 'Completed'}
                                    {eduList.highschool["Subjects Stream"] ? ` · Stream: ${eduList.highschool["Subjects Stream"]}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {hasSkills && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Skills & Certifications')}
                        {techText ? (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Technical Skills: </Text>
                                    {uiSettings?.TechFormat === 'comma' ? techText : ''}
                                </Text>
                                {uiSettings?.TechFormat !== 'comma' && (
                                    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, paddingLeft: 8 }]}>
                                        {techText}
                                    </Text>
                                )}
                            </View>
                        ) : null}
                        {softText ? (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Soft Skills: </Text>
                                    {uiSettings?.SoftFormat === 'comma' ? softText : ''}
                                </Text>
                                {uiSettings?.SoftFormat !== 'comma' && (
                                    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, paddingLeft: 8 }]}>
                                        {softText}
                                    </Text>
                                )}
                            </View>
                        ) : null}
                        {certsText ? (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Certifications: </Text>
                                    {uiSettings?.ProfCertsFormat === 'comma' ? certsText : ''}
                                </Text>
                                {uiSettings?.ProfCertsFormat !== 'comma' && (
                                    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, paddingLeft: 8 }]}>
                                        {certsText}
                                    </Text>
                                )}
                            </View>
                        ) : null}
                        {nonAcadText ? (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Non-Academic Certifications: </Text>
                                    {uiSettings?.NonAcadCertsFormat === 'comma' ? nonAcadText : ''}
                                </Text>
                                {uiSettings?.NonAcadCertsFormat !== 'comma' && (
                                    <Text style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight, paddingLeft: 8 }]}>
                                        {nonAcadText}
                                    </Text>
                                )}
                            </View>
                        ) : null}
                    </View>
                )}

                {validLanguages.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('Languages')}
                        {validLanguages.map((l: any, idx: number) => (
                            <Text key={idx} style={[styles.bodyText, { fontSize: bodyFontSize, lineHeight: bodyLineHeight }]}>{l.Language}: {l.proficiency || 'Fluent'}</Text>
                        ))}
                    </View>
                )}

                {validRefs.length > 0 && (
                    <View style={[styles.section, { marginBottom: sectionMargin }]}>
                        {renderSectionHeader('References')}
                        <View style={styles.refGrid}>
                            {validRefs.map((ref: any, idx: number) => {
                                const refRole = ref.role || ref.Role || ref.relation || ref.relationship || '';
                                const refOrg = ref.company || ref.org || ref.organization || '';
                                const refRoleOrg = [refRole, refOrg].filter(Boolean).join(' at ');
                                const refContact = [ref.cellPhone || ref.workPhone || ref.phone || ref.contact || '', ref.email].filter(Boolean).join(' · ');

                                return (
                                    <View key={idx} style={styles.refItem}>
                                        <Text style={styles.refName}>{ref.name || ref.Name || 'Reference'}</Text>
                                        {refRoleOrg ? <Text style={styles.refDetail}>{refRoleOrg}</Text> : null}
                                        {refContact ? <Text style={styles.refDetail}>{refContact}</Text> : null}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
                </Surface>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: VIGNETTE_PADDING, alignItems: 'center', justifyContent: 'center' },
    glowWrapper: {
        borderRadius: 4,
        overflow: 'visible',
    },
    page: {
        backgroundColor: '#ffffff',
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    // Plain Text Settings
    plainTextHeader: { fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    plainTextContact: { fontFamily: 'monospace', fontSize: 12, marginBottom: 2 },
    plainSectionTitle: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 8, textDecorationLine: 'underline' },
    plainTextBody: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
    plainTextBold: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    plainTextSub: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4 },

    // Professional Layout
    headerPro: { borderBottomWidth: 2, borderBottomColor: '#2c3e50', paddingBottom: 12, marginBottom: 16 },
    namePro: { fontWeight: 'bold', color: '#2c3e50', textTransform: 'uppercase', letterSpacing: 1 },
    contactRowPro: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' },
    contactTextPro: { fontSize: 11, color: '#555' },

    // Modern Layout
    headerModern: { backgroundColor: '#2c3e50', marginBottom: 16, overflow: 'hidden' },
    nameModern: { fontWeight: 'bold', color: 'white' },
    contactRowModern: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    contactTextModern: { fontSize: 12, color: '#ecf0f1' },

    // Minimalist Layout
    headerMinimalist: { alignItems: 'center', marginBottom: 20 },
    nameMinimalist: { fontWeight: '300', color: '#333' },
    contactTextMinimalist: { fontSize: 11, color: '#888' },

    // Chronological Layout
    headerChrono: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: '#333', paddingBottom: 12, marginBottom: 16 },
    headerChronoMain: { flex: 1 },
    nameChrono: { fontWeight: 'bold', color: '#000' },
    titleChrono: { fontSize: 13, color: '#666', marginTop: 2, textTransform: 'uppercase' },
    contactBoxChrono: { alignItems: 'flex-end' },
    contactTextChrono: { fontSize: 11, color: '#333' },

    // Functional Layout
    headerFunc: { alignItems: 'center', marginBottom: 20 },
    nameFunc: { fontWeight: 'bold', color: '#2c3e50', letterSpacing: 2 },
    funcDivider: { width: 40, height: 3, backgroundColor: '#2c3e50', marginVertical: 8 },
    contactTextFunc: { fontSize: 11, color: '#777', textTransform: 'uppercase' },

    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, marginBottom: 6 },
    sectionTitleMin: { fontSize: 12, fontWeight: 'normal', color: '#888', textAlign: 'center', marginBottom: 10 },
    
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    metaItem: { width: '50%', marginBottom: 4 },
    metaLabel: { fontSize: 10, fontWeight: 'bold', color: '#777' },
    metaValue: { fontSize: 11, color: '#333' },

    bodyText: { color: '#333' },
    
    entry: { marginBottom: 10 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryTitle: { fontSize: 12, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    entryDate: { fontSize: 11, color: '#777', marginLeft: 8 },
    entrySubTitle: { fontSize: 11, fontStyle: 'italic', color: '#555', marginVertical: 1 },
    entryDesc: { color: '#333' },

    refGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    refItem: { width: '50%', marginBottom: 8 },
    refName: { fontSize: 11, fontWeight: 'bold', color: '#333' },
    refDetail: { fontSize: 10, color: '#666' }
});

export default NativeVignette_Preview;
