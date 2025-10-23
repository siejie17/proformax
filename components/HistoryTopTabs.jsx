import { View, Text } from 'react-native';
import React, { use, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import ThreeDModelScreen from '../screens/ThreeDModelScreen';
import HistoryTabsWrapper from './HistoryTabsWrapper';
import api from '../services/api';
import LoadingIndicator from './LoadingIndicator';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import CostBreakdownScreen from '../screens/CostBreakdownScreen';
import GreenElementsDisplayScreen from '../screens/GreenElementsDisplayScreen';

const HistoryTopTabs = ({ navigation, route }) => {
    const { projectId, displayOnly } = route?.params || {};

    const [selectedProject, setSelectedProject] = useState(null);
    const [greenElements, setGreenElements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSelectedProject = async () => {
            if (projectId) {
                try {
                    setLoading(true);
                    const response = await api.get(`/projects/${projectId}`);
                    const apiData = response.data;

                    if (apiData.success) {
                        setSelectedProject(apiData.data);
                        setGreenElements(apiData.green_elements || []);
                    }
                } catch (error) {
                    console.error('Error fetching project:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSelectedProject();
    }, [route?.params]);

    return (
        <>
            {loading ? (
                <LoadingIndicator />
            ) : (
                <HistoryTabsWrapper
                    title="History"
                    tabs={[
                        {
                            name: 'Details',
                            component: ProjectDetailsScreen
                        },
                        {
                            name: 'Costs',
                            component: CostBreakdownScreen
                        },
                        {
                            name: 'Green Elements',
                            component: GreenElementsDisplayScreen
                        },
                        {
                            name: '3D View',
                            component: ThreeDModelScreen
                        }
                    ]}
                    navigation={navigation}
                    displayOnly={displayOnly}
                    selectedProject={selectedProject}
                    greenElements={greenElements}
                />
            )}
        </>
    )
}

export default HistoryTopTabs