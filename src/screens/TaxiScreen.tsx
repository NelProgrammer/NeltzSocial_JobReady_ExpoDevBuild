import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Vibration } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, Divider, Menu, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { Storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext';

const TaxiScreen = ({ navigation }: { navigation: any }) => {
    const { user } = useContext(AuthContext);
    const { theme } = useThemeContext();
    const insets = useSafeAreaInsets();

    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [savedTrips, setSavedTrips] = useState<any[]>([]);
    
    // Form State
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [mode, setMode] = useState('taxi'); // taxi, uber, bus
    const [estimate, setEstimate] = useState<any>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

    const [modeMenuVisible, setModeMenuVisible] = useState(false);
    const [simInterval, setSimInterval] = useState<any>(null);

    const safetyContacts = [
        { name: 'Mom', phone: '0831234567' },
        { name: 'Partner', phone: '0729876543' }
    ];

    useEffect(() => {
        loadData();
        return () => {
            if (simInterval) clearInterval(simInterval);
        };
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        const trips = await Storage.get(`taxi_trips_${user.id}`) || [];
        const active = await Storage.get(`taxi_active_trip_${user.id}`) || null;
        setSavedTrips(trips);
        setActiveTrip(active);

        if (active && !simInterval) {
            startSimulation(active, trips);
        }
    };

    const saveData = async (updatedTrips: any[], updatedActive: any) => {
        setSavedTrips(updatedTrips);
        setActiveTrip(updatedActive);
        if (user) {
            await Storage.set(`taxi_trips_${user.id}`, updatedTrips);
            await Storage.set(`taxi_active_trip_${user.id}`, updatedActive);
        }
    };

    const runAddressVerification = (addr: string) => {
        setDestination(addr);
        const addrLower = addr.toLowerCase();
        if (!addr.trim()) {
            setVerificationStatus(null);
            return;
        }

        if (addrLower.includes('red zone') || addrLower.includes('danger') || addrLower.includes('high risk') || addrLower.includes('hillbrow') || addrLower.includes('alexandra')) {
            setVerificationStatus('highrisk');
        } else if (addrLower.includes('office') || addrLower.includes('corp') || addrLower.includes('inc') || addrLower.includes('pty') || addrLower.includes('ltd') || addrLower.includes('mall') || addrLower.includes('centre') || addrLower.includes('hub')) {
            setVerificationStatus('verified');
        } else {
            setVerificationStatus('residential');
        }
    };

    const handleCalculate = () => {
        if (!origin.trim() || !destination.trim()) {
            Alert.alert("Error", "Please enter both origin and destination.");
            return;
        }

        const distance = Math.floor(Math.random() * 25) + 5; // 5km to 30km
        let cost = 0;
        let range = 0;
        let landmarks = [];

        if (mode === 'taxi') {
            cost = 15 + (distance * 10);
            range = 5;
            landmarks = [" township rank transfer", " CBD main ranks", " destination rank gate"];
        } else if (mode === 'uber') {
            cost = 25 + (distance * 12);
            range = 15;
            landmarks = ["Pick-up point", "Drop-off safety zone"];
        } else {
            cost = 22;
            range = 0;
            landmarks = ["Local bus stop station", "Metropolitan depot"];
        }

        setEstimate({
            min: cost,
            max: cost + range,
            distance: distance,
            duration: distance * 2,
            landmarks: landmarks
        });
    };

    const handleSaveTrip = async () => {
        if (!estimate) return;

        const newTrip = {
            id: 'trip_' + Date.now(),
            origin,
            destination,
            mode,
            estimate,
            verificationStatus,
            date: new Date().toLocaleDateString(),
            status: 'Planned'
        };

        const updatedTrips = [...savedTrips, newTrip];
        await saveData(updatedTrips, activeTrip);

        // Reset Form
        setOrigin('');
        setDestination('');
        setEstimate(null);
        setVerificationStatus(null);
        Alert.alert("Success", "Commute route saved successfully!");
    };

    const handleStartTrip = async (tripId: string) => {
        const trip = savedTrips.find((t: any) => t.id === tripId);
        if (!trip) return;

        trip.status = 'Active';
        const updatedTrips = savedTrips.map((t: any) => t.id === tripId ? trip : t);
        const clonedActive = JSON.parse(JSON.stringify(trip));

        await saveData(updatedTrips, clonedActive);
        startSimulation(clonedActive, updatedTrips);
    };

    const handleEndTrip = async () => {
        if (activeTrip) {
            const activeId = activeTrip.id;
            const updatedTrips = savedTrips.map((t: any) => {
                if (t.id === activeId) {
                    return { ...t, status: 'Completed' };
                }
                return t;
            });
            await saveData(updatedTrips, null);
        }
        stopSimulation();
        Alert.alert("Trip Completed", "Commute finished safely! Verify location on arrival.");
    };

    const startSimulation = (currActive: any, allTrips: any[]) => {
        if (simInterval) clearInterval(simInterval);

        let activeRef = { ...currActive };

        const interval = setInterval(async () => {
            if (activeRef.estimate && activeRef.estimate.distance > 0) {
                const newDist = Math.max(0, activeRef.estimate.distance - 0.2);
                activeRef.estimate.distance = newDist;

                // Sentinel Proximity Vibration Alert if <= 500m
                if (newDist <= 0.5 && newDist > 0) {
                    console.log("[Sentinel] Approaching landmark rank. Triggering native haptics.");
                    Vibration.vibrate([0, 500, 200, 500]); // heavy vibrations
                }

                if (newDist <= 0) {
                    activeRef.estimate.distance = 0;
                    clearInterval(interval);
                    setSimInterval(null);
                    Vibration.vibrate(1000); // long vibration
                    Alert.alert("📍 Arrived!", "You have reached your landmark. Verify destination safely.");
                }

                setActiveTrip({ ...activeRef });
                if (user) {
                    await Storage.set(`taxi_active_trip_${user.id}`, activeRef);
                }
            }
        }, 4000);

        setSimInterval(interval);
    };

    const stopSimulation = () => {
        if (simInterval) {
            clearInterval(simInterval);
            setSimInterval(null);
        }
    };

    const handleSendAlert = async (type: string) => {
        if (!activeTrip) return;

        let message = '';
        if (type === 'checkin') {
            message = `👍 JobReady Commute Check-In:\nI am safely en route to my interview at ${activeTrip.destination}. Distance remaining: ${activeTrip.estimate.distance.toFixed(1)} km. Everything is normal.`;
        } else {
            message = `🚨 JobReady EMERGENCY ALERT:\nI need assistance on my commute to ${activeTrip.destination}. Current route: ${activeTrip.origin} -> ${activeTrip.destination}. Please contact me immediately.`;
        }

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMsg}`;

        const supported = await Linking.canOpenURL(whatsappUrl);
        if (supported) {
            await Linking.openURL(whatsappUrl);
        } else {
            Alert.alert("WhatsApp not found", "Sharing alert link instead: " + whatsappUrl);
        }
    };

    const handleDeleteSavedTrip = async (tripId: string) => {
        Alert.alert(
            "Delete Commute",
            "Delete this planned trip?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        const updated = savedTrips.filter(t => t.id !== tripId);
                        await saveData(updated, activeTrip);
                    }
                }
            ]
        );
    };

    const renderVerificationBadge = () => {
        if (!verificationStatus) return null;

        if (verificationStatus === 'verified') {
            return (
                <View style={[styles.badgeContainer, { borderColor: '#10b981', backgroundColor: '#e6fbf3' }]}>
                    <Text style={{ color: '#065f46', fontSize: 12, fontWeight: 'bold' }}>
                        ✅ Verified Commercial Location (Legit Site)
                    </Text>
                </View>
            );
        } else if (verificationStatus === 'highrisk') {
            return (
                <View style={[styles.badgeContainer, { borderColor: '#ef4444', backgroundColor: '#fdf2f2' }]}>
                    <Text style={{ color: '#991b1b', fontSize: 12, fontWeight: 'bold' }}>
                        🚨 High Risk COMMUTE Zone (Exercise Caution)
                    </Text>
                </View>
            );
        } else {
            return (
                <View style={[styles.badgeContainer, { borderColor: '#f59e0b', backgroundColor: '#fefbeb' }]}>
                    <Text style={{ color: '#92400e', fontSize: 12, fontWeight: 'bold' }}>
                        ⚠️ Residential Address (Confirm Recruiter)
                    </Text>
                </View>
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgDark }]}>
            {/* Header Banner */}
            <View style={[styles.headerBanner, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.bgDark, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>Travel to Interview</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Commute Route & Taxi Safety</Text>
                    </View>
                    <View style={[styles.themeBadge, { backgroundColor: '#f59e0b' }]}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>UPCOMING</Text>
                    </View>
                </View>
                <Text style={[styles.subtitleCentered, { color: theme.textSecondary }]}>Commute route planning, taxi fare calculations and trip monitoring</Text>
            </View>

            {/* Unified Body Card Container */}
            <View style={[styles.bodyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                {activeTrip ? (
                    // Active trip tracking view
                    <View style={styles.activeContainer}>
                        <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
                            <Text style={styles.activeHeader}>COMMUTE SENTINEL RUNNING</Text>
                            <Text variant="headlineSmall" style={[styles.activeDest, { color: theme.textPrimary }]}>{activeTrip.destination}</Text>

                            <Card style={[styles.activeStatCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                                <Card.Content style={{ alignItems: 'center' }}>
                                    <Text style={[styles.activeStatLabel, { color: theme.textSecondary }]}>Distance to Landmark stop</Text>
                                    <Text style={[styles.activeStatValue, { color: theme.accent }]}>{activeTrip.estimate.distance.toFixed(1)} km</Text>
                                    <Text style={{ color: activeTrip.estimate.distance <= 0.5 ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: 15 }}>
                                        {activeTrip.estimate.distance <= 0.5 ? '⚠️ Approaching Stop!' : '🟢 Commute on Track'}
                                    </Text>
                                </Card.Content>
                            </Card>

                            <View style={styles.panicGrid}>
                                <TouchableOpacity style={[styles.panicBtn, { backgroundColor: '#10b981' }]} onPress={() => handleSendAlert('checkin')}>
                                    <MaterialCommunityIcons name="thumb-up" size={32} color="#fff" />
                                    <Text style={styles.panicBtnText}>CHECK IN OKAY</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.panicBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleSendAlert('panic')}>
                                    <MaterialCommunityIcons name="alert-decagram" size={32} color="#fff" />
                                    <Text style={styles.panicBtnText}>PANIC ALERT</Text>
                                </TouchableOpacity>
                            </View>

                            <Button 
                                mode="contained" 
                                style={[styles.endBtn, { backgroundColor: theme.accent }]} 
                                contentStyle={{ height: 48 }}
                                onPress={handleEndTrip}
                            >
                                🏁 Arrived & End Journey
                            </Button>
                        </ScrollView>
                    </View>
                ) : (
                    // Commute planner view
                    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
                        <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                            <Card.Content>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Commute Calculator</Text>

                                <TextInput
                                    label="Origin Location"
                                    value={origin}
                                    onChangeText={setOrigin}
                                    mode="outlined"
                                    style={[styles.input, { backgroundColor: theme.bgSurface }]}
                                    textColor={theme.textPrimary}
                                    placeholder="Township / Starting Station"
                                />

                                <TextInput
                                    label="Interview Destination Address"
                                    value={destination}
                                    onChangeText={runAddressVerification}
                                    mode="outlined"
                                    style={[styles.input, { backgroundColor: theme.bgSurface }]}
                                    textColor={theme.textPrimary}
                                    placeholder="Corporate/Residential Address"
                                />
                                {renderVerificationBadge()}

                                <View style={{ marginTop: 10 }}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>Select Mode</Text>
                                    <Menu
                                        visible={modeMenuVisible}
                                        onDismiss={() => setModeMenuVisible(false)}
                                        anchor={
                                            <TouchableOpacity style={[styles.menuAnchor, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => setModeMenuVisible(true)}>
                                                <Text style={{ fontSize: 14, color: theme.textPrimary }}>
                                                    {mode === 'taxi' ? '🇿🇦 Minibus Taxi (Landmark-based)' : mode === 'uber' ? '📱 E-Hail (Uber/Bolt)' : '🚌 Public Bus'}
                                                </Text>
                                                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        }
                                    >
                                        <Menu.Item onPress={() => { setMode('taxi'); setModeMenuVisible(false); }} title="Minibus Taxi" />
                                        <Menu.Item onPress={() => { setMode('uber'); setModeMenuVisible(false); }} title="E-Hail (Uber/Bolt)" />
                                        <Menu.Item onPress={() => { setMode('bus'); setModeMenuVisible(false); }} title="Public Bus" />
                                    </Menu>
                                </View>

                                <Button 
                                    mode="contained" 
                                    style={[styles.calculateBtn, { backgroundColor: theme.accent }]} 
                                    contentStyle={{ height: 48 }}
                                    onPress={handleCalculate}
                                >
                                    Calculate Fare & Route
                                </Button>

                                {estimate && (
                                    <View style={[styles.estimateContainer, { backgroundColor: theme.bgSurface, borderColor: theme.accent }]}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.accent }}>ESTIMATED FARE BUDGET</Text>
                                        <Text style={[styles.estimateValue, { color: theme.accent }]}>R{estimate.min} - R{estimate.max}</Text>
                                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                                            Distance: {estimate.distance} km • Est. Time: {estimate.duration} mins
                                        </Text>
                                        <Divider style={{ marginVertical: 10 }} />
                                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                            Transfers: {estimate.landmarks.join(' ➔ ')}
                                        </Text>
                                        <Button 
                                            mode="contained" 
                                            style={[styles.saveBtn, { backgroundColor: theme.accent }]} 
                                            onPress={handleSaveTrip}
                                            labelStyle={{ fontSize: 12 }}
                                        >
                                            Save Planned Route
                                        </Button>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Saved Trips */}
                        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Saved Commutes</Text>
                        {savedTrips.length === 0 ? (
                            <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                                <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No saved interview commutes yet.</Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            savedTrips.map((trip: any) => (
                                <Card key={trip.id} style={[styles.tripCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]} elevation={1}>
                                    <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme.textPrimary }}>{trip.destination}</Text>
                                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                                                From: {trip.origin} • {trip.mode.toUpperCase()}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: theme.accent, fontWeight: 'bold', marginTop: 2 }}>
                                                Est: R{trip.estimate.min} - R{trip.estimate.max}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Button 
                                                mode="contained" 
                                                onPress={() => handleStartTrip(trip.id)}
                                                style={{ backgroundColor: '#10b981', marginRight: 6 }}
                                                labelStyle={{ fontSize: 11 }}
                                            >
                                                GO
                                            </Button>
                                            <IconButton 
                                                icon="trash-can-outline" 
                                                iconColor="#ef4444" 
                                                size={20}
                                                style={{ margin: 0 }}
                                                onPress={() => handleDeleteSavedTrip(trip.id)} 
                                            />
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))
                        )}

                        {/* Safety Panel */}
                        <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border, marginTop: 16 }]}>
                            <Card.Content>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Commute Safety Sentinel</Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 12 }}>
                                    Trusted contacts who will receive your WhatsApp safety updates and panic alerts during the commute:
                                </Text>
                                {safetyContacts.map((c, i) => (
                                    <View key={i} style={[styles.contactRow, { borderColor: theme.border }]}>
                                        <Text style={{ fontWeight: 'bold', color: theme.textPrimary }}>👤 {c.name}</Text>
                                        <Text style={{ color: theme.textSecondary }}>{c.phone}</Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    </ScrollView>
                )}
            </View>

            {/* Persistent Sticky Footer Card */}
            <View style={[styles.footerCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="home-outline" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Travel to Interview</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>JobReady Hub</Text>
                </View>

                <TouchableOpacity style={[styles.footerIconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]} onPress={() => navigation.navigate('Hub', { openSettings: true })} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="cog-outline" size={22} color={theme.accent} />
                </TouchableOpacity>
            </View>
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
    card: { borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
    input: { marginBottom: 12 },
    badgeContainer: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
    menuAnchor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 12 },
    calculateBtn: { marginTop: 16, borderRadius: 8 },
    estimateContainer: { marginTop: 20, padding: 16, borderWidth: 1, borderRadius: 8 },
    estimateValue: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
    saveBtn: { marginTop: 12, borderRadius: 6 },
    sectionHeader: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginVertical: 12 },
    tripCard: { borderRadius: 8, marginBottom: 8, borderWidth: 1 },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
    activeContainer: { flex: 1 },
    activeHeader: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 2, marginVertical: 8 },
    activeDest: { fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
    activeStatCard: { width: '100%', borderRadius: 12, borderWidth: 1, marginBottom: 20 },
    activeStatLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
    activeStatValue: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
    panicGrid: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
    panicBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    panicBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginTop: 6 },
    endBtn: { width: '100%', borderRadius: 8 },
    footerCard: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1.5, zIndex: 100, elevation: 10 },
    footerIconBtn: { padding: 8, borderRadius: 10, borderWidth: 1 },
});

export default TaxiScreen;
