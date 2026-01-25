import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { BackHandler } from 'react-native';

import ThreeDModelScreen from '../screens/ThreeDModelScreen';
import CostBreakdownScreen from '../screens/CostBreakdownScreen';
import GreenElementsScreen from '../screens/GreenElementsScreen';
import LoadingIndicator from './LoadingIndicator';
import TopTabsWrapper from './TopTabsWrapper';
import MessageModal from './MessageModal';

import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ResultsTopTabs = ({ navigation }) => {
    const route = useRoute();
    const { formData } = route.params;

    const { user } = useContext(AuthContext);

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
    const [submitLoading, setSubmitLoading] = useState(false);

    const [checkedItems, setCheckedItems] = useState({});
    const [checkedSubitems, setCheckedSubitems] = useState({});
    const [customItems, setCustomItems] = useState({});

    const [showBackModal, setShowBackModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const isNavigatingFromSubmissionRef = useRef(false);

    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74],
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    }

    // Certification cost multiplier percentages
    const certificationMultipliers = {
        'Platinum': 8.7,
        'Gold': 4.54,
        'Silver': 2.97,
        'Certified': 1.87,
        'Not Certified': 0
    };

    // Calculate certification level based on total marks
    const getCertificationLevel = useCallback((marks) => {
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (marks >= range[0] && marks <= range[1]) {
                return level;
            }
        }
        return 'Not Certified';
    }, []);

    // Apply certification multiplier to costs (pure function, no useCallback)
    const applyMultiplierToCosts = (costs, totalMarks) => {
        if (!costs) return costs;

        const certLevel = getCertificationLevel(totalMarks);
        const multiplierPercent = certificationMultipliers[certLevel] || 0;

        // Only apply if certification is "Certified" or above
        if (multiplierPercent === 0) {
            // If not certified, remove any existing multiplier
            if (mappedFormData?.costPreviewWay === 'Simplified') {
                // For Simplified, just return with no multiplier cost added
                const updatedCosts = JSON.parse(JSON.stringify(costs));
                delete updatedCosts.multiplierCost;
                delete updatedCosts.certificationLevel;
                delete updatedCosts.multiplierPercent;
                // Recalculate total without multiplier
                if (typeof updatedCosts === 'object' && updatedCosts.cost_breakdown) {
                    updatedCosts.total_cost = updatedCosts.cost_breakdown;
                } else if (typeof updatedCosts === 'number') {
                    // Already a number, keep it
                }
                return updatedCosts;
            }

            // For Detailed, remove the multiplier node from cost_breakdown
            if (!costs || !costs.cost_breakdown) return costs;

            const updatedCosts = JSON.parse(JSON.stringify(costs));
            let hasMultiplier = false;
            for (const key in updatedCosts.cost_breakdown) {
                if (updatedCosts.cost_breakdown[key].isMultiplier) {
                    delete updatedCosts.cost_breakdown[key];
                    hasMultiplier = true;
                    break;
                }
            }
            if (hasMultiplier) {
                let total = 0;
                for (const key in updatedCosts.cost_breakdown) {
                    total += updatedCosts.cost_breakdown[key].cost || 0;
                }
                updatedCosts.total_cost = total;
            }
            return updatedCosts;
        }

        // For Simplified cost preview, apply multiplier to the total cost directly
        if (mappedFormData?.costPreviewWay === 'Simplified') {
            // If multiplier properties already exist, just return as-is to avoid infinite loops
            if (costs.multiplierCost !== undefined && costs.certificationLevel === certLevel) {
                return costs;
            }
            
            const baseTotal = typeof costs === 'number' ? costs : (costs?.total_cost || costs?.cost_breakdown || 0);
            const multiplierCost = (baseTotal * multiplierPercent) / 100;
            
            const updatedCosts = {
                ...costs,
                multiplierCost: multiplierCost,
                certificationLevel: certLevel,
                multiplierPercent: multiplierPercent,
                total_cost: baseTotal + multiplierCost
            };
            return updatedCosts;
        }

        // For Detailed cost preview, add multiplier as a node in cost_breakdown
        if (!costs.cost_breakdown) return costs;

        const updatedCosts = JSON.parse(JSON.stringify(costs));
        const baseTotal = Object.values(updatedCosts.cost_breakdown).reduce((sum, node) => {
            const calcNodeCost = (node) => {
                let total = node.cost || 0;
                if (node.isMultiplier) return 0;
                return total;
            };
            return sum + calcNodeCost(node);
        }, 0);

        const multiplierCost = (baseTotal * multiplierPercent) / 100;

        // Add or update the multiplier section
        let multiplierSection = null;
        let multiplierSectionKey = null;

        // Find existing multiplier section
        for (const [key, node] of Object.entries(updatedCosts.cost_breakdown)) {
            if (node.isMultiplier) {
                multiplierSection = node;
                multiplierSectionKey = key;
                break;
            }
        }

        // If no multiplier section exists, create one at the end
        if (!multiplierSection) {
            const existingKeys = Object.keys(updatedCosts.cost_breakdown);
            const lastKey = existingKeys.length > 0 ? existingKeys[existingKeys.length - 1] : null;
            const nextKey = lastKey ? String.fromCharCode(lastKey.charCodeAt(0) + 1) : 'A';

            multiplierSectionKey = nextKey;
            multiplierSection = {
                description: `${certLevel} Certification (${multiplierPercent}%)`,
                cost: multiplierCost,
                isMultiplier: true,
                locked: true
            };
            updatedCosts.cost_breakdown[multiplierSectionKey] = multiplierSection;
        } else {
            // Update existing multiplier
            multiplierSection.description = `${certLevel} Certification (${multiplierPercent}%)`;
            multiplierSection.cost = multiplierCost;
        }

        // Recalculate total
        let total = 0;
        for (const key in updatedCosts.cost_breakdown) {
            total += updatedCosts.cost_breakdown[key].cost || 0;
        }
        updatedCosts.total_cost = total;

        return updatedCosts;
    };

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

        return { isValid: true, message: '' };
    }, [mappedFormData, criteriaTotalMarks, certifiedScaleRange]);

    // Handle submit button press
    const handleSubmit = useCallback(async () => {
        setSubmitLoading(true);

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
            setSubmitLoading(false);
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
            setSubmitLoading(false);
            return;
        }

        // All validations passed
        const checked_items = {
            checkedItems: Object.keys(checkedItems).filter(key => checkedItems[key]),
            checkedSubitems: Object.entries(checkedSubitems).reduce((acc, [parentId, subitems]) => {
                const trueSubitems = Object.keys(subitems).filter(key => subitems[key] === true);
                if (trueSubitems.length > 0) acc[parentId] = trueSubitems;
                return acc;
            }, {}),
            customItems: customItems,
        }

        const projectData = {
            user_id: user.id,
            rating: criteriaTotalMarks,
            costs: newProjectCosts,
            form_data: mappedFormData,
            checked_items: checked_items,
        };

        const response = await api.post('/submit-assessment', projectData);

        if (response.status === 201) {
            setValidationModal({
                isVisible: true,
                title: 'Submission Successful!',
                subtitle: 'Your submission has been saved successfully. Please navigate to the History tab to view your assessment details.',
                imgSource: require('../assets/components/success.png')
            });
        } else {
            setValidationModal({
                isVisible: true,
                title: 'Submission Failed',
                subtitle: 'There was an error submitting your assessment. Please try again later.',
                imgSource: require('../assets/components/error.png')
            });
        }

        setSubmitLoading(false);
    }, [validateCriteria, validateTargetCertification]);

    // Close validation modal
    const closeValidationModal = useCallback(() => {
        setValidationModal({
            isVisible: false,
            title: '',
            description: '',
            imgSource: null
        });

        // Only navigate back if submission was successful
        if (validationModal.title === 'Submission Successful!') {
            isNavigatingFromSubmissionRef.current = true;
            navigation.replace("Tabs");
        }
    }, [navigation, validationModal.title]);

    const confirmLeave = () => {
        setShowBackModal(false);
        if (pendingAction) navigation.dispatch(pendingAction);
        else navigation.goBack(); // fallback for hardware back
    };

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            if (formData) {
                try {
                    const response = await api.post('/results', formData);
                    setGreenElements(response.data.green_elements);
                    setNewProjectCosts(response.data.cost || { cost_breakdown: {}, total_cost: 0 });
                    setMappedFormData(response.data.mapped_form_data || null);
                } catch (error) {
                    console.error("API Error:", error);
                }
            }
            setLoading(false);
        };

        fetchResults();
    }, []);

    // Handle Android hardware back
    useEffect(() => {
        const onBackPress = () => {
            navigation.goBack();
            return true; // prevent default behavior
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => subscription.remove();
    }, [navigation]);

    useEffect(() => {
        // Calculate total sum of all values in criteriaMarks
        const total = Object.values(criteriaMarks).reduce((sum, value) => sum + Number(value || 0), 0);
        setCriteriaTotalMarks(total);

        // Apply certification multiplier to costs when criteria marks change
        if (newProjectCosts && setNewProjectCosts) {
            setNewProjectCosts(prevCosts => {
                const updatedCosts = applyMultiplierToCosts(prevCosts, total);
                return updatedCosts;
            });
        }
    }, [criteriaMarks]);

    // Recalculate multiplier whenever costs change (addition, deletion, or editing of cost nodes)
    // Only for Detailed view - Simplified doesn't need this as it's handled in the criteriaMarks effect
    useEffect(() => {
        if (newProjectCosts && setNewProjectCosts && mappedFormData?.costPreviewWay === 'Detailed') {
            setNewProjectCosts(prevCosts => {
                const updatedCosts = applyMultiplierToCosts(prevCosts, criteriaTotalMarks);
                return updatedCosts;
            });
        }
    }, [newProjectCosts.total_cost, mappedFormData?.costPreviewWay]);

    // Handle navigation (swipe or header back)
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Skip confirmation if navigating from successful submission
            if (isNavigatingFromSubmissionRef.current) {
                isNavigatingFromSubmissionRef.current = false;
                return;
            }

            e.preventDefault(); // stop the default back behavior
            setPendingAction(e.data.action); // store action to perform later
            setShowBackModal(true); // show custom modal
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <>
            {loading || !greenElements ? (
                <LoadingIndicator />
            ) : (
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
                        {
                            name: '3D View',
                            component: ThreeDModelScreen
                        }
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
                    checkedItems={checkedItems}
                    setCheckedItems={setCheckedItems}
                    checkedSubitems={checkedSubitems}
                    setCheckedSubitems={setCheckedSubitems}
                    customItems={customItems}
                    setCustomItems={setCustomItems}
                    onSubmit={handleSubmit}
                    submitLoading={submitLoading}
                />
            )}

            {/* Validation Modal */}
            <MessageModal
                isVisible={validationModal.isVisible}
                imgSource={validationModal.imgSource}
                title={validationModal.title}
                subtitle={validationModal.subtitle}
                onClose={closeValidationModal}
                buttonText="OK"
            />

            {/* Back Confirmation Modal */}
            <MessageModal
                isVisible={showBackModal}
                imgSource={require('../assets/components/warning.png')}
                title="Leave this page?"
                subtitle="Are you sure you want to leave? Unsaved changes may be lost."
                buttonText="Yes, Leave"
                onClose={confirmLeave}
                goBack={true}
                setModalVisible={() => setShowBackModal(false)}
            />
        </>
    );
}

export default ResultsTopTabs;