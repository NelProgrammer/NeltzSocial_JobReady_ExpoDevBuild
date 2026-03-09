import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { FAB } from 'react-native-paper';
import { ResumeContext } from '../context/ResumeContext';
import PersonalDetails from '../components/PersonalDetails';
import Experience from '../components/Experience';
import Education from '../components/Education';
import Skills from '../components/Skills';
import References from '../components/References';

const Tab = createMaterialTopTabNavigator();

const EditorScreen = ({ route, navigation }) => {
    const { resumeId } = route.params;
    const { switchResume } = useContext(ResumeContext);

    useEffect(() => {
        if (resumeId) {
            switchResume(resumeId);
        }
    }, [resumeId]);

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textTransform: 'none' },
                    tabForItem: ({ route }) => ({
                        width: 'auto'
                    }),
                    tabBarIndicatorStyle: { backgroundColor: '#6200ee' }
                }}
            >
                <Tab.Screen name="Personal" component={PersonalDetails} />
                <Tab.Screen name="Experience" component={Experience} />
                <Tab.Screen name="Education" component={Education} />
                <Tab.Screen name="Skills" component={Skills} />
                <Tab.Screen name="References" component={References} />
            </Tab.Navigator>

            <FAB
                icon="eye"
                label="Preview & Export"
                style={{
                    position: 'absolute',
                    margin: 16,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#6200ee',
                }}
                color="white"
                onPress={() => navigation.navigate('Preview', { resumeId })}
            />
        </View>
    );
};

export default EditorScreen;
