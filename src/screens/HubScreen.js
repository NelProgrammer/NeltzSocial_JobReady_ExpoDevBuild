import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const HubScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="NeltzSocial JobReady" />
            </Appbar.Header>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card} onPress={() => navigation.navigate('ResumeHome')}>
                    <Card.Cover source={require('../../assets/adaptive-icon.png')} style={styles.cover} />
                    <Card.Content>
                        <Title>Resume Builder</Title>
                        <Paragraph>Create, edit, and export your professional CVs.</Paragraph>
                    </Card.Content>
                </Card>

                <Card style={styles.card} onPress={() => navigation.navigate('PDFWorkbench')}>
                    <Card.Cover source={require('../../assets/adaptive-icon.png')} style={styles.cover} />
                    <Card.Content>
                        <Title>PDF Workbench</Title>
                        <Paragraph>Merge, split, and reorder pages from multiple PDFs.</Paragraph>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        marginBottom: 20,
        elevation: 4,
    },
    cover: {
        height: 150,
        backgroundColor: '#e0e0e0'
    }
});

export default HubScreen;
