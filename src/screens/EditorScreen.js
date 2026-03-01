import React, { useContext, useEffect } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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
    );
};

export default EditorScreen;
