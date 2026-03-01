import React, { createContext, useState, useEffect } from 'react';
import { Storage } from '../utils/storage';

export const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
    const [meta, setMeta] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            const storedMeta = await Storage.loadMeta();
            setMeta(storedMeta);
            if (storedMeta.length > 0) {
                // Load the first resume by default
                await switchResume(storedMeta[0].id);
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // Create New Resume
    const createResume = async (name = "New Resume") => {
        const id = `res_${Date.now()}`;
        const newMetaItem = { id, name, lastModified: Date.now() };

        // Default Schema from Pseudo_Plan_Resume.md
        const initialData = {
            "personal details": {
                names: {}, identity: {}, contact: {}, address: {}, licensing: {}, demographics: {}, legal: {}, languages: []
            },
            "professional summary": "",
            experience: [],
            education: { highschool: {}, tertiary: [] },
            Skills: {},
            References: [],
            Layout: 'professional' // Default layout
        };

        const updatedMeta = [...meta, newMetaItem];
        setMeta(updatedMeta);
        await Storage.saveMeta(updatedMeta);
        await Storage.saveResumeData(id, initialData);

        await switchResume(id);
        return id;
    };

    // Switch Active Resume
    const switchResume = async (id) => {
        setActiveResumeId(id);
        const data = await Storage.loadResumeData(id);
        if (data) {
            setResumeData(data);
        } else {
            // Fallback or Error handling
            console.warn(`No data found for resume ID: ${id}`);
        }
    };

    // Update Resume Data (Auto-Save Logic)
    const updateResumeData = async (newData) => {
        setResumeData(newData);
        if (activeResumeId) {
            await Storage.saveResumeData(activeResumeId, newData);
            // Update 'lastModified' in meta
            const updatedMeta = meta.map(m => m.id === activeResumeId ? { ...m, lastModified: Date.now() } : m);
            setMeta(updatedMeta);
            await Storage.saveMeta(updatedMeta);
        }
    };

    // Rename Resume
    const renameResume = async (id, newName) => {
        const updatedMeta = meta.map(m => m.id === id ? { ...m, name: newName, lastModified: Date.now() } : m);
        setMeta(updatedMeta);
        await Storage.saveMeta(updatedMeta);
    };

    // Delete Resume
    const deleteResume = async (id) => {
        const updatedMeta = meta.filter(m => m.id !== id);
        setMeta(updatedMeta);
        await Storage.saveMeta(updatedMeta);
        await Storage.deleteResumeData(id);

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
            deleteResume
        }}>
            {children}
        </ResumeContext.Provider>
    );
};
