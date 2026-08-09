import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Appbar, Text, Button, Card, Avatar, Divider, Portal, Dialog, RadioButton, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ResumeContext } from '../context/ResumeContext';
import { Storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Vignette_PubRev from '../components/Vignette_PubRev';
import { useThemeContext } from '../context/ThemeContext';

const PublishReviewScreen = ({ navigation }: { navigation: any }) => {
    const { user } = useContext(AuthContext);
    const resumeCtx = useContext(ResumeContext) as any;
    const meta = resumeCtx?.meta || [];
    const { theme } = useThemeContext();
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

    const openReviewerWorkbench = (sub: any) => {
        setActiveSubmission(sub);
        setFeedbackText(sub.feedback?.text || '');
        setViewerVisible(true);
    };

    const mySubmissions = submissions.filter(s => s.profileId === user?.id);

    return (
        <View style={[styles.container, { backgroundColor: theme.bgDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
            {/* Header Banner */}
            <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>Publish for Review</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Expert HR & Manager Evaluations</Text>
                    </View>
                    <View style={[styles.themeBadge, { backgroundColor: '#f59e0b' }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>UPCOMING</Text>
                    </View>
                </View>
                <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Connect with industry experts for resume critiques</Text>
            </View>

            {/* Unified Body Card Container */}
            <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                {/* Toggle Mode */}
                <View style={[styles.modeContainer, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                    <Button 
                        mode={viewMode === 'seeker' ? 'contained' : 'outlined'} 
                        buttonColor={viewMode === 'seeker' ? theme.accent : undefined}
                        textColor={viewMode === 'seeker' ? '#fff' : theme.textPrimary}
                        onPress={() => setViewMode('seeker')}
                        style={styles.toggleBtn}
                        labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                    >
                        Job Seeker
                    </Button>
                    <Button 
                        mode={viewMode === 'reviewer' ? 'contained' : 'outlined'} 
                        buttonColor={viewMode === 'reviewer' ? theme.accent : undefined}
                        textColor={viewMode === 'reviewer' ? '#fff' : theme.textPrimary}
                        onPress={() => setViewMode('reviewer')}
                        style={styles.toggleBtn}
                        labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                    >
                        Recruiter/Expert
                    </Button>
                </View>

                <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
                    {viewMode === 'seeker' ? (
                        <View>
                            {/* Seeker Input Card */}
                            <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border }]} elevation={2}>
                                <Card.Content>
                                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Submit Resume for Review</Text>
                                    
                                    <TouchableOpacity style={[styles.pickerTrigger, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setResumeSelectorVisible(true)}>
                                        <Text style={[styles.pickerText, { color: theme.textPrimary }]}>
                                            {selectedResumeId 
                                                ? meta.find((m: any) => m.id === selectedResumeId)?.name 
                                                : "Select a Resume..."}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8, color: theme.textPrimary }]}>Select Reviewer Profile</Text>
                                    {reviewers.map(r => (
                                        <TouchableOpacity 
                                            key={r.id}
                                            style={[styles.reviewerCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }, selectedReviewerId === r.id && { borderColor: theme.accent, borderWidth: 2 }]}
                                            onPress={() => setSelectedReviewerId(r.id)}
                                        >
                                            <Avatar.Text size={40} label={r.avatar} style={{ backgroundColor: theme.bgDark }} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: theme.textPrimary }}>{r.name}</Text>
                                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{r.role} • ⭐ {r.rating}</Text>
                                            </View>
                                            <RadioButton.Android 
                                                value={r.id} 
                                                status={selectedReviewerId === r.id ? 'checked' : 'unchecked'}
                                                onPress={() => setSelectedReviewerId(r.id)}
                                                color={theme.accent}
                                            />
                                        </TouchableOpacity>
                                    ))}

                                    <Button 
                                        mode="contained" 
                                        icon="rocket"
                                        onPress={handleSeekerSubmit} 
                                        style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                                        contentStyle={{ height: 48 }}
                                    >
                                        Submit CV Review (R100 Fee)
                                    </Button>
                                </Card.Content>
                            </Card>

                            {/* Seeker History List */}
                            <Text style={[styles.listHeader, { color: theme.textSecondary }]}>My Submission History</Text>
                            {mySubmissions.length === 0 ? (
                                <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginVertical: 8 }}>No submissions yet.</Text>
                            ) : (
                                mySubmissions.map(s => (
                                    <Card key={s.id} style={[styles.historyCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]} elevation={1}>
                                        <Card.Content>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: theme.textPrimary }}>{s.resumeName}</Text>
                                                <View style={[styles.badge, { backgroundColor: s.status === 'Completed' ? '#dcfce7' : '#fef3c7' }]}>
                                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: s.status === 'Completed' ? '#15803d' : '#b45309' }}>{s.status}</Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Assigned: {reviewers.find(r => r.id === s.reviewerId)?.name} • {s.timestamp}</Text>

                                            {s.feedback && (
                                                <TouchableOpacity style={[styles.feedbackBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setSelectedFeedback(s.feedback)}>
                                                    <Text style={[styles.feedbackPreview, { color: theme.textPrimary }]} numberOfLines={2}>"{s.feedback.text}"</Text>
                                                    <Text style={[styles.readMoreText, { color: theme.accent }]}>View Full Review & Ratings →</Text>
                                                </TouchableOpacity>
                                            )}
                                        </Card.Content>
                                    </Card>
                                ))
                            )}
                        </View>
                    ) : (
                        <View>
                            {/* Reviewer Queue */}
                            <Text style={[styles.listHeader, { color: theme.textSecondary }]}>Reviewer Submission Queue</Text>
                            {submissions.length === 0 ? (
                                <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginVertical: 8 }}>No pending submissions in queue.</Text>
                            ) : (
                                submissions.map(s => (
                                    <Card key={s.id} style={[styles.queueCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]} elevation={1}>
                                        <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: theme.textPrimary }}>{s.resumeName}</Text>
                                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>Submitted by: {s.profileName}</Text>
                                                <Text style={{ fontSize: 10, color: theme.textSecondary }}>{s.timestamp}</Text>
                                            </View>
                                            <Button 
                                                mode="contained" 
                                                onPress={() => openReviewerWorkbench(s)}
                                                style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                                                labelStyle={{ fontSize: 11 }}
                                            >
                                                {s.status === 'Completed' ? 'Edit Review' : 'Start Review'}
                                            </Button>
                                        </Card.Content>
                                    </Card>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Persistent Sticky Footer Card */}
            <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Publish for Review</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>JobReady Hub</Text>
                </View>

                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub', { openSettings: true })} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
                </TouchableOpacity>
            </View>

            {/* Resume Selection Modal Dialog */}
            <Portal>
                <Dialog visible={resumeSelectorVisible} onDismiss={() => setResumeSelectorVisible(false)} style={{ backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1.5 }}>
                    <Dialog.Title style={{ color: theme.textPrimary }}>Select Resume for Review</Dialog.Title>
                    <Dialog.Content>
                        {meta.map((m: any) => (
                            <TouchableOpacity 
                                key={m.id} 
                                style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border }}
                                onPress={() => {
                                    setSelectedResumeId(m.id);
                                    setResumeSelectorVisible(false);
                                }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.textPrimary }}>{m.name}</Text>
                                <Text style={{ fontSize: 11, color: theme.textSecondary }}>Last updated: {new Date(m.updatedAt).toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setResumeSelectorVisible(false)} textColor={theme.accent}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Feedback Detail Modal */}
            <Portal>
                <Dialog visible={!!selectedFeedback} onDismiss={() => setSelectedFeedback(null)} style={{ backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1.5 }}>
                    <Dialog.Title style={{ color: theme.textPrimary }}>Reviewer Feedback & Critique</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ fontSize: 14, color: theme.textPrimary, fontStyle: 'italic', marginBottom: 12 }}>
                            "{selectedFeedback?.text}"
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'right' }}>
                            Reviewed on {selectedFeedback?.date}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSelectedFeedback(null)} textColor={theme.accent}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Reviewer Full Screen Workbench Modal */}
            <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
                <View style={{ flex: 1, backgroundColor: theme.bgDark }}>
                    <Appbar.Header style={{ backgroundColor: theme.bgSurface }}>
                        <Appbar.Action icon="close" color="#fff" onPress={() => setViewerVisible(false)} />
                        <Appbar.Content title={`Reviewing: ${activeSubmission?.resumeName}`} color="#fff" />
                    </Appbar.Header>

                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        <View style={{ flex: 1.2, borderBottomWidth: 1, borderColor: theme.border }}>
                            {activeSubmission?.resumeData ? (
                                <Vignette_PubRev data={activeSubmission.resumeData} />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary }}>No resume snapshot data found.</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ padding: 16, backgroundColor: theme.bgSurface, borderTopWidth: 1, borderColor: theme.border }}>
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Evaluation & Feedback</Text>
                            <TextInput 
                                label="Expert critique..."
                                value={feedbackText}
                                onChangeText={setFeedbackText}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={{ marginTop: 8, backgroundColor: theme.bgDark }}
                                textColor={theme.textPrimary}
                                placeholder="Add comments on layout, experience description, or skills highlights."
                            />
                            <Button 
                                mode="contained"
                                onPress={handleReviewSubmit}
                                style={{ marginTop: 16, backgroundColor: theme.accent }}
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
    container: { flex: 1 },
    headerBanner: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },
    themeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    subtitleCentered: { textAlign: 'center', fontSize: 12, marginTop: 6, fontWeight: '500' },
    bodyCard: { flex: 1, marginHorizontal: 8, marginTop: 8, marginBottom: 60, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
    modeContainer: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, justifyContent: 'space-around' },
    toggleBtn: { flex: 0.48, borderRadius: 8 },
    card: { borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8 },
    pickerText: { fontSize: 14 },
    reviewerCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderRadius: 8, marginVertical: 6 },
    submitBtn: { marginTop: 16, borderRadius: 8 },
    listHeader: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginVertical: 12 },
    historyCard: { borderRadius: 8, marginBottom: 8, borderWidth: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    feedbackBanner: { marginTop: 12, padding: 10, borderWidth: 1, borderRadius: 6 },
    feedbackPreview: { fontSize: 13, fontStyle: 'italic' },
    readMoreText: { fontSize: 11, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
    queueCard: { borderRadius: 8, marginBottom: 8, borderWidth: 1 },
    actionBtn: { borderRadius: 6 },
    footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1.5, zIndex: 100, elevation: 10 },
    footerIconBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },
});

export default PublishReviewScreen;
