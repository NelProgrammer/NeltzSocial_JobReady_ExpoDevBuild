import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, Card, TextInput, Button, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Storage } from '../utils/storage';

export type TransportMode = 'TAXI' | 'TRAIN' | 'BUS' | 'WALKING' | 'RIDE_HAIL' | 'OTHER';
export type TrafficDensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'GRIDLOCK';

export interface CommuteLeg {
    id: string;
    legOrder: number;
    legName: string;
    mode: TransportMode;
    farePerTrip: number;
    tripsPerDay: number;
    workingDaysPerMonth: number;
    monthlyBudget: number;
    trafficDensity: TrafficDensity;
    estimatedDelayMinutes: number;
    traverseTimeMinutes: number;
}

export interface CommuteJourney {
    id: string;
    journeyName: string;
    isDefaultWorkday: boolean;
    legs: CommuteLeg[];
    updatedAt: number;
}

const DENSITY_DELAYS: Record<TrafficDensity, number> = {
    LOW: 0,
    MEDIUM: 10,
    HIGH: 25,
    GRIDLOCK: 45
};

const MODE_ICONS: Record<TransportMode, string> = {
    TAXI: 'taxi',
    TRAIN: 'train',
    BUS: 'bus',
    WALKING: 'walk',
    RIDE_HAIL: 'car-hatchback',
    OTHER: 'map-marker-distance'
};

const MODE_LABELS: Record<TransportMode, string> = {
    TAXI: '🇿🇦 Minibus Taxi',
    TRAIN: '🚆 Train / Metro',
    BUS: '🚌 Public Bus',
    WALKING: '🚶 Walking',
    RIDE_HAIL: '📱 E-Hail (Uber/Bolt)',
    OTHER: '📍 Other Transit'
};

interface Props {
    userId: string;
    theme: any;
}

