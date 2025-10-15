import TopTabsWrapper from './TopTabsWrapper';
import CostBreakdownScreen from '../screens/CostBreakdownScreen';
import GreenElementsScreen from '../screens/GreenElementsScreen';
import MessageModal from './MessageModal';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { ActivityIndicator } from 'react-native';

const ResultsTopTabs = () => {
    const route = useRoute();
    const { formData } = route.params;

    const [greenElements, setGreenElements] = useState([]);
    const [newProjectCosts, setNewProjectCosts] = useState({ cost_breakdown: {}, total_cost: 0 });
    const [mappedFormData, setMappedFormData] = useState(null);
    const [criteriaMarks, setCriteriaMarks] = useState({});
    const [criteriaTotalMarks, setCriteriaTotalMarks] = useState(0);
    const [loading, setLoading] = useState(false);
    const [validationModal, setValidationModal] = useState({
        isVisible: false,
        title: '',
        subtitle: '',
        imgSource: null
    });

    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74],
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    }

    // Create a wrapped setCriteriaTotalMarks function for debugging
    const wrappedSetCriteriaTotalMarks = useCallback((value) => {
        setCriteriaTotalMarks(value);
    }, []);

    // Validation function to check if all criteria meet minimum marks
    const validateCriteria = useCallback(() => {
        if (!greenElements) {
            return { isValid: false, failedCriteria: [] };
        }

        const failedCriteria = [];

        greenElements.forEach(criterion => {
            const earnedMarks = criteriaMarks[criterion.name] || 0;
            const minMarks = criterion.min_marks || 0;
            
            if (earnedMarks < minMarks) {
                failedCriteria.push({
                    name: criterion.name,
                    earnedMarks,
                    minMarks,
                    needed: minMarks - earnedMarks
                });
            }
        });

        return {
            isValid: failedCriteria.length === 0,
            failedCriteria
        };
    }, [greenElements, criteriaMarks]);

    // Validate target certification rating scale
    const validateTargetCertification = useCallback(() => {
        if (!mappedFormData || !mappedFormData.certifiedRatingScale) {
            return { isValid: true, message: '' }; // If no target set, allow submission
        }

        const targetRating = mappedFormData.certifiedRatingScale;
        const targetRange = certifiedScaleRange[targetRating];
        
        if (!targetRange) {
            return { isValid: true, message: '' }; // Invalid target rating, allow submission
        }

        const isWithinTarget = criteriaTotalMarks >= targetRange[0] && criteriaTotalMarks <= targetRange[1];
        
        if (!isWithinTarget) {
            const pointsNeeded = Math.max(0, targetRange[0] - criteriaTotalMarks);
            return {
                isValid: false,
                message: `Target: ${targetRating} (${targetRange[0]}-${targetRange[1]} pts)\nCurrent Score: ${criteriaTotalMarks} pts\n${pointsNeeded > 0 ? `Need ${pointsNeeded} more points to reach target.` : 'Score exceeds target range.'}`
            };
        }

        return { isValid: true, message: '' };
    }, [mappedFormData, criteriaTotalMarks, certifiedScaleRange]);

    // Handle submit button press
    const handleSubmit = useCallback(() => {
        const criteriaValidation = validateCriteria();
        const targetValidation = validateTargetCertification();
        
        // Check criteria validation first
        if (!criteriaValidation.isValid) {
            const criteriaNamesAndMarks = criteriaValidation.failedCriteria
                .map(criteria => `• ${criteria.name}: Need ${criteria.needed} more point${criteria.needed > 1 ? 's' : ''}`)
                .join('\n');
            
            setValidationModal({
                isVisible: true,
                title: 'Minimum Marks Not Achieved',
                subtitle: `The following criteria need more points to meet minimum requirements:\n\n${criteriaNamesAndMarks}`,
                imgSource: require('../assets/components/error.png')
            });
            return;
        }

        // Check target certification validation
        if (!targetValidation.isValid) {
            setValidationModal({
                isVisible: true,
                title: 'Target Certification Not Met',
                subtitle: targetValidation.message,
                imgSource: require('../assets/components/error.png')
            });
            return;
        }

        // All validations passed
        setValidationModal({
            isVisible: true,
            title: 'Validation Successful!',
            description: 'All criteria and target certification requirements have been met. Your green building assessment is complete.',
            imgSource: require('../assets/components/success.png')
        });
    }, [validateCriteria, validateTargetCertification]);

    // Close validation modal
    const closeValidationModal = useCallback(() => {
        setValidationModal({
            isVisible: false,
            title: '',
            description: '',
            imgSource: null
        });
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            if (formData) {
                try {
                    const response = await api.post('/results', formData);
                    setGreenElements(response.data.green_elements);
                    setNewProjectCosts(response.data.cost);
                    setMappedFormData(response.data.mapped_form_data || null);
                } catch (error) {
                    console.error("API Error:", error);
                }
            }
            setLoading(false);
        };

        fetchResults();
    }, [formData]);

    useEffect(() => {
        // Calculate total sum of all values in criteriaMarks
        const total = Object.values(criteriaMarks).reduce((sum, value) => sum + Number(value || 0), 0);
        setCriteriaTotalMarks(total);
    }, [criteriaMarks]); // Runs every time criteriaMarks changes

    if (loading || !greenElements) {
        return <ActivityIndicator />; // Or a loading spinner
    }

    return (
        <>
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
                greenElements={greenElements}
                setGreenElements={setGreenElements}
                newProjectCosts={newProjectCosts}
                setNewProjectCosts={setNewProjectCosts}
                criteriaTotalMarks={criteriaTotalMarks}
                setCriteriaTotalMarks={wrappedSetCriteriaTotalMarks}
                criteriaMarks={criteriaMarks}
                setCriteriaMarks={setCriteriaMarks}
                mappedFormData={mappedFormData}
                onSubmit={handleSubmit}
            />
            
            {/* Validation Modal */}
            <MessageModal
                isVisible={validationModal.isVisible}
                imgSource={validationModal.imgSource}
                title={validationModal.title}
                subtitle={validationModal.subtitle}
                onClose={closeValidationModal}
                buttonText="OK"
            />
        </>
    )
}

export default ResultsTopTabs;