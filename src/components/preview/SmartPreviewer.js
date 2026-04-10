import React, { useState, useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import NativeVignette from './NativeVignette';
import WorkbookVignette from './WorkbookVignette';

// We dynamically import react-native-pdf so that it doesn't instantly crash 
// unsupported environments (like Expo Go or Web) upon app launch.
let PdfViewer = null;
if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    try {
        PdfViewer = require('react-native-pdf').default;
    } catch (e) {
        console.warn('react-native-pdf could not be imported', e);
    }
}

const SmartPreviewer = ({ data, layout, exportFormat, pdfUri, isGenerating, mode = 'resume', buildList = [] }) => {
    const [engineState, setEngineState] = useState('evaluating'); // 'vignette', 'pdf', 'web_iframe'
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isGenerating) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.6, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' })
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
        }
    }, [isGenerating]);
    
    useEffect(() => {
        const evaluateSystem = () => {
            // 1. Web Fallback Check
            if (Platform.OS === 'web') {
                if (exportFormat === 'pdf') {
                    setEngineState('web_iframe');
                } else {
                    setEngineState('vignette');
                }
                return;
            }

            // 2. Execution Engine Check (Expo Go vs Dev Build)
            if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
                // Running inside standard Expo Go. Native modules unavailable.
                setEngineState('vignette');
                return;
            }

            // 3. Hardware Resource Check (South African Market Constraints)
            const MIN_MEMORY_BYTES = 3221225472; // 3GB
            const MIN_YEAR_CLASS = 2019;

            const isLowMemory = Device.totalMemory && Device.totalMemory < MIN_MEMORY_BYTES;
            const isOldProcessor = Device.deviceYearClass && Device.deviceYearClass < MIN_YEAR_CLASS;

            if (isLowMemory || isOldProcessor || !PdfViewer) {
                setEngineState('vignette');
                return;
            }

            // 4. Native Engine Approved!
            if (mode === 'workbook') {
                setEngineState('pdf'); // Workbook natively renders its own PDFs automatically.
            } else {
                // `react-native-pdf` only renders proper PDF files. Request: Use NativeVignette for Word Layout.
                if (exportFormat === 'pdf') {
                   setEngineState('pdf');
                } else {
                   setEngineState('vignette');
                }
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
            <NativeVignette data={data} layout={layout} exportFormat={exportFormat} />
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
    } else if (engineState === 'pdf') {
        content = (
            <View style={styles.pdfContainer}>
                {!pdfUri ? (
                    <View style={styles.centerAbsolute}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.loadingText}>Loading Native PDF...</Text>
                    </View>
                ) : null}
                
                {pdfUri && PdfViewer && (
                    <PdfViewer
                        source={{ uri: pdfUri, cache: true }}
                        style={styles.pdfInner}
                        trustAllCerts={false}
                        onError={(error) => console.log('PDF Renderer Error:', error)}
                    />
                )}
            </View>
        );
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
    centerAbsolute: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 10
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 12
    },
    pdfContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5'
    },
    pdfInner: {
        flex: 1,
        width: '100%',
        height: '100%',
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
