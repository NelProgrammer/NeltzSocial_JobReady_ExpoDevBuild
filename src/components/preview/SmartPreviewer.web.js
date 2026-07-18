import React, { useState, useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import NativeVignette_Preview from './NativeVignette_Preview';
import WorkbookVignette from './WorkbookVignette';

const SmartPreviewer = ({ data, layout, exportFormat, pdfUri, isGenerating, mode = 'resume', buildList = [] }) => {
    const [engineState, setEngineState] = useState('evaluating'); // 'vignette', 'web_iframe'
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isGenerating) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.6, duration: 400, useNativeDriver: false }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: false })
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
        }
    }, [isGenerating]);
    
    useEffect(() => {
        const evaluateSystem = () => {
            if (exportFormat === 'pdf') {
                setEngineState('web_iframe');
            } else {
                setEngineState('vignette');
            }
        };

        evaluateSystem();
    }, [exportFormat]);

    let content = null;

    if (engineState === 'evaluating') {
        content = (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Assessing rendering constraints...</Text>
            </View>
        );
    } else if (engineState === 'vignette') {
        content = mode === 'workbook' ? (
            <WorkbookVignette buildList={buildList} />
        ) : (
            <NativeVignette_Preview data={data} layout={layout} exportFormat={exportFormat} />
        );
    } else if (engineState === 'web_iframe') {
        if (!pdfUri) {
            content = (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6200ee" />
                </View>
            );
        } else {
            content = (
                <iframe 
                    src={pdfUri} 
                    style={{ width: '100%', height: '100%', border: 'none' }} 
                    title="PDF Preview"
                />
            );
        }
    }

    return (
        <Animated.View style={[
            styles.wrapper, 
            isGenerating && styles.glowingEdge,
            { opacity: pulseAnim }
        ]}>
            {content}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 12
    },
    wrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    glowingEdge: {
        borderColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10
    }
});

export default SmartPreviewer;
