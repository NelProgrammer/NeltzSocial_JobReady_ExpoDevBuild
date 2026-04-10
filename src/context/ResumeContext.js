import React, { createContext, useState, useEffect, useContext } from 'react';
import { Storage } from '../utils/storage';
import { AuthContext } from './AuthContext';

export const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [meta, setMeta] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load data when user changes
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) {
                setMeta([]);
                setResumeData(null);
                setActiveResumeId(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            const storedMeta = await Storage.loadMeta(user.id);
            setMeta(storedMeta);
            if (storedMeta.length > 0) {
                await switchResume(storedMeta[0].id);
            } else {
                setResumeData(null);
                setActiveResumeId(null);
            }
            setLoading(false);
        };
        loadInitialData();
    }, [user]);

    // Create New Resume
    const createResume = async (name = "New Resume") => {
        if (!user) return null;
        const id = `res_${Date.now()}`;
        const newMetaItem = { id, name, lastModified: Date.now() };

        const initialData = {
            "personal details": {
                names: { firstName: "", MiddleName: "", Surname: "", Prefix: "" },
                identity: { idNumber: "", idMask: true },
                contact: { Email: user.email || "", Phone: "" },
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

        const updatedMeta = [...meta, newMetaItem];
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);
        await Storage.saveResumeData(user.id, id, initialData);

        await switchResume(id);
        return id;
    };

    // Switch Active Resume
    const switchResume = async (id) => {
        if (!user) return;
        setActiveResumeId(id);
        const data = await Storage.loadResumeData(user.id, id);
        if (data) {
            setResumeData(data);
        } else {
            console.warn(`No data found for resume ID: ${id}`);
        }
    };

    // Update Resume Data (Auto-Save Logic)
    const updateResumeData = async (newData) => {
        if (!user || !activeResumeId) return;
        setResumeData(newData);
        await Storage.saveResumeData(user.id, activeResumeId, newData);
        
        const updatedMeta = meta.map(m => m.id === activeResumeId ? { ...m, lastModified: Date.now() } : m);
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);
    };

    // Rename Resume
    const renameResume = async (id, newName) => {
        if (!user) return;
        const updatedMeta = meta.map(m => m.id === id ? { ...m, name: newName, lastModified: Date.now() } : m);
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);
    };

    // Duplicate Resume
    const duplicateResume = async (id) => {
        if (!user) return null;
        
        // Find existing meta to get Name
        const existingMeta = meta.find(m => m.id === id);
        if (!existingMeta) return null;

        // Fetch existing data
        const sourceData = await Storage.loadResumeData(user.id, id);
        if (!sourceData) return null;

        // Create new ID
        const newId = `res_${Date.now()}`;
        const newName = `${existingMeta.name} - Copy`;
        
        // Deep copy data
        const clonedData = JSON.parse(JSON.stringify(sourceData));
        
        // Save new info
        const newMetaItem = { id: newId, name: newName, lastModified: Date.now() };
        const updatedMeta = [...meta, newMetaItem];
        setMeta(updatedMeta);
        
        await Storage.saveMeta(user.id, updatedMeta);
        await Storage.saveResumeData(user.id, newId, clonedData);
        
        // Switch to the clone
        await switchResume(newId);
        return newId;
    };

    // Delete Resume
    const deleteResume = async (id) => {
        if (!user) return;
        const updatedMeta = meta.filter(m => m.id !== id);
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);
        await Storage.deleteResumeData(user.id, id);

        if (activeResumeId === id) {
            setResumeData(null);
            setActiveResumeId(null);
            if (updatedMeta.length > 0) {
                await switchResume(updatedMeta[0].id);
            }
        }
    };

    return (
        <ResumeContext.Provider value={{
            meta,
            activeResumeId,
            resumeData,
            loading,
            createResume,
            switchResume,
            updateResumeData,
            renameResume,
            deleteResume,
            duplicateResume
        }}>
            {children}
        </ResumeContext.Provider>
    );
};
