import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Vibration } from 'react-native';
import { Appbar, Text, Button, Card, TextInput, Divider, Menu, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { Storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TaxiScreen = ({ navigation }: { navigation: any }) => {
    const { user } = useContext(AuthContext);
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
        <View style={styles.container}>
            <Appbar.Header style={{ backgroundColor: '#6200ee' }}>
                <Appbar.BackAction color="#fff" onPress={() => navigation.goBack()} />
                <Appbar.Content title="Taxi 2 Interview" color="#fff" />
            </Appbar.Header>

            {activeTrip ? (
                // Active trip tracking view
                <View style={styles.activeContainer}>
                    <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
                        <Text style={styles.activeHeader}>COMMUTE SENTINEL RUNNING</Text>
                        <Text variant="headlineSmall" style={styles.activeDest}>{activeTrip.destination}</Text>

                        <Card style={styles.activeStatCard}>
                            <Card.Content style={{ alignItems: 'center' }}>
                                <Text style={styles.activeStatLabel}>Distance to Landmark stop</Text>
                                <Text style={styles.activeStatValue}>{activeTrip.estimate.distance.toFixed(1)} km</Text>
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
                            style={styles.endBtn} 
                            contentStyle={{ height: 48 }}
                            onPress={handleEndTrip}
                        >
                            🏁 Arrived & End Journey
                        </Button>
                    </ScrollView>
                </View>
            ) : (
                // Commute planner view
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.cardTitle}>Commute Calculator</Text>

                            <TextInput
                                label="Origin Location"
                                value={origin}
                                onChangeText={setOrigin}
                                mode="outlined"
                                style={styles.input}
                                placeholder="Township / Starting Station"
                            />

                            <TextInput
                                label="Interview Destination Address"
                                value={destination}
                                onChangeText={runAddressVerification}
                                mode="outlined"
                                style={styles.input}
                                placeholder="Corporate/Residential Address"
                            />
                            {renderVerificationBadge()}

                            <View style={{ marginTop: 10 }}>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#777', textTransform: 'uppercase', marginBottom: 4 }}>Select Mode</Text>
                                <Menu
                                    visible={modeMenuVisible}
                                    onDismiss={() => setModeMenuVisible(false)}
                                    anchor={
                                        <TouchableOpacity style={styles.menuAnchor} onPress={() => setModeMenuVisible(true)}>
                                            <Text style={{ fontSize: 14 }}>
                                                {mode === 'taxi' ? '🇿🇦 Minibus Taxi (Landmark-based)' : mode === 'uber' ? '📱 E-Hail (Uber/Bolt)' : '🚌 Public Bus'}
                                            </Text>
                                            <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
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
                                style={styles.calculateBtn} 
                                contentStyle={{ height: 48 }}
                                onPress={handleCalculate}
                            >
                                Calculate Fare & Route
                            </Button>

                            {estimate && (
                                <View style={styles.estimateContainer}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6200ee' }}>ESTIMATED FARE BUDGET</Text>
                                    <Text style={styles.estimateValue}>R{estimate.min} - R{estimate.max}</Text>
                                    <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                        Distance: {estimate.distance} km • Est. Time: {estimate.duration} mins
                                    </Text>
                                    <Divider style={{ marginVertical: 10 }} />
                                    <Text style={{ fontSize: 11, color: '#888' }}>
                                        <strong>Transfers:</strong> {estimate.landmarks.join(' ➔ ')}
                                    </Text>
                                    <Button 
                                        mode="contained" 
                                        style={styles.saveBtn} 
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
                    <Text style={styles.sectionHeader}>Saved Commutes</Text>
                    {savedTrips.length === 0 ? (
                        <Card style={styles.card}>
                            <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <Text style={{ color: '#999', fontStyle: 'italic' }}>No saved interview commutes yet.</Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        savedTrips.map((trip: any) => (
                            <Card key={trip.id} style={styles.tripCard} elevation={1}>
                                <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{trip.destination}</Text>
                                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                            From: {trip.origin} • {trip.mode.toUpperCase()}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#6200ee', fontWeight: 'bold', marginTop: 2 }}>
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
                    <Card style={[styles.card, { marginTop: 16 }]}>
                        <Card.Content>
                            <Text style={styles.cardTitle}>Commute Safety Sentinel</Text>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                                Trusted contacts who will receive your WhatsApp safety updates and panic alerts during the commute:
                            </Text>
                            {safetyContacts.map((c, i) => (
                                <View key={i} style={styles.contactRow}>
                                    <Text style={{ fontWeight: 'bold' }}>👤 {c.name}</Text>
                                    <Text style={{ color: '#777' }}>{c.phone}</Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
    input: { marginBottom: 12, backgroundColor: '#fff' },
    badgeContainer: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
    menuAnchor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fafafa' },
    calculateBtn: { marginTop: 16, backgroundColor: '#6200ee', borderRadius: 8 },
    estimateContainer: { marginTop: 20, padding: 16, borderWidth: 1, borderColor: '#6200ee', borderRadius: 8, backgroundColor: '#f5f0ff' },
    estimateValue: { fontSize: 24, fontWeight: '800', color: '#6200ee', marginVertical: 4 },
    saveBtn: { marginTop: 12, backgroundColor: '#6200ee', borderRadius: 6 },
    sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginVertical: 12 },
    tripCard: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
    
    // Active View Styles
    activeContainer: { flex: 1 },
    activeHeader: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 2, marginVertical: 8 },
    activeDest: { fontWeight: 'bold', textAlign: 'center', marginHorizontal: 20, marginBottom: 24 },
    activeStatCard: { width: '100%', padding: 16, borderRadius: 16, backgroundColor: '#fff', marginBottom: 32 },
    activeStatLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
    activeStatValue: { fontSize: 48, fontWeight: '900', color: '#6200ee', marginVertical: 8 },
    panicGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 32 },
    panicBtn: { flex: 0.48, padding: 24, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    panicBtnText: { color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 13 },
    endBtn: { width: '100%', borderRadius: 8, backgroundColor: '#6200ee' }
});

export default TaxiScreen;