export const MultiLegCommutePlanner: React.FC<Props> = ({ userId, theme }) => {
    const [journeys, setJourneys] = useState<CommuteJourney[]>([]);
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

    // Modal state for Add/Edit Leg
    const [legModalVisible, setLegModalVisible] = useState(false);
    const [editingLeg, setEditingLeg] = useState<CommuteLeg | null>(null);

    // Modal state for Add Journey
    const [newJourneyModalVisible, setNewJourneyModalVisible] = useState(false);
    const [newJourneyName, setNewJourneyName] = useState('');

    // Leg form state
    const [legName, setLegName] = useState('');
    const [legMode, setLegMode] = useState<TransportMode>('TAXI');
    const [fareInput, setFareInput] = useState('20');
    const [tripsPerDayInput, setTripsPerDayInput] = useState('2');
    const [workDaysInput, setWorkDaysInput] = useState('20');
    const [traverseTimeInput, setTraverseTimeInput] = useState('25');
    const [trafficDensity, setTrafficDensity] = useState<TrafficDensity>('LOW');

    const storageKey = `commute_multi_journeys_${userId}`;

    useEffect(() => {
        loadJourneys();
    }, [userId]);

    const loadJourneys = async () => {
        const data = await Storage.get(storageKey);
        if (data && Array.isArray(data) && data.length > 0) {
            setJourneys(data);
            setSelectedJourneyId(data[0].id);
        } else {
            // Seed default initial journey
            const defaultJourney: CommuteJourney = {
                id: 'journey_' + Date.now(),
                journeyName: 'Daily Workday Commute',
                isDefaultWorkday: true,
                updatedAt: Date.now(),
                legs: [
                    {
                        id: 'leg_1',
                        legOrder: 1,
                        legName: 'Walk to Local Taxi Rank',
                        mode: 'WALKING',
                        farePerTrip: 0,
                        tripsPerDay: 2,
                        workingDaysPerMonth: 20,
                        monthlyBudget: 0,
                        trafficDensity: 'LOW',
                        estimatedDelayMinutes: 0,
                        traverseTimeMinutes: 10
                    },
                    {
                        id: 'leg_2',
                        legOrder: 2,
                        legName: 'Minibus Taxi to CBD Main Rank',
                        mode: 'TAXI',
                        farePerTrip: 22,
                        tripsPerDay: 2,
                        workingDaysPerMonth: 20,
                        monthlyBudget: 880,
                        trafficDensity: 'HIGH',
                        estimatedDelayMinutes: 25,
                        traverseTimeMinutes: 35
                    },
                    {
                        id: 'leg_3',
                        legOrder: 3,
                        legName: 'Walk to Office Destination',
                        mode: 'WALKING',
                        farePerTrip: 0,
                        tripsPerDay: 2,
                        workingDaysPerMonth: 20,
                        monthlyBudget: 0,
                        trafficDensity: 'LOW',
                        estimatedDelayMinutes: 0,
                        traverseTimeMinutes: 8
                    }
                ]
            };
            setJourneys([defaultJourney]);
            setSelectedJourneyId(defaultJourney.id);
            await Storage.set(storageKey, [defaultJourney]);
        }
    };

    const saveJourneysList = async (updated: CommuteJourney[]) => {
        setJourneys(updated);
        await Storage.set(storageKey, updated);
    };

    const currentJourney = journeys.find(j => j.id === selectedJourneyId) || journeys[0];

    // Aggregates
    const totalLegs = currentJourney?.legs.length || 0;
    const totalTraverseMins = currentJourney?.legs.reduce((acc, l) => acc + l.traverseTimeMinutes, 0) || 0;
    const totalDelayMins = currentJourney?.legs.reduce((acc, l) => acc + l.estimatedDelayMinutes, 0) || 0;
    const totalTravelTimeMins = totalTraverseMins + totalDelayMins;
    const totalMonthlyBudget = currentJourney?.legs.reduce((acc, l) => acc + l.monthlyBudget, 0) || 0;
    const totalOneWayFare = currentJourney?.legs.reduce((acc, l) => acc + l.farePerTrip, 0) || 0;

    const handleCreateJourney = async () => {
        if (!newJourneyName.trim()) return;
        const newJ: CommuteJourney = {
            id: 'journey_' + Date.now(),
            journeyName: newJourneyName.trim(),
            isDefaultWorkday: false,
            legs: [],
            updatedAt: Date.now()
        };
        const updated = [...journeys, newJ];
        await saveJourneysList(updated);
        setSelectedJourneyId(newJ.id);
        setNewJourneyName('');
        setNewJourneyModalVisible(false);
    };

    const handleDeleteJourney = async (id: string) => {
        if (journeys.length <= 1) {
            Alert.alert("Notice", "You must maintain at least one commute journey.");
            return;
        }
        Alert.alert("Delete Journey", "Delete this commute journey and all its legs?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const updated = journeys.filter(j => j.id !== id);
                    await saveJourneysList(updated);
                    setSelectedJourneyId(updated[0]?.id || null);
                }
            }
        ]);
    };

    const openAddLegModal = () => {
        setEditingLeg(null);
        setLegName('');
        setLegMode('TAXI');
        setFareInput('20');
        setTripsPerDayInput('2');
        setWorkDaysInput('20');
        setTraverseTimeInput('25');
        setTrafficDensity('LOW');
        setLegModalVisible(true);
    };

    const openEditLegModal = (leg: CommuteLeg) => {
        setEditingLeg(leg);
        setLegName(leg.legName);
        setLegMode(leg.mode);
        setFareInput(leg.farePerTrip.toString());
        setTripsPerDayInput(leg.tripsPerDay.toString());
        setWorkDaysInput(leg.workingDaysPerMonth.toString());
        setTraverseTimeInput(leg.traverseTimeMinutes.toString());
        setTrafficDensity(leg.trafficDensity);
        setLegModalVisible(true);
    };

    const handleSaveLeg = async () => {
        if (!currentJourney) return;
        const fare = parseFloat(fareInput) || 0;
        const trips = parseInt(tripsPerDayInput, 10) || 2;
        const days = parseInt(workDaysInput, 10) || 20;
        const traverse = parseInt(traverseTimeInput, 10) || 15;
        const delay = DENSITY_DELAYS[trafficDensity] || 0;
        const budget = fare * trips * days;

        let updatedLegs: CommuteLeg[];
        if (editingLeg) {
            updatedLegs = currentJourney.legs.map(l => {
                if (l.id === editingLeg.id) {
                    return {
                        ...l,
                        legName: legName.trim() || 'Transit Leg',
                        mode: legMode,
                        farePerTrip: fare,
                        tripsPerDay: trips,
                        workingDaysPerMonth: days,
                        monthlyBudget: budget,
                        trafficDensity,
                        estimatedDelayMinutes: delay,
                        traverseTimeMinutes: traverse
                    };
                }
                return l;
            });
        } else {
            const newLeg: CommuteLeg = {
                id: 'leg_' + Date.now(),
                legOrder: currentJourney.legs.length + 1,
                legName: legName.trim() || `Leg ${currentJourney.legs.length + 1}`,
                mode: legMode,
                farePerTrip: fare,
                tripsPerDay: trips,
                workingDaysPerMonth: days,
                monthlyBudget: budget,
                trafficDensity,
                estimatedDelayMinutes: delay,
                traverseTimeMinutes: traverse
            };
            updatedLegs = [...currentJourney.legs, newLeg];
        }

        const updatedJourneys = journeys.map(j => {
            if (j.id === currentJourney.id) {
                return { ...j, legs: updatedLegs, updatedAt: Date.now() };
            }
            return j;
        });

        await saveJourneysList(updatedJourneys);
        setLegModalVisible(false);
    };

    const handleDeleteLeg = async (legId: string) => {
        if (!currentJourney) return;
        const filtered = currentJourney.legs.filter(l => l.id !== legId).map((l, idx) => ({
            ...l,
            legOrder: idx + 1
        }));
        const updatedJourneys = journeys.map(j => {
            if (j.id === currentJourney.id) {
                return { ...j, legs: filtered, updatedAt: Date.now() };
            }
            return j;
        });
        await saveJourneysList(updatedJourneys);
    };

    const handleMoveLeg = async (legIndex: number, direction: 'up' | 'down') => {
        if (!currentJourney) return;
        const targetIndex = direction === 'up' ? legIndex - 1 : legIndex + 1;
        if (targetIndex < 0 || targetIndex >= currentJourney.legs.length) return;

        const legsCopy = [...currentJourney.legs];
        const temp = legsCopy[legIndex];
        legsCopy[legIndex] = legsCopy[targetIndex];
        legsCopy[targetIndex] = temp;

        const reordered = legsCopy.map((l, idx) => ({ ...l, legOrder: idx + 1 }));
        const updatedJourneys = journeys.map(j => {
            if (j.id === currentJourney.id) {
                return { ...j, legs: reordered, updatedAt: Date.now() };
            }
            return j;
        });
        await saveJourneysList(updatedJourneys);
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
            {/* Journey Carousel / Switcher */}
            <View style={styles.journeyHeaderRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {journeys.map(j => {
                        const isSelected = j.id === (currentJourney?.id);
                        return (
                            <TouchableOpacity
                                key={j.id}
                                style={[
                                    styles.journeyTab,
                                    {
                                        backgroundColor: isSelected ? theme.accent : theme.bgDark,
                                        borderColor: isSelected ? theme.accent : theme.border
                                    }
                                ]}
                                onPress={() => setSelectedJourneyId(j.id)}
                            >
                                <Text
                                    style={{
                                        color: isSelected ? '#fff' : theme.textSecondary,
                                        fontWeight: 'bold',
                                        fontSize: 13
                                    }}
                                >
                                    {j.journeyName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <IconButton
                    icon="plus-circle"
                    iconColor={theme.accent}
                    size={28}
                    onPress={() => setNewJourneyModalVisible(true)}
                />
            </View>

            {/* Journey Metrics Card */}
            <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                            {currentJourney?.journeyName}
                        </Text>
                        <IconButton
                            icon="trash-can-outline"
                            iconColor="#ef4444"
                            size={20}
                            onPress={() => currentJourney && handleDeleteJourney(currentJourney.id)}
                        />
                    </View>

                    <View style={styles.metricGrid}>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Travel Time</Text>
                            <Text style={[styles.metricValue, { color: theme.accent }]}>
                                {totalTravelTimeMins} mins
                            </Text>
                            <Text style={{ fontSize: 11, color: totalDelayMins > 0 ? '#f59e0b' : '#10b981' }}>
                                {totalTraverseMins}m transit + {totalDelayMins}m buffer
                            </Text>
                        </View>

                        <View style={styles.metricItem}>
                            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Monthly Transit Cost</Text>
                            <Text style={[styles.metricValue, { color: '#10b981' }]}>
                                R {totalMonthlyBudget.toFixed(0)}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                R {totalOneWayFare.toFixed(0)} one-way fare
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Multi-Leg Timeline */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
                <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                    Transit Route Legs ({totalLegs})
                </Text>
                <Button
                    mode="contained"
                    onPress={openAddLegModal}
                    style={{ backgroundColor: theme.accent }}
                    labelStyle={{ fontSize: 12 }}
                >
                    + Add Leg
                </Button>
            </View>

            {currentJourney?.legs.length === 0 ? (
                <Card style={[styles.card, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                    <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
                        <MaterialCommunityIcons name="transit-connection-variant" size={40} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, marginTop: 8 }}>No transit legs defined yet.</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                            Break your journey into legs (e.g. Walking, Minibus Taxi, Train) to track accurate budgets and arrival buffers.
                        </Text>
                    </Card.Content>
                </Card>
            ) : (
                currentJourney?.legs.map((leg, index) => {
                    const icon = MODE_ICONS[leg.mode] || 'taxi';
                    const densityColor = leg.trafficDensity === 'LOW' ? '#10b981' : leg.trafficDensity === 'MEDIUM' ? '#f59e0b' : '#ef4444';
                    return (
                        <Card key={leg.id} style={[styles.legCard, { backgroundColor: theme.bgDark, borderColor: theme.border }]}>
                            <Card.Content style={{ paddingVertical: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[styles.orderCircle, { backgroundColor: theme.accent }]}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{leg.legOrder}</Text>
                                        </View>
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: theme.textPrimary }}>
                                                {leg.legName}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                <MaterialCommunityIcons name={icon as any} size={14} color={theme.accent} />
                                                <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                                    {MODE_LABELS[leg.mode]}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#10b981' }}>
                                            {leg.farePerTrip > 0 ? `R ${leg.farePerTrip.toFixed(0)}` : 'Free'}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                                            R {leg.monthlyBudget.toFixed(0)}/mo
                                        </Text>
                                    </View>
                                </View>

                                <Divider style={{ marginVertical: 8 }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textSecondary} />
                                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                            {leg.traverseTimeMinutes}m traverse
                                        </Text>
                                        {leg.estimatedDelayMinutes > 0 && (
                                            <View style={[styles.densityBadge, { borderColor: densityColor, backgroundColor: densityColor + '20' }]}>
                                                <Text style={{ color: densityColor, fontSize: 10, fontWeight: 'bold' }}>
                                                    +{leg.estimatedDelayMinutes}m buffer ({leg.trafficDensity})
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <IconButton
                                            icon="chevron-up"
                                            size={18}
                                            disabled={index === 0}
                                            onPress={() => handleMoveLeg(index, 'up')}
                                            style={{ margin: 0 }}
                                        />
                                        <IconButton
                                            icon="chevron-down"
                                            size={18}
                                            disabled={index === currentJourney.legs.length - 1}
                                            onPress={() => handleMoveLeg(index, 'down')}
                                            style={{ margin: 0 }}
                                        />
                                        <IconButton
                                            icon="pencil-outline"
                                            size={18}
                                            iconColor={theme.accent}
                                            onPress={() => openEditLegModal(leg)}
                                            style={{ margin: 0 }}
                                        />
                                        <IconButton
                                            icon="trash-can-outline"
                                            size={18}
                                            iconColor="#ef4444"
                                            onPress={() => handleDeleteLeg(leg.id)}
                                            style={{ margin: 0 }}
                                        />
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    );
                })
            )}

            {/* Modal: Add/Edit Leg */}
            <Modal
                visible={legModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setLegModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                            {editingLeg ? 'Edit Transit Leg' : 'Add Transit Leg'}
                        </Text>

                        <TextInput
                            label="Leg Name / Description"
                            value={legName}
                            onChangeText={setLegName}
                            mode="outlined"
                            style={styles.modalInput}
                            placeholder="e.g. Minibus Taxi to Sandton"
                        />

                        {/* Mode selection buttons */}
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                            Mode of Travel
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {(['TAXI', 'TRAIN', 'BUS', 'WALKING', 'RIDE_HAIL'] as TransportMode[]).map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.modeChip,
                                        {
                                            backgroundColor: legMode === m ? theme.accent : theme.bgDark,
                                            borderColor: legMode === m ? theme.accent : theme.border
                                        }
                                    ]}
                                    onPress={() => setLegMode(m)}
                                >
                                    <Text style={{ color: legMode === m ? '#fff' : theme.textPrimary, fontSize: 11, fontWeight: 'bold' }}>
                                        {MODE_LABELS[m]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                label="Fare / Trip (R)"
                                value={fareInput}
                                onChangeText={setFareInput}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.modalInput, { flex: 1 }]}
                            />
                            <TextInput
                                label="Traverse (Mins)"
                                value={traverseTimeInput}
                                onChangeText={setTraverseTimeInput}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.modalInput, { flex: 1 }]}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                label="Trips / Day"
                                value={tripsPerDayInput}
                                onChangeText={setTripsPerDayInput}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.modalInput, { flex: 1 }]}
                            />
                            <TextInput
                                label="Workdays / Mo"
                                value={workDaysInput}
                                onChangeText={setWorkDaysInput}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.modalInput, { flex: 1 }]}
                            />
                        </View>

                        {/* Traffic Density Picker */}
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                            Traffic Density Delay Buffer
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                            {(['LOW', 'MEDIUM', 'HIGH', 'GRIDLOCK'] as TrafficDensity[]).map(d => {
                                const selected = trafficDensity === d;
                                return (
                                    <TouchableOpacity
                                        key={d}
                                        style={[
                                            styles.densityChip,
                                            {
                                                backgroundColor: selected ? theme.accent : theme.bgDark,
                                                borderColor: selected ? theme.accent : theme.border
                                            }
                                        ]}
                                        onPress={() => setTrafficDensity(d)}
                                    >
                                        <Text style={{ color: selected ? '#fff' : theme.textPrimary, fontSize: 10, fontWeight: 'bold' }}>
                                            {d} (+{DENSITY_DELAYS[d]}m)
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                            <Button mode="text" onPress={() => setLegModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleSaveLeg} style={{ backgroundColor: theme.accent }}>
                                Save Leg
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: Add New Journey */}
            <Modal
                visible={newJourneyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setNewJourneyModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                            Create New Commute Journey
                        </Text>
                        <TextInput
                            label="Journey Name"
                            value={newJourneyName}
                            onChangeText={setNewJourneyName}
                            mode="outlined"
                            style={styles.modalInput}
                            placeholder="e.g. Morning Interview Route"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <Button mode="text" onPress={() => setNewJourneyModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleCreateJourney} style={{ backgroundColor: theme.accent }}>
                                Create
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    journeyHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    journeyTab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8
    },
    card: {
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    metricGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 10
    },
    metricItem: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.15)'
    },
    metricLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    legCard: {
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1
    },
    orderCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    densityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 18
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 14
    },
    modalInput: {
        marginBottom: 10
    },
    modeChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 6
    },
    densityChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1
    }
});
