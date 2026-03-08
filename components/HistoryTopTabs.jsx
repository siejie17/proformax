import { useEffect, useState } from 'react';

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
    const [objectsConfig, setObjectsConfig] = useState([]);
    const [user3DVisibility, setUser3DVisibility] = useState({});
    const [visibleObjects, setVisibleObjects] = useState({});
    const [loading, setLoading] = useState(true);

    const evaluateVisibility = (objCfg, checkedItems, checkedSubitems) => {
        const newVisibility = {};
        const newUser3DVisibility = { ...user3DVisibility };
        
        objCfg.forEach(obj => {
            const visible = obj.triggers.some(trigger => {
                if (trigger.trigger_type === 'ITEM') {
                    return checkedItems.includes(trigger.trigger_id);
                }
                if (trigger.trigger_type === 'SUBITEM') {
                    return checkedSubitems.includes(trigger.trigger_id);
                }
                return false;
            });

            newVisibility[obj.obj_name] = visible;
            newUser3DVisibility[obj.name] = visible;
        });

        setVisibleObjects(newVisibility);
        setUser3DVisibility(newUser3DVisibility);
    }

    useEffect(() => {
        const fetchSelectedProject = async () => {
            if (projectId) {
                try {
                    setLoading(true);
                    const response = await api.get(`/v2/projects/${projectId}`);
                    const apiData = response.data;

                    if (apiData.success) {
                        setSelectedProject(apiData.data);
                        setGreenElements(apiData.green_elements || []);

                        const objectsCfg = apiData.three_d_objects;
                        setObjectsConfig(objectsCfg);
                        
                        evaluateVisibility(
                            objectsCfg, 
                            apiData.data?.checked_items, 
                            Object.values(apiData.data?.checked_subitems)
                        );
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
                        // {
                        //     name: '3D View',
                        //     component: ThreeDModelScreen
                        // }
                    ]}
                    navigation={navigation}
                    displayOnly={displayOnly}
                    selectedProject={selectedProject}
                    greenElements={greenElements}
                    user3DVisibility={user3DVisibility}
                    objectsConfig={objectsConfig}
                    visibleObjects={visibleObjects}
                    setVisibleObjects={setVisibleObjects}
                />
            )}
        </>
    )
}

export default HistoryTopTabs