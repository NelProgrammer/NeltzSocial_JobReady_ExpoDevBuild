import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export const pickAndParseDocument = async (setFileContext) => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/pdf', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            copyToCacheDirectory: true
        });

        if (result.canceled) return null;

        const asset = result.assets[0];
        const fileUri = asset.uri;
        const mimeType = asset.mimeType || 'application/octet-stream';
        const name = asset.name || 'document';

        // Read Base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Set context which will trigger the HeadlessParser WebView
        setFileContext({ base64, mimeType, name });
        return true;

    } catch (err) {
        console.error("Document Pick Error:", err);
        Alert.alert("Import Error", "Failed to load the document.");
        return null;
    }
};

// VanillaJS Parsing Translation Logic
export const translateParsedTextToResume = (text) => {
    const data = {
        "personal details": {
            names: { firstName: "", MiddleName: "", Surname: "", Prefix: "" },
            identity: { idNumber: "", idMask: true },
            contact: { Email: "", Phone: "" },
            address: { "Home Address": "", "AddressType": "Free-Standing" },
            licensing: { Drivers: "None", DriversVisible: false, Motorcycle: "None", MotorVisible: false },
            demographics: { Gender: "None", Nationality: "" },
            legal: { "Criminal Record": false, Details: "" },
            languages: []
        },
        "professional summary": "",
        experience: [],
        education: { 
            highschool: { "Province Department": "", "Year Completed": "", "Subjects Stream": "" }, 
            tertiary: [] 
        },
        "Skills": { Tech: "", Soft: "", Certs: "" },
        "References": [],
        "Document Settings": {
            Layout: 'professional'
        }
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Extraction Regex Definitions
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/;
    const phoneRegex = /(?:\+?27|0)\s?\d{2}\s?\d{3}\s?\d{4}/;

    const emailMatch = text.match(emailRegex);
    if (emailMatch) data["personal details"].contact.Email = emailMatch[0];

    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) data["personal details"].contact.Phone = phoneMatch[0];

    // Attempt Name Extraction
    if (lines.length > 0) {
        const potentialName = lines[0];
        if (potentialName.split(' ').length <= 4) {
            const parts = potentialName.split(' ');
            if (parts.length > 0) data["personal details"].names.firstName = parts[0];
            if (parts.length > 1) data["personal details"].names.Surname = parts.slice(1).join(' ');
        }
    }

    let currentSection = 'summary';
    let buffer = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
            flushSection(currentSection, buffer, data);
            currentSection = 'experience';
            buffer = [];
            continue;
        } else if (lower.includes('education') || lower.includes('qualification') || lower.includes('academic')) {
            flushSection(currentSection, buffer, data);
            currentSection = 'education';
            buffer = [];
            continue;
        } else if (lower.includes('skill') || lower.includes('competencies')) {
            flushSection(currentSection, buffer, data);
            currentSection = 'skills';
            buffer = [];
            continue;
        } else if (lower.includes('reference')) {
            flushSection(currentSection, buffer, data);
            currentSection = 'references';
            buffer = [];
            continue;
        }
        buffer.push(line);
    }
    flushSection(currentSection, buffer, data); // Flush remaining

    return data;
};

const flushSection = (section, buffer, data) => {
    if (buffer.length === 0) return;
    const fullText = buffer.join('\n');

    if (section === 'summary') {
        data["professional summary"] = fullText;
    } else if (section === 'experience') {
        data.experience.push({
            id: 'exp_' + Date.now(),
            "Job Title": "Imported Role",
            Employer: "Extracted Experience",
            "Start Date": "",
            "End Date": "",
            "Current Job": false,
            Responsibilities: fullText
        });
    } else if (section === 'education') {
        data.education.tertiary.push({
            id: 'edu_' + Date.now(),
            Institution: "Imported Education",
            Qualification: fullText.substring(0, 100),
            "Year Completed": ""
        });
    } else if (section === 'skills') {
        data["Skills"].Tech = fullText.substring(0, 200);
        data["Skills"].Soft = fullText.length > 200 ? fullText.substring(200, 400) : "";
    }
};
