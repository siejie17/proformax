import TopTabsWrapper from './TopTabsWrapper';
import CostBreakdownScreen from '../screens/CostBreakdownScreen';
import GreenElementsScreen from '../screens/GreenElementsScreen';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { ActivityIndicator } from 'react-native';

const ResultsTopTabs = () => {
    const route = useRoute();
    const { formData } = route.params;

    const [results, setResults] = useState(null);
    const [criteriaTotalMarks, setCriteriaTotalMarks] = useState(0);
    const [loading, setLoading] = useState(false);

    // Create a wrapped setCriteriaTotalMarks function for debugging
    const wrappedSetCriteriaTotalMarks = useCallback((value) => {
        setCriteriaTotalMarks(value);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            if (formData) {
                try {
                    const response = await api.post('/results', formData);
                    setResults(response.data);
                } catch (error) {
                    console.error("API Error:", error);
                }
            }
            setLoading(false);
        };

        fetchResults();
    }, [formData]);

    useEffect(() => {
        console.log("ResultsTopTabs useEffect - criteriaTotalMarks changed to:", criteriaTotalMarks);
    }, [criteriaTotalMarks, setCriteriaTotalMarks]);

    if (loading || !results) {
        return <ActivityIndicator />; // Or a loading spinner
    }

    return (
        <TopTabsWrapper
            title="Results"
            tabs={[
                {
                    name: 'Cost Breakdown',
                    component: CostBreakdownScreen,
                },
                {
                    name: 'Green Elements',
                    component: GreenElementsScreen,
                },
            ]}
            params={results}
            criteriaTotalMarks={criteriaTotalMarks}
            setCriteriaTotalMarks={wrappedSetCriteriaTotalMarks}
        />
    )
}

export default ResultsTopTabs;