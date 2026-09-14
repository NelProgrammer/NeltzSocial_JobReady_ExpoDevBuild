import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Switch, IconButton, Divider } from 'react-native-paper';
import { ThemedDropdown as Dropdown } from '../common/ThemedDropdown';

interface FormattingTabProps {
  uiSettings: any;
  updateUiSettings: (newSettings: any) => Promise<void> | void;
  theme: any;
  switchColors: { true: string; false: string };
  isMain: boolean;
}

export const FormattingTab: React.FC<FormattingTabProps> = ({
  uiSettings,
  updateUiSettings,
  theme,
  switchColors,
  isMain,
}) => {
  // Accordion states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    names: false,
    contact: false,
    address: false,
    identity: false,
    education: false,
    experience: false,
    skills: false,
    artisanal: false,
    languages: false,
    references: false,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const updateSetting = (key: string, value: any) => {
    if (updateUiSettings) {
      updateUiSettings({ ...uiSettings, [key]: value });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* 1. Personal Names Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="👤 Personal Names Format"
          subtitle={`${uiSettings?.NameCase === 'upper' ? 'UPPERCASE' : 'Title Case'} · Middle: ${uiSettings?.MiddleNameFormat || 'full'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="format-letter-case" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.names ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('names')}
            />
          )}
        />
        {expandedSections.names && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />
            
            <Text style={[styles.label, { color: theme.textSecondary }]}>Name Letter Case</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Title Case (John Doe)', value: 'title' },
                { label: 'UPPERCASE (JOHN DOE)', value: 'upper' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.NameCase || 'title'}
              onChange={item => updateSetting('NameCase', item.value)}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Middle Name Presentation</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Full Middle Name (John Robert Doe)', value: 'full' },
                { label: 'Middle Initial Only (John R. Doe)', value: 'initial' },
                { label: 'Omit Middle Name (John Doe)', value: 'omit' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.MiddleNameFormat || 'full'}
              onChange={item => updateSetting('MiddleNameFormat', item.value)}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Maiden Name Presentation</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Parentheses: Jane Doe (née Smith)', value: 'parentheses' },
                { label: 'Hyphenated: Jane Doe - Smith', value: 'hyphen' },
                { label: 'Omit Maiden Name', value: 'omit' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.MaidenNameFormat || 'parentheses'}
              onChange={item => updateSetting('MaidenNameFormat', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 2. Contact Details Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="✉️ Contact Details Format"
          subtitle={`${uiSettings?.ContactFormat === 'inline' ? 'Single-line Inline' : 'Bulleted List'} · ${uiSettings?.ContactDisplayMode || 'iconValue'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="email-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.contact ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('contact')}
            />
          )}
        />
        {expandedSections.contact && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Layout Alignment</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.ContactFormat === 'inline' ? 'Inline Row' : 'Bulleted Column'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.ContactFormat !== 'inline' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.ContactFormat === 'inline'}
                  onValueChange={(val) => updateSetting('ContactFormat', val ? 'inline' : 'bullet')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.ContactFormat === 'inline' ? theme.accent : theme.textSecondary }]}>Inline</Text>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Inline Separator Symbol</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Middle Dot ( • )', value: 'dot' },
                { label: 'Pipe Bar ( | )', value: 'pipe' },
                { label: 'Comma ( , )', value: 'comma' },
                { label: 'Slash ( / )', value: 'slash' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.ContactSeparator || 'dot'}
              onChange={item => updateSetting('ContactSeparator', item.value)}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Display Mode</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Icons + Values (✉ email · 📱 phone)', value: 'iconValue' },
                { label: 'Key-Value Pairs (Email: ... · Phone: ...)', value: 'keyValue' },
                { label: 'Values Only (... · ...)', value: 'valuesOnly' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.ContactDisplayMode || 'iconValue'}
              onChange={item => updateSetting('ContactDisplayMode', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 3. Addresses Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="📍 Addresses Layout & Separation"
          subtitle={`${uiSettings?.AddressFormat === 'comma' ? 'Inline Comma Paragraph' : 'Multi-Line Block'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="map-marker-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.address ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('address')}
            />
          )}
        />
        {expandedSections.address && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Address Layout Format</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.AddressFormat === 'comma' ? 'Inline Single-Line' : 'Multi-Line Structured Block'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.AddressFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Block</Text>
                <Switch
                  value={uiSettings?.AddressFormat === 'comma'}
                  onValueChange={(val) => updateSetting('AddressFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.AddressFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Inline</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Include Stand / Erf Number</Text>
              <Switch
                value={uiSettings?.AddressIncludeStand !== false}
                onValueChange={(val) => updateSetting('AddressIncludeStand', val)}
                trackColor={switchColors}
              />
            </View>

            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Include Province</Text>
              <Switch
                value={uiSettings?.AddressIncludeProvince !== false}
                onValueChange={(val) => updateSetting('AddressIncludeProvince', val)}
                trackColor={switchColors}
              />
            </View>

            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Include Postal Code</Text>
              <Switch
                value={uiSettings?.AddressIncludePostalCode !== false}
                onValueChange={(val) => updateSetting('AddressIncludePostalCode', val)}
                trackColor={switchColors}
              />
            </View>
          </Card.Content>
        )}
      </Card>

      {/* 4. Identity & Demographics Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🪪 Identity & Demographics Format"
          subtitle={`${uiSettings?.DemoFormat === 'comma' ? 'Inline Pairs' : 'Bulleted List'} · Masking: ${uiSettings?.IdMask !== false ? 'Active' : 'Off'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="card-account-details-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.identity ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('identity')}
            />
          )}
        />
        {expandedSections.identity && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Mask National ID Number (POPIA)</Text>
              <Switch
                value={uiSettings?.IdMask !== false}
                onValueChange={(val) => updateSetting('IdMask', val)}
                trackColor={switchColors}
              />
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Demographics Layout Style</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.DemoFormat === 'comma' ? 'Inline Flowing Pairs' : 'Bulleted Vertical List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.DemoFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.DemoFormat === 'comma'}
                  onValueChange={(val) => updateSetting('DemoFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.DemoFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Inline</Text>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Demographics Display Mode</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Key-Value Pairs (Gender: Male, Nationality: South African)', value: 'keyValue' },
                { label: 'Values Only (Male, South African)', value: 'valuesOnly' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.DemoDisplayMode || 'keyValue'}
              onChange={item => updateSetting('DemoDisplayMode', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 5. Education Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🎓 Education Hierarchy & Date Order"
          subtitle={`${uiSettings?.EduOrder === 'institutionFirst' ? 'Institution First' : 'Qualification First'} · ${uiSettings?.EduDateFormat || 'yearOnly'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="school-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.education ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('education')}
            />
          )}
        />
        {expandedSections.education && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Presentation Hierarchy</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Qualification First: BSc Computer Science — Wits', value: 'qualificationFirst' },
                { label: 'Institution First: University of the Witwatersrand — BSc Computer Science', value: 'institutionFirst' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.EduOrder || 'qualificationFirst'}
              onChange={item => updateSetting('EduOrder', item.value)}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Date Format</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Year Only (e.g. 2021)', value: 'yearOnly' },
                { label: 'Month & Year (e.g. Nov 2021)', value: 'monthYear' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.EduDateFormat || 'yearOnly'}
              onChange={item => updateSetting('EduDateFormat', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 6. Work Experience Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="💼 Work Experience Hierarchy & Bullets"
          subtitle={`${uiSettings?.ExpOrder === 'companyFirst' ? 'Company First' : 'Role First'} · Bullets: ${uiSettings?.RespBulletType || 'circle'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="briefcase-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.experience ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('experience')}
            />
          )}
        />
        {expandedSections.experience && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Presentation Hierarchy</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Role First: Senior Developer at ABC Corp', value: 'roleFirst' },
                { label: 'Company First: ABC Corp — Senior Developer', value: 'companyFirst' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.ExpOrder || 'roleFirst'}
              onChange={item => updateSetting('ExpOrder', item.value)}
            />

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Responsibilities Layout</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.RespFormat === 'comma' ? 'Narrative Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.RespFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.RespFormat === 'comma' || uiSettings?.ResponsibilityFormat === 'comma'}
                  onValueChange={(val) => {
                    updateSetting('RespFormat', val ? 'comma' : 'list');
                    updateSetting('ResponsibilityFormat', val ? 'comma' : 'list');
                  }}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.RespFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Paragraph</Text>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bullet Symbol</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Circle ( • )', value: 'circle' },
                { label: 'Diamond ( ◆ )', value: 'diamond' },
                { label: 'Hyphen ( - )', value: 'hyphen' },
                { label: 'Asterisk ( * )', value: 'asterisk' },
                { label: 'Arrow ( ▸ )', value: 'arrow' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.RespBulletType || 'circle'}
              onChange={item => updateSetting('RespBulletType', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 7. Skills Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🛠️ Skills Layout & Separation"
          subtitle={`Tech: ${uiSettings?.TechFormat || 'list'} · Soft: ${uiSettings?.SoftFormat || 'list'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="tools" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.skills ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('skills')}
            />
          )}
        />
        {expandedSections.skills && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            {/* Tech Skills */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Technical Skills</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.TechFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.TechFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.TechFormat === 'comma'}
                  onValueChange={(val) => updateSetting('TechFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.TechFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            {/* Soft Skills */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Soft Skills</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.SoftFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.SoftFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.SoftFormat === 'comma'}
                  onValueChange={(val) => updateSetting('SoftFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.SoftFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            {/* Systems Used */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Systems / Tools Used</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.SystemsFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.SystemsFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.SystemsFormat === 'comma'}
                  onValueChange={(val) => updateSetting('SystemsFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.SystemsFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Skills Delimiter (when Inline)</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Comma ( , )', value: 'comma' },
                { label: 'Semicolon ( ; )', value: 'semicolon' },
                { label: 'Pipe Bar ( | )', value: 'pipe' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.SkillsSeparator || 'comma'}
              onChange={item => updateSetting('SkillsSeparator', item.value)}
            />
          </Card.Content>
        )}
      </Card>

      {/* 8. Artisanal & Certifications Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🔧 Artisanal & Certifications Format"
          subtitle={`Artisanal: ${uiSettings?.ArtisanalFormat || 'bullet'} · Prof Certs: ${uiSettings?.ProfCertsFormat || 'bullet'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="wrench-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.artisanal ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('artisanal')}
            />
          )}
        />
        {expandedSections.artisanal && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Artisanal & Trade Test Qualifications</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.ArtisanalFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.ArtisanalFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.ArtisanalFormat === 'comma'}
                  onValueChange={(val) => updateSetting('ArtisanalFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.ArtisanalFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Professional Certifications</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.ProfCertsFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.ProfCertsFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.ProfCertsFormat === 'comma'}
                  onValueChange={(val) => updateSetting('ProfCertsFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.ProfCertsFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Technical Certifications</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.TechCertFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.TechCertFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.TechCertFormat === 'comma'}
                  onValueChange={(val) => updateSetting('TechCertFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.TechCertFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Regulatory Certifications</Text>
                <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{uiSettings?.RegCertFormat === 'comma' ? 'Inline Comma Paragraph' : 'Bulleted List'}</Text>
              </View>
              <View style={styles.slideControl}>
                <Text style={[styles.toggleText, { color: uiSettings?.RegCertFormat !== 'comma' ? theme.accent : theme.textSecondary }]}>Bulleted</Text>
                <Switch
                  value={uiSettings?.RegCertFormat === 'comma'}
                  onValueChange={(val) => updateSetting('RegCertFormat', val ? 'comma' : 'list')}
                  trackColor={switchColors}
                />
                <Text style={[styles.toggleText, { color: uiSettings?.RegCertFormat === 'comma' ? theme.accent : theme.textSecondary }]}>Comma</Text>
              </View>
            </View>
          </Card.Content>
        )}
      </Card>

      {/* 9. Languages Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="🗣️ Languages Layout"
          subtitle={`${uiSettings?.LanguagesFormat || 'inline'} · Proficiency: ${uiSettings?.LanguagesShowProficiency !== false ? 'Shown' : 'Hidden'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="translate" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.languages ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('languages')}
            />
          )}
        />
        {expandedSections.languages && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Layout Presentation</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Inline Flowing: English (Fluent), Zulu (Native)', value: 'inline' },
                { label: 'Bulleted Vertical List', value: 'bullet' },
                { label: 'Compact Table Grid', value: 'table' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.LanguagesFormat || 'inline'}
              onChange={item => updateSetting('LanguagesFormat', item.value)}
            />

            <View style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>Display Competency / Proficiency Level</Text>
              <Switch
                value={uiSettings?.LanguagesShowProficiency !== false}
                onValueChange={(val) => updateSetting('LanguagesShowProficiency', val)}
                trackColor={switchColors}
              />
            </View>
          </Card.Content>
        )}
      </Card>

      {/* 10. References Layout */}
      <Card style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Card.Title
          title="👥 References Layout & Grid"
          subtitle={`${uiSettings?.ReferencesLayout || 'stacked'} · Separator: ${uiSettings?.ReferencesSeparator || 'lineBreak'}`}
          titleStyle={[styles.cardTitle, { color: theme.textPrimary }]}
          subtitleStyle={[styles.cardSubtitle, { color: theme.textSecondary }]}
          left={(props) => <IconButton {...props} icon="account-supervisor-outline" iconColor={theme.accent} />}
          right={(props) => (
            <IconButton
              {...props}
              icon={expandedSections.references ? "chevron-up" : "chevron-down"}
              iconColor={theme.textSecondary}
              onPress={() => toggleSection('references')}
            />
          )}
        />
        {expandedSections.references && (
          <Card.Content>
            <Divider style={{ marginBottom: 10, backgroundColor: theme.border }} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Layout Arrangement</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Stacked Vertical List (Full Width)', value: 'stacked' },
                { label: '2-Column Side-by-Side Grid', value: 'grid' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.ReferencesLayout || 'stacked'}
              onChange={item => updateSetting('ReferencesLayout', item.value)}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Contact Separator</Text>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'Clean Line Breaks', value: 'lineBreak' },
                { label: 'Inline Middle Dot ( • )', value: 'dot' }
              ]}
              labelField="label"
              valueField="value"
              value={uiSettings?.ReferencesSeparator || 'lineBreak'}
              onChange={item => updateSetting('ReferencesSeparator', item.value)}
            />
          </Card.Content>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 11 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  itemTitle: { fontSize: 13, fontWeight: 'bold' },
  itemSub: { fontSize: 11 },
  itemLabel: { fontSize: 12, fontWeight: '500', flex: 1, marginRight: 8 },
  slideControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontSize: 10, fontWeight: '600' },
  dropdown: { height: 48, marginBottom: 8, marginTop: 2 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 6, fontWeight: '500' }
});
