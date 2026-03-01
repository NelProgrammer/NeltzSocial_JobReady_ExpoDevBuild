import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Appbar, SegmentedButtons } from 'react-native-paper';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { ResumeContext } from '../context/ResumeContext';

const PreviewScreen = ({ navigation }) => {
    const { resumeData, updateResumeData } = useContext(ResumeContext);
    const [loading, setLoading] = useState(false);

    // Layout State (Saved in Resume Data)
    const currentLayout = resumeData?.Layout || 'professional';

    const changeLayout = (newLayout) => {
        updateResumeData({ ...resumeData, Layout: newLayout });
    };

    const generateHtml = () => {
        if (!resumeData) return "<html><body><h1>No Data</h1></body></html>";

        const { "personal details": pd, experience: expList, education: eduList, Skills: skills, References: refList, "professional summary": summary, Layout } = resumeData;
        const names = pd?.names || {};
        const contact = pd?.contact || {};
        const address = pd?.address || {};

        // CSS Styles
        const styles = `
            body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 0; }
            .container { padding: 40px; max-width: 800px; margin: 0 auto; }
            
            /* Professional Header */
            .header-pro { border-bottom: 2px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
            .header-pro h1 { margin: 0; font-size: 32px; color: #2c3e50; text-transform: uppercase; letter-spacing: 2px; }
            .header-pro .contact-info { margin-top: 10px; font-size: 14px; color: #555; }
            
            /* Modern Header */
            .header-mod { background: #2c3e50; color: white; padding: 40px; margin: -40px -40px 30px -40px; }
            .header-mod h1 { margin: 0; font-size: 36px; }
            .header-mod .contact-info { color: #ecf0f1; margin-top: 10px; }

            h3 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 16px; letter-spacing: 1px; }
            
            .job-item, .edu-item { margin-bottom: 15px; }
            .job-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
            .job-role { font-style: italic; color: #555; margin-bottom: 5px; }
            .job-desc { font-size: 14px; line-height: 1.5; white-space: pre-line; }
            
            .ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .ref-item { font-size: 14px; }
        `;

        const headerHtml = Layout === 'modern' ? `
            <div class="header-mod">
                <h1>${names.firstName || ''} ${names.Surname || ''}</h1>
                <div class="contact-info">
                    ${contact.Email ? `📧 ${contact.Email} | ` : ''} 
                    ${contact.Phone ? `📱 ${contact.Phone} | ` : ''} 
                    ${address.Address ? `📍 ${address.Address.replace(/\n/g, ', ')}` : ''}
                </div>
            </div>
        ` : `
            <div class="header-pro">
                <h1>${names.firstName || ''} ${names.Surname || ''}</h1>
                <div class="contact-info">
                    ${contact.Email ? `📧 ${contact.Email} &nbsp;|&nbsp;` : ''} 
                    ${contact.Phone ? `📱 ${contact.Phone} &nbsp;|&nbsp;` : ''} 
                    ${address.Address ? `📍 ${address.Address.replace(/\n/g, ', ')}` : ''}
                </div>
            </div>
        `;

        const expHtml = expList && expList.length > 0 ? `
            <h3>Professional Experience</h3>
            ${expList.map(job => `
                <div class="job-item">
                    <div class="job-header">
                        <span>${job.Organization}</span>
                        <span>${job["Start Date"]} - ${job["End Date"] || 'Present'}</span>
                    </div>
                    <div class="job-role">${job.Role}</div>
                    <div class="job-desc">${job["Key Responsibilities"]}</div>
                </div>
            `).join('')}
        ` : '';

        const eduHtml = (eduList?.tertiary?.length > 0 || eduList?.highschool?.["Year Completed"]) ? `
            <h3>Education</h3>
            ${eduList.tertiary.map(edu => `
                 <div class="edu-item">
                    <div class="job-header">
                        <span>${edu.Institution}</span>
                        <span>${edu.Year}</span>
                    </div>
                    <div>${edu["Qualification Name"]}</div>
                </div>
            `).join('')}
            ${eduList.highschool["Year Completed"] ? `
                <div class="edu-item">
                     <div class="job-header">
                        <span>${eduList.highschool["Province Department"]}</span>
                        <span>${eduList.highschool["Year Completed"]}</span>
                    </div>
                    <div>${eduList.highschool["Highest Grade/Std"]}</div>
                </div>
            ` : ''}
        ` : '';

        const skillsHtml = (skills.Tech || skills.Soft) ? `
             <h3>Skills</h3>
             ${skills.Tech ? `<p><strong>Technical:</strong> ${skills.Tech}</p>` : ''}
             ${skills.Soft ? `<p><strong>Soft Skills:</strong> ${skills.Soft}</p>` : ''}
         ` : '';

        const refHtml = refList && refList.length > 0 ? `
             <h3>References</h3>
             <div class="ref-grid">
                ${refList.filter(r => r.visible).map(ref => `
                    <div class="ref-item">
                        <strong>${ref.name}</strong><br/>
                        ${ref.relation} at ${ref.org}<br/>
                        ${ref.phone}<br/>
                        ${ref.email}
                    </div>
                `).join('')}
             </div>
         ` : (refList && refList.length > 0 ? '' : `<h3>References</h3><p>Available upon request.</p>`);


        return `
            <html>
            <head><style>${styles}</style></head>
            <body>
                <div class="container">
                    ${headerHtml}
                    ${summary ? `<h3>Executive Summary</h3><p>${summary}</p>` : ''}
                    ${expHtml}
                    ${eduHtml}
                    ${skillsHtml}
                    ${refHtml}
                </div>
            </body>
            </html>
        `;
    };

    const printToFile = async () => {
        setLoading(true);
        try {
            const html = generateHtml();
            const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 }); // Letter size
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert("Error", "Could not generate PDF");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Preview & Export" />
                <Appbar.Action icon="share-variant" onPress={printToFile} />
            </Appbar.Header>
            <View style={{ padding: 20 }}>
                <SegmentedButtons
                    value={currentLayout}
                    onValueChange={changeLayout}
                    buttons={[
                        { value: 'professional', label: 'Professional' },
                        { value: 'modern', label: 'Modern' },
                    ]}
                    style={{ marginBottom: 20 }}
                />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.previewPlaceholder}>
                    <Button mode="contained" onPress={printToFile} loading={loading} contentStyle={{ height: 50 }}>
                        Generate PDF
                    </Button>
                    <Button mode="text" onPress={() => Alert.alert("Tip", "Press 'Generate' to create the PDF file. You can then view, save, or share it.")} style={{ marginTop: 10 }}>
                        How does this work?
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    previewPlaceholder: { alignItems: 'center', padding: 20 }
});

export default PreviewScreen;
