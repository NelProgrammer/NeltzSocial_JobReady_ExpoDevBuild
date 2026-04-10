import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Headless Parser
 * Injects generic HTML with mammoth.js and pdf.js capabilities.
 * It receives base64 string, determines the type, extracts text, and returns to React Native automatically.
 */
const HeadlessParser = ({ fileContext, onParsed, onError }) => {
    const webViewRef = useRef(null);

    const HTML_SOURCE = `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        <script>
            // Configure PDFJS locally
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            function sendResult(text) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', text }));
            }

            function sendError(error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error }));
            }

            function base64ToUint8Array(base64) {
                const raw = window.atob(base64);
                const rawLength = raw.length;
                const array = new Uint8Array(new ArrayBuffer(rawLength));
                for(let i = 0; i < rawLength; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                return array;
            }

            document.addEventListener("message", async function(event) {
                parseData(event.data);
            });
            window.addEventListener("message", async function(event) {
                parseData(event.data);
            });

            async function parseData(dataStr) {
                try {
                    const ctx = JSON.parse(dataStr);
                    const { base64, mimeType } = ctx;
                    const arrayBuffer = base64ToUint8Array(base64);

                    if (mimeType.includes('pdf')) {
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\\n';
                        }
                        sendResult(fullText);

                    } else if (mimeType.includes('word') || mimeType.includes('officedocument')) {
                        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.buffer });
                        sendResult(result.value);
                    } else if (mimeType.includes('text/plain')) {
                        // For raw text, we decode base64
                        const text = decodeURIComponent(escape(window.atob(base64)));
                        sendResult(text);
                    } else {
                        sendError("Unsupported file type: " + mimeType);
                    }
                } catch (e) {
                    sendError(e.message);
                }
            }
        </script>
    </head>
    <body></body>
    </html>
    `;

    useEffect(() => {
        if (fileContext && webViewRef.current) {
            // Give webview a millisecond to be ready
            setTimeout(() => {
                webViewRef.current.postMessage(JSON.stringify(fileContext));
            }, 500);
        }
    }, [fileContext]);

    return (
        <View style={{ height: 0, width: 0, opacity: 0 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: HTML_SOURCE }}
                onMessage={(event) => {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.status === 'success') {
                        onParsed(data.text);
                    } else {
                        onError(data.error);
                    }
                }}
                javaScriptEnabled={true}
            />
        </View>
    );
};

export default HeadlessParser;
