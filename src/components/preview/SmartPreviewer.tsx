import React, { useState, useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { WebView } from 'react-native-webview';
import NativeVignette_Preview from './NativeVignette_Preview';
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

const SmartPreviewer = ({ 
    data = null, 
    layout = null, 
    exportFormat = null, 
    pdfUri = null, 
    isGenerating = false, 
    mode = 'resume', 
    buildList = [],
    fitMode = 'a4', // 'a4' (A4 proportional default), 'page' (100% fit), 'width' (Fill width)
    enableScroll = true 
}: any) => {
    const [engineState, setEngineState] = useState('evaluating'); // 'vignette', 'pdf', 'pdf_webview', 'web_iframe'
    const [pdfError, setPdfError] = useState(false);
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
            if (Platform.OS === 'web') {
                if (pdfUri || exportFormat === 'pdf') {
                    setEngineState('web_iframe');
                } else {
                    setEngineState('vignette');
                }
                return;
            }

            if (pdfUri) {
                if (PdfViewer && !pdfError) {
                    setEngineState('pdf');
                } else {
                    setEngineState('pdf_webview');
                }
                return;
            }

            setEngineState('vignette');
        };

        evaluateSystem();
    }, [exportFormat, pdfUri, mode, pdfError]);

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
            <NativeVignette_Preview data={data} layout={layout} exportFormat={exportFormat} fitMode={fitMode} />
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
    } else if (engineState === 'pdf' || engineState === 'pdf_webview') {
        const viewParam = fitMode === 'page' ? 'Fit' : fitMode === 'a4' ? 'Fit' : 'FitH';
        const formattedUri = pdfUri && !pdfUri.includes('#') ? `${pdfUri}#toolbar=0&navpanes=0&scrollbar=0&view=${viewParam}` : pdfUri;
        const htmlContent = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style>*{box-sizing:border-box;margin:0;padding:0;}html,body{width:100%;height:100%;overflow:hidden;background:#525659;display:flex;justify-content:flex-start;align-items:flex-start;}iframe,embed,object{width:100%;height:100%;flex:1;border:none;display:block;}</style></head><body><iframe src="${formattedUri}"></iframe></body></html>`;
        
        // Native PDF fit policy: 2 = Fit Both (100% visible), 0 = Fit Width, 1 = Fit Height
        const pdfFitPolicy = fitMode === 'page' ? 2 : fitMode === 'a4' ? 2 : 0;

        const pdfViewComponent = (
            <View style={[styles.pdfContainer, fitMode === 'a4' && styles.a4Container]}>
                {!pdfUri ? (
                    <View style={styles.centerAbsolute}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.loadingText}>Loading Native PDF...</Text>
                    </View>
                ) : null}
                
                {pdfUri && engineState === 'pdf' && PdfViewer && !pdfError ? (
                    <PdfViewer
                        source={{ uri: pdfUri, cache: true }}
                        style={styles.pdfInner}
                        fitPolicy={pdfFitPolicy}
                        enablePaging={!enableScroll}
                        enableRTL={false}
                        enableAntialiasing={true}
                        scale={1.0}
                        trustAllCerts={false}
                        onError={(error: any) => {
                            console.log('PDF Renderer Error, switching to WebView fallback:', error);
                            setPdfError(true);
                        }}
                    />
                ) : pdfUri ? (
                    <WebView 
                        source={{ html: htmlContent }}
                        style={styles.pdfInner}
                        originWhitelist={['*']}
                        scalesPageToFit={true}
                        scrollEnabled={enableScroll}
                    />
                ) : null}
            </View>
        );

        content = fitMode === 'a4' ? (
            <View style={styles.a4OuterWrapper}>
                {pdfViewComponent}
            </View>
        ) : (
            pdfViewComponent
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
        color: '#333'
    },
    pdfContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        alignSelf: 'flex-start',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#525659'
    },
    a4OuterWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#525659',
        padding: 2
    },
    a4Container: {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: 1 / 1.414,
        alignSelf: 'flex-start'
    },
    pdfInner: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignSelf: 'flex-start',
    },
    wrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignSelf: 'flex-start',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
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
