import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { Storage } from '../utils/storage';
import { AuthContext } from './AuthContext';

export const ResumeContext = createContext();

const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const ResumeProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [meta, setMeta] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Two-Way Sync Engine Implementation
    const syncResumes = async (profileId, token) => {
        if (!profileId || !token) return;
        
        try {
            // 1. Fetch Server Manifest
            const manifestResponse = await fetch(`${BACKEND_URL}/sync/manifest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!manifestResponse.ok) {
                console.warn(`[Sync] Failed to fetch manifest: ${manifestResponse.status}`);
                return;
            }
            
            const serverManifest = await manifestResponse.json();
            const serverManifestMap = new Map(serverManifest.map(item => [item.id, item.last_modified]));
            
            // 2. Load Local Metadata
            const localMeta = await Storage.loadMeta(profileId);
            const localMetaMap = new Map(localMeta.map(item => [item.id, item.lastModified]));
            
            const toUpload = [];
            const toDownloadIds = [];
            
            // Compare Local against Server
            for (const item of localMeta) {
                const serverTime = serverManifestMap.get(item.id);
                if (serverTime === undefined) {
                    toUpload.push(item.id);
                } else if (item.lastModified > serverTime * 1000) {
                    toUpload.push(item.id);
                }
            }
            
            // Compare Server against Local
            for (const item of serverManifest) {
                const localTime = localMetaMap.get(item.id);
                if (localTime === undefined) {
                    toDownloadIds.push(item.id);
                } else if (item.last_modified * 1000 > localTime) {
                    toDownloadIds.push(item.id);
                }
            }
            
            // 3. Process Downloads
            if (toDownloadIds.length > 0) {
                console.log(`[Sync] Downloading ${toDownloadIds.length} updated resumes from server...`);
                const downloadResponse = await fetch(`${BACKEND_URL}/sync/resumes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (downloadResponse.ok) {
                    const serverResumes = await downloadResponse.json();
                    const updatedMeta = [...localMeta];
                    
                    for (const serverRes of serverResumes) {
                        if (toDownloadIds.includes(serverRes.id)) {
                            await Storage.saveResumeData(profileId, serverRes.id, serverRes.data_json);
                            
                            const metaIndex = updatedMeta.findIndex(m => m.id === serverRes.id);
                            const lastModMs = serverRes.last_modified * 1000;
                            
                            if (metaIndex >= 0) {
                                updatedMeta[metaIndex] = {
                                    ...updatedMeta[metaIndex],
                                    name: serverRes.name,
                                    lastModified: lastModMs
                                };
                            } else {
                                updatedMeta.push({
                                    id: serverRes.id,
                                    name: serverRes.name,
                                    lastModified: lastModMs
                                });
                            }
                        }
                    }
                    
                    await Storage.saveMeta(profileId, updatedMeta);
                    setMeta(updatedMeta);
                    
                    if (activeResumeId && toDownloadIds.includes(activeResumeId)) {
                        await switchResume(activeResumeId);
                    }
                }
            }
            
            // 4. Process Uploads
            if (toUpload.length > 0) {
                console.log(`[Sync] Uploading ${toUpload.length} local resume modifications to server...`);
                const itemsToPush = [];
                for (const resId of toUpload) {
                    const data = await Storage.loadResumeData(profileId, resId);
                    const metaItem = localMeta.find(m => m.id === resId);
                    if (data && metaItem) {
                        itemsToPush.push({
                            id: resId,
                            profile_id: profileId,
                            name: metaItem.name,
                            data_json: data,
                            last_modified: metaItem.lastModified / 1000
                        });
                    }
                }
                
                if (itemsToPush.length > 0) {
                    const pushResponse = await fetch(`${BACKEND_URL}/sync/push`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ items: itemsToPush })
                    });
                    
                    if (pushResponse.ok) {
                        const pushResult = await pushResponse.json();
                        
                        // Handle Conflicts (Server version is newer)
                        if (pushResult.status === 'conflict' && pushResult.conflicts.length > 0) {
                            const updatedMeta = [...localMeta];
                            for (const conflict of pushResult.conflicts) {
                                console.warn(`[Sync] Conflict on ${conflict.id}: Server version is newer. Overwriting local.`);
                                await Storage.saveResumeData(profileId, conflict.id, conflict.data_json);
                                
                                const metaIndex = updatedMeta.findIndex(m => m.id === conflict.id);
                                if (metaIndex >= 0) {
                                    updatedMeta[metaIndex] = {
                                        ...updatedMeta[metaIndex],
                                        name: conflict.name,
                                        lastModified: conflict.last_modified * 1000
                                    };
                                }
                            }
                            await Storage.saveMeta(profileId, updatedMeta);
                            setMeta(updatedMeta);
                            
                            if (activeResumeId && pushResult.conflicts.some(c => c.id === activeResumeId)) {
                                await switchResume(activeResumeId);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('[Sync] Server synchronization skipped:', error.message);
        }
    };

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
                // Determine active index
                const activeId = storedMeta[0].id;
                setActiveResumeId(activeId);
                const data = await Storage.loadResumeData(user.id, activeId);
                if (data) {
                    setResumeData(data);
                }
            } else {
                setResumeData(null);
                setActiveResumeId(null);
            }
            
            setLoading(false);

            // Execute cloud sync in background if active session has accessToken
            if (user.accessToken) {
                syncResumes(user.id, user.accessToken);
            }
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

        if (user.accessToken) {
            syncResumes(user.id, user.accessToken);
        }

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
        
        const timestamp = Date.now();
        await Storage.saveResumeData(user.id, activeResumeId, newData);
        
        const updatedMeta = meta.map(m => m.id === activeResumeId ? { ...m, lastModified: timestamp } : m);
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);

        if (user.accessToken) {
            syncResumes(user.id, user.accessToken);
        }
    };

    // Rename Resume
    const renameResume = async (id, newName) => {
        if (!user) return;
        const timestamp = Date.now();
        const updatedMeta = meta.map(m => m.id === id ? { ...m, name: newName, lastModified: timestamp } : m);
        setMeta(updatedMeta);
        await Storage.saveMeta(user.id, updatedMeta);

        if (user.accessToken) {
            syncResumes(user.id, user.accessToken);
        }
    };

    // Duplicate Resume
    const duplicateResume = async (id) => {
        if (!user) return null;
        
        const existingMeta = meta.find(m => m.id === id);
        if (!existingMeta) return null;

        const sourceData = await Storage.loadResumeData(user.id, id);
        if (!sourceData) return null;

        const newId = `res_${Date.now()}`;
        const newName = `${existingMeta.name} - Copy`;
        const clonedData = JSON.parse(JSON.stringify(sourceData));
        
        const newMetaItem = { id: newId, name: newName, lastModified: Date.now() };
        const updatedMeta = [...meta, newMetaItem];
        setMeta(updatedMeta);
        
        await Storage.saveMeta(user.id, updatedMeta);
        await Storage.saveResumeData(user.id, newId, clonedData);
        
        await switchResume(newId);

        if (user.accessToken) {
            syncResumes(user.id, user.accessToken);
        }

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

        // Delete is handled locally; in a full sync it would flag delete. 
        // For simple sync, manifest comparison handles it (server removes items that are no longer present).
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
            duplicateResume,
            syncResumes
        }}>
            {children}
        </ResumeContext.Provider>
    );
};
