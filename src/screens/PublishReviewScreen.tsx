import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Appbar, Text, Button, Card, Avatar, Divider, Portal, Dialog, RadioButton, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ResumeContext } from '../context/ResumeContext';
import { Storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Vignette_PubRev from '../components/Vignette_PubRev';

const PublishReviewScreen = ({ navigation }: { navigation: any }) => {
    const { user } = useContext(AuthContext);
    const resumeCtx = useContext(ResumeContext) as any;
    const meta = resumeCtx?.meta || [];
    const insets = useSafeAreaInsets();

    const [viewMode, setViewMode] = useState('seeker'); // 'seeker' or 'reviewer'
    const [submissions, setSubmissions] = useState<any[]>([]);
    
    // Seeker Form State
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [selectedReviewerId, setSelectedReviewerId] = useState('rev_1');
    const [resumeSelectorVisible, setResumeSelectorVisible] = useState(false);

    // Reviewer Workbench State
    const [activeSubmission, setActiveSubmission] = useState<any>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [viewerVisible, setViewerVisible] = useState(false);

    // Feedback Detail State
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null);

    const reviewers = [
        { id: 'rev_1', name: 'Thandi Mokoena', role: 'HR Specialist', rating: 4.8, avatar: '👩‍💼' },
        { id: 'rev_2', name: 'John Smith', role: 'Technical Lead', rating: 4.9, avatar: '👨‍💻' },
        { id: 'rev_3', name: 'Sarah Jenkins', role: 'Career Coach', rating: 4.7, avatar: '👩‍🏫' },
        { id: 'rev_4', name: 'Naledi Dlamini', role: 'Call Centre Team Leader', rating: 4.6, avatar: '🎧' }
    ];

    useEffect(() => {
        loadSubmissions();
    }, [user]);

    const loadSubmissions = async () => {
        const subs = await Storage.get('jr_submissions') || [];
        setSubmissions(subs);
    };

    const saveSubmissions = async (updatedSubs: any[]) => {
        setSubmissions(updatedSubs);
        await Storage.set('jr_submissions', updatedSubs);
    };

    const handleSeekerSubmit = async () => {
        if (!selectedResumeId) {
            Alert.alert("Error", "Please select a resume to submit.");
            return;
        }

        const selectedMeta = meta.find((m: any) => m.id === selectedResumeId);
        if (!selectedMeta) return;

        // Fetch resume data snapshot
        const resumeData = await Storage.loadResumeData(user.id, selectedResumeId);
        if (!resumeData) {
            Alert.alert("Error", "Could not load selected resume data.");
            return;
        }

        const newSub = {
            id: 'sub_' + Date.now(),
            profileId: user.id,
            profileName: user.name,
            resumeId: selectedResumeId,
            resumeName: selectedMeta.name,
            resumeData: resumeData,
            status: 'Pending',
            reviewerId: selectedReviewerId,
            feedback: null,
            timestamp: new Date().toLocaleString()
        };

        const updated = [...submissions, newSub];
        await saveSubmissions(updated);
        Alert.alert("Success", "Resumé submitted for review! (Simulated R100 Fee processed)");
        
        // Reset selections
        setSelectedResumeId('');
    };

    const handleReviewSubmit = async () => {
        if (!feedbackText.trim()) {
            Alert.alert("Error", "Please write constructive feedback.");
            return;
        }

        const updated = submissions.map(s => {
            if (s.id === activeSubmission.id) {
                return {
                    ...s,
                    status: 'Reviewed',
                    feedback: feedbackText
                };
            }
            return s;
        });

        await saveSubmissions(updated);
        setViewerVisible(false);
        setActiveSubmission(null);
        setFeedbackText('');
        Alert.alert("Success", "Feedback submitted successfully!");
    };

    const mySubmissions = submissions.filter(s => s.profileId === user?.id);
    const globalPending = submissions.filter(s => s.status === 'Pending' && s.profileId !== user?.id);
    const globalReviewed = submissions.filter(s => s.status === 'Reviewed' && s.profileId !== user?.id);

    return (
        <View style={styles.container}>
            <Appbar.Header style={{ backgroundColor: '#6200ee' }}>
                <Appbar.BackAction color="#fff" onPress={() => navigation.goBack()} />
                <Appbar.Content title="Publish & Review" color="#fff" />
            </Appbar.Header>

            {/* Toggle Mode */}
            <View style={styles.modeContainer}>
                <Button 
                    mode={viewMode === 'seeker' ? 'contained' : 'outlined'} 
                    onPress={() => setViewMode('seeker')}
                    style={styles.toggleBtn}
                    labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                >
                    Job Seeker
                </Button>
                <Button 
                    mode={viewMode === 'reviewer' ? 'contained' : 'outlined'} 
                    onPress={() => setViewMode('reviewer')}
                    style={styles.toggleBtn}
                    labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                >
                    Recruiter/Expert
                </Button>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
                {viewMode === 'seeker' ? (
                    <View>
                        {/* Seeker Input Card */}
                        <Card style={styles.card} elevation={2}>
                            <Card.Content>
                                <Text style={styles.sectionTitle}>Submit Resume for Review</Text>
                                
                                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setResumeSelectorVisible(true)}>
                                    <Text style={styles.pickerText}>
                                        {selectedResumeId 
                                            ? meta.find((m: any) => m.id === selectedResumeId)?.name 
                                            : "Select a Resume..."}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                                </TouchableOpacity>

                                <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Select Reviewer Profile</Text>
                                {reviewers.map(r => (
                                    <TouchableOpacity 
                                        key={r.id}
                                        style={[styles.reviewerCard, selectedReviewerId === r.id && styles.activeReviewerCard]}
                                        onPress={() => setSelectedReviewerId(r.id)}
                                    >
                                        <Avatar.Text size={40} label={r.avatar} style={{ backgroundColor: '#efe9ff' }} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{r.name}</Text>
                                            <Text style={{ fontSize: 12, color: '#666' }}>{r.role} • ⭐ {r.rating}</Text>
                                        </View>
                                        <RadioButton.Android 
                                            value={r.id} 
                                            status={selectedReviewerId === r.id ? 'checked' : 'unchecked'}
                                            onPress={() => setSelectedReviewerId(r.id)}
                                            color="#6200ee"
                                        />
                                    </TouchableOpacity>
                                ))}

                                <Button 
                                    mode="contained" 
                                    icon="rocket"
                                    onPress={handleSeekerSubmit} 
                                    style={styles.submitBtn}
                                    contentStyle={{ height: 48 }}
                                >
                                    Submit CV Review (R100 Fee)
                                </Button>
                            </Card.Content>
                        </Card>

                        {/* Seeker History List */}
                        <Text style={styles.listHeader}>My Submission History</Text>
                        {mySubmissions.length === 0 ? (
                            <Card style={styles.card}>
                                <Card.Content style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <MaterialCommunityIcons name="file-question-outline" size={48} color="#ccc" />
                                    <Text style={{ color: '#999', marginTop: 10 }}>No active resume reviews submitted.</Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            mySubmissions.map(s => (
                                <Card key={s.id} style={styles.historyCard} elevation={1}>
                                    <Card.Content>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{s.resumeName}</Text>
                                                <Text style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                                                    Reviewer: {reviewers.find(r => r.id === s.reviewerId)?.name}
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{s.timestamp}</Text>
                                            </View>
                                            <View style={[
                                                styles.badge, 
                                                { backgroundColor: s.status === 'Reviewed' ? '#d1fae5' : '#fef3c7' }
                                            ]}>
                                                <Text style={{ 
                                                    fontSize: 11, 
                                                    fontWeight: 'bold',
                                                    color: s.status === 'Reviewed' ? '#065f46' : '#92400e' 
                                                }}>
                                                    {s.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {s.feedback && (
                                            <TouchableOpacity 
                                                style={styles.feedbackBanner}
                                                onPress={() => setSelectedFeedback(s)}
                                            >
                                                <Text numberOfLines={2} style={styles.feedbackPreview}>
                                                    💬 "{s.feedback}"
                                                </Text>
                                                <Text style={styles.readMoreText}>Read Full Review ➔</Text>
                                            </TouchableOpacity>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>
                ) : (
                    <View>
                        {/* Recruiter Queue */}
                        <Text style={styles.listHeader}>Global Queue (Pending Docs)</Text>
                        {globalPending.length === 0 ? (
                            <Card style={styles.card}>
                                <Card.Content style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={48} color="#10b981" />
                                    <Text style={{ color: '#999', marginTop: 10 }}>Review queue is currently empty!</Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            globalPending.map(s => (
                                <Card key={s.id} style={styles.queueCard} elevation={1}>
                                    <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{s.resumeName}</Text>
                                            <Text style={{ fontSize: 12, color: '#666' }}>Submitted by: {s.profileName}</Text>
                                        </View>
                                        <Button 
                                            mode="contained" 
                                            onPress={() => {
                                                setActiveSubmission(s);
                                                setViewerVisible(true);
                                            }}
                                            style={styles.actionBtn}
                                            labelStyle={{ fontSize: 11 }}
                                        >
                                            Review
                                        </Button>
                                    </Card.Content>
                                </Card>
                            ))
                        )}

                        <Text style={[styles.listHeader, { marginTop: 24 }]}>Recent Evaluations</Text>
                        {globalReviewed.length === 0 ? (
                            <Text style={{ color: '#999', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>No submissions evaluated yet.</Text>
                        ) : (
                            globalReviewed.map(s => (
                                <Card key={s.id} style={[styles.queueCard, { opacity: 0.7 }]} elevation={1}>
                                    <Card.Content>
                                        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{s.resumeName}</Text>
                                        <Text style={{ fontSize: 11, color: '#666' }}>Feedback sent to {s.profileName}</Text>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Resume Selection Dialog */}
            <Portal>
                <Dialog visible={resumeSelectorVisible} onDismiss={() => setResumeSelectorVisible(false)}>
                    <Dialog.Title>Select Resume</Dialog.Title>
                    <Dialog.Content>
                        <RadioButton.Group 
                            onValueChange={value => {
                                setSelectedResumeId(value);
                                setResumeSelectorVisible(false);
                            }} 
                            value={selectedResumeId}
                        >
                            {meta.length === 0 ? (
                                <Text>No resumes created yet.</Text>
                            ) : (
                                meta.map((r: any) => (
                                    <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                                        <RadioButton.Android value={r.id} color="#6200ee" />
                                        <Text style={{ marginLeft: 8, fontSize: 15 }}>{r.name}</Text>
                                    </View>
                                ))
                            )}
                        </RadioButton.Group>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setResumeSelectorVisible(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Feedback Full View Dialog */}
            <Portal>
                <Dialog visible={!!selectedFeedback} onDismiss={() => setSelectedFeedback(null)}>
                    <Dialog.Title>Review Feedback</Dialog.Title>
                    <Dialog.Content>
                        {selectedFeedback && (
                            <ScrollView style={{ maxHeight: 200 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#777', textTransform: 'uppercase' }}>
                                    Resume: {selectedFeedback.resumeName}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                    Reviewer: {reviewers.find(r => r.id === selectedFeedback.reviewerId)?.name}
                                </Text>
                                <Divider style={{ marginVertical: 12 }} />
                                <Text style={{ fontSize: 15, lineHeight: 22, color: '#333', fontStyle: 'italic' }}>
                                    "{selectedFeedback.feedback}"
                                </Text>
                            </ScrollView>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSelectedFeedback(null)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Full Screen Reviewer Workbench Modal */}
            <Modal 
                visible={viewerVisible} 
                animationType="slide" 
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                    <Appbar.Header style={{ backgroundColor: '#111827' }}>
                        <Appbar.Action icon="close" color="#fff" onPress={() => setViewerVisible(false)} />
                        <Appbar.Content title={`Reviewing: ${activeSubmission?.resumeName}`} color="#fff" />
                    </Appbar.Header>

                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        {/* Top half: Resume rendering */}
                        <View style={{ flex: 1.2, borderBottomWidth: 1, borderColor: '#ccc' }}>
                            {activeSubmission?.resumeData ? (
                                <Vignette_PubRev data={activeSubmission.resumeData} />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text>No resume snapshot data found.</Text>
                                </View>
                            )}
                        </View>

                        {/* Bottom half: Feedback Form */}
                        <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' }}>
                            <Text style={styles.sectionTitle}>Evaluation & Feedback</Text>
                            <TextInput 
                                label="Expert critique..."
                                value={feedbackText}
                                onChangeText={setFeedbackText}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={{ marginTop: 8, backgroundColor: '#fff' }}
                                placeholder="Add comments on layout, experience description, or skills highlights."
                            />
                            <Button 
                                mode="contained"
                                onPress={handleReviewSubmit}
                                style={{ marginTop: 16, backgroundColor: '#10b981' }}
                                contentStyle={{ height: 48 }}
                            >
                                Complete Review & Send
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    modeContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-around' },
    toggleBtn: { flex: 0.48, borderRadius: 8 },
    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#777', textTransform: 'uppercase', letterSpacing: 0.5 },
    pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8, backgroundColor: '#fafafa' },
    pickerText: { fontSize: 14, color: '#333' },
    reviewerCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginVertical: 6, backgroundColor: '#fff' },
    activeReviewerCard: { borderColor: '#6200ee', backgroundColor: '#fbfaff' },
    submitBtn: { marginTop: 16, backgroundColor: '#6200ee', borderRadius: 8 },
    listHeader: { fontSize: 13, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginVertical: 12 },
    historyCard: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    feedbackBanner: { marginTop: 12, padding: 10, backgroundColor: '#f9f9fb', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6 },
    feedbackPreview: { fontSize: 13, color: '#444', fontStyle: 'italic' },
    readMoreText: { fontSize: 11, color: '#6200ee', fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
    queueCard: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
    actionBtn: { backgroundColor: '#fbbf24', borderRadius: 6 }
});

export default PublishReviewScreen;
