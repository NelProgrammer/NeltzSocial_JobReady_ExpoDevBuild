import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WorkbookVignette = ({ buildList }) => {
    if (!buildList || buildList.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={80} color="#ddd" />
                <Text style={styles.emptyText}>Build List is Empty</Text>
                <Text style={styles.emptySubtext}>Add documents from the library to preview your application pack.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {buildList.map((item, index) => (
                <View key={item.id || index} style={styles.pageWrapper}>
                    <Surface style={styles.page} elevation={4}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons 
                                name={item.type === 'cv' ? "file-account" : "file-document"} 
                                size={32} 
                                color="#2c3e50" 
                            />
                            <View style={styles.headerText}>
                                <Text style={styles.docTitle}>{item.name}</Text>
                                <Text style={styles.docMeta}>Page {index + 1} of {buildList.length} • {item.type?.toUpperCase()}</Text>
                            </View>
                        </View>
                        
                        <Divider style={styles.divider} />
                        
                        <View style={styles.contentPlaceholder}>
                            <MaterialCommunityIcons name="eye-outline" size={40} color="#eee" />
                            <Text style={styles.placeholderText}>High-Fidelity Document Preview</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>Source: {item.source || 'Local'}</Text>
                                <Text style={styles.infoText}>Size: {item.size || 'Standard A4'}</Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>NeltzSocial JobReady Application Pack</Text>
                            <Text style={styles.footerPage}>{index + 1}</Text>
                        </View>
                    </Surface>
                    {index < buildList.length - 1 && <View style={styles.spacer} />}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    pageWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    page: {
        width: 320, // Mobile-friendly A4 ratio
        aspectRatio: 1 / 1.4142,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 4,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerText: {
        marginLeft: 12,
    },
    docTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    docMeta: {
        fontSize: 10,
        color: '#95a5a6',
        marginTop: 2,
    },
    divider: {
        backgroundColor: '#f0f0f0',
        height: 1,
    },
    contentPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 40,
        borderWidth: 2,
        borderColor: '#f8f9fa',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    placeholderText: {
        fontSize: 12,
        color: '#bdc3c7',
        marginTop: 10,
        fontStyle: 'italic',
    },
    infoBox: {
        marginTop: 20,
        backgroundColor: '#fcfcfc',
        padding: 10,
        borderRadius: 4,
        width: '80%',
    },
    infoText: {
        fontSize: 9,
        color: '#95a5a6',
        textAlign: 'center',
        lineHeight: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#bdc3c7',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footerPage: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#bdc3c7',
    },
    spacer: {
        height: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ccc',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ddd',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default WorkbookVignette;
