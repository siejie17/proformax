import { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../services/api';

import HistoryTabsWrapper from './HistoryTabsWrapper';
import LoadingIndicator from './LoadingIndicator';
import UpdatedToastMessage from './UpdatedToastMessage';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import CostBreakdownScreen from '../screens/CostBreakdownScreen';
import GreenElementsDisplayScreen from '../screens/GreenElementsDisplayScreen';

const HistoryTopTabs = ({ navigation, route }) => {
    const { projectId, displayOnly } = route?.params || {};

    const [selectedProject, setSelectedProject] = useState(null);
    const [greenElements, setGreenElements] = useState([]);
    const [certifiedScaleRange, setCertifiedScaleRange] = useState({});
    const [certificationMultipliers, setCertificationMultipliers] = useState({});
    const [loading, setLoading] = useState(true);
    const [marksData, setMarksData] = useState({
        predicted: null,
        actual: null,
        total: null,
        predictedPct: null,
        actualPct: null,
    });
    const [hasUnsavedCostChanges, setHasUnsavedCostChanges] = useState(false);
    const [hasUnsavedAuditChanges, setHasUnsavedAuditChanges] = useState(false);
    const [resetCostChanges, setResetCostChanges] = useState(0);
    const [actualCostBreakdown, setActualCostBreakdown] = useState(null);
    const [showCostUpdatedToast, setShowCostUpdatedToast] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshingProject, setIsRefreshingProject] = useState(false);
    const [showSubmitToast, setShowSubmitToast] = useState(false);

    // Refs for submit handlers from child screens
    const costSubmitRef = useRef(null);
    const auditSubmitRef = useRef(null);

    const refreshSelectedProject = useCallback(async ({ showLoader = false } = {}) => {
        if (!projectId) return false;

        try {
            if (showLoader) {
                setLoading(true);
            }

            const response = await api.get(`/projects/${projectId}`);
            const apiData = response.data;

            if (apiData.success) {
                setSelectedProject(apiData.projectData);
                setGreenElements(apiData.green_elements || []);
                setCertifiedScaleRange(apiData.certifications?.certifiedScaleRange || {});
                setCertificationMultipliers(apiData.certifications?.certificationMultipliers || {});
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error fetching project:', error);
            return false;
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, [projectId]);

    const handleCombinedSubmit = useCallback(async () => {
        try {
            setIsSubmitting(true);

            const submitResults = await Promise.all([
                costSubmitRef.current?.() || Promise.resolve(),
                auditSubmitRef.current?.() || Promise.resolve(),
            ]);

            if (submitResults.some(result => result === false)) {
                throw new Error('One or more submit actions failed.');
            }

            setIsRefreshingProject(true);
            const refreshSuccess = await refreshSelectedProject();
            if (!refreshSuccess) {
                throw new Error('Failed to refresh project after submit.');
            }

            // Reset unsaved changes flags
            setHasUnsavedCostChanges(false);
            setHasUnsavedAuditChanges(false);

            // Show success toast
            setShowSubmitToast(true);
            setTimeout(() => setShowSubmitToast(false), 3000);
        } catch (error) {
            console.error('Error during combined submit:', error);
            setShowSubmitToast(false);
        } finally {
            setIsRefreshingProject(false);
            setIsSubmitting(false);
        }
    }, [refreshSelectedProject]);

    const hasUnsavedChanges = hasUnsavedCostChanges || hasUnsavedAuditChanges;

    useEffect(() => {
        refreshSelectedProject({ showLoader: true });
    }, [refreshSelectedProject, route?.params]);

    const calculateActualBaseTotal = useCallback((costBreakdown) => {
        if (!costBreakdown || typeof costBreakdown !== 'object') return 0;

        const getNodeActualTotal = (node) => {
            if (!node) return 0;

            const description = typeof node.description === 'string'
                ? node.description.trim().toLowerCase()
                : '';

            const isCertificationNode = node.isMultiplier || node.is_certification || description === 'certification';
            if (isCertificationNode) return 0;

            if (node.actual_cost !== undefined) {
                return Number(node.actual_cost) || 0;
            }

            if (node.children && typeof node.children === 'object') {
                return Object.values(node.children).reduce((childSum, childNode) => {
                    return childSum + getNodeActualTotal(childNode);
                }, 0);
            }

            return 0;
        };

        return Object.values(costBreakdown).reduce((sum, node) => {
            return sum + getNodeActualTotal(node);
        }, 0);
    }, []);

    const isCertificationNode = useCallback((node) => {
        const description = typeof node?.description === 'string'
            ? node.description.trim().toLowerCase()
            : '';

        return !!node && (node.isMultiplier || node.is_certification || description === 'certification');
    }, []);

    const getPreferredCertificationEntry = useCallback((costBreakdown) => {
        const entries = Object.entries(costBreakdown || {}).filter(([, node]) => isCertificationNode(node));
        if (entries.length === 0) return null;

        return entries.find(([, node]) => !node?.isMultiplier) || entries[0];
    }, [isCertificationNode]);

    const handleApplyMultiplier = (multiplierData, options = {}) => {
        if (!selectedProject?.cost_breakdown) return;

        const { suppressToast = false } = options;
        const shouldShowToast = !suppressToast && (hasUnsavedCostChanges || hasUnsavedAuditChanges);
        const { certLevel, multiplierPercent, multiplierCost, baseTotal } = multiplierData;

        // Only apply if there's a multiplier
        if (multiplierPercent === 0) {
            // Remove multiplier if actual certification is "Not Certified"
            setSelectedProject(prev => {
                if (!prev) return prev;
                const existingMultiplierEntry = getPreferredCertificationEntry(prev.cost_breakdown);
                const existingMultiplierKey = existingMultiplierEntry?.[0] ?? null;
                if (!existingMultiplierKey) {
                    return prev;
                }

                const updated = JSON.parse(JSON.stringify(prev));
                let hasMultiplier = false;
                if (existingMultiplierKey && updated.cost_breakdown[existingMultiplierKey]) {
                    updated.cost_breakdown[existingMultiplierKey].actual_cost = 0;
                    updated.cost_breakdown[existingMultiplierKey].isMultiplier = false;
                    updated.cost_breakdown[existingMultiplierKey].is_certification = true;
                    delete updated.cost_breakdown[existingMultiplierKey].certification_level;
                    delete updated.cost_breakdown[existingMultiplierKey].multiplier_percent;
                    delete updated.cost_breakdown[existingMultiplierKey].locked;
                    hasMultiplier = true;
                }

                for (const [key, node] of Object.entries(updated.cost_breakdown || {})) {
                    if (key !== existingMultiplierKey && node?.isMultiplier) {
                        delete updated.cost_breakdown[key];
                    }
                }
                return updated;
            });

            return;
        }

        setSelectedProject(prev => {
            if (!prev) return prev;
            const existingMultiplier = getPreferredCertificationEntry(prev.cost_breakdown)?.[1] ?? null;
            const multiplierAlreadyApplied = existingMultiplier
                && existingMultiplier.certification_level === certLevel
                && Math.abs((existingMultiplier.multiplier_percent || 0) - multiplierPercent) <= 0.0001
                && Math.abs((existingMultiplier.actual_cost || 0) - multiplierCost) <= 0.01;

            if (multiplierAlreadyApplied) {
                return prev;
            }

            const updated = JSON.parse(JSON.stringify(prev));
            const multiplierEntry = getPreferredCertificationEntry(updated.cost_breakdown);
            let multiplierSection = multiplierEntry?.[1] ?? null;
            let multiplierSectionKey = multiplierEntry?.[0] ?? null;

            // If multiplier cost changed, update it
            const shouldUpdateMultiplier = !multiplierSection ||
                Math.abs((multiplierSection.actual_cost || 0) - multiplierCost) > 0.01;

            if (shouldUpdateMultiplier) {
                if (!multiplierSection) {
                    // Create new multiplier section
                    const existingKeys = Object.keys(updated.cost_breakdown);
                    const lastKey = existingKeys.length > 0 ? existingKeys[existingKeys.length - 1] : null;
                    const nextKey = lastKey ? String.fromCharCode(lastKey.charCodeAt(0) + 1) : 'A';

                    updated.cost_breakdown[nextKey] = {
                        description: 'Certification',
                        cost: multiplierCost,
                        actual_cost: multiplierCost,
                        isMultiplier: true,
                        is_certification: true,
                        certification_level: certLevel,
                        multiplier_percent: multiplierPercent,
                        locked: true
                    };
                } else {
                    // Update existing certification node
                    multiplierSection.actual_cost = multiplierCost;
                    multiplierSection.isMultiplier = true;
                    multiplierSection.is_certification = true;
                    multiplierSection.certification_level = certLevel;
                    multiplierSection.multiplier_percent = multiplierPercent;
                    multiplierSection.locked = true;
                }

                if (multiplierSectionKey) {
                    for (const [key, node] of Object.entries(updated.cost_breakdown || {})) {
                        if (key !== multiplierSectionKey && node?.isMultiplier) {
                            delete updated.cost_breakdown[key];
                        }
                    }
                }
            }

            if (shouldShowToast) {
                setShowCostUpdatedToast(true);
                setTimeout(() => setShowCostUpdatedToast(false), 3000);
            }

            return updated;
        });
    };

    return (
        <>
            {loading ? (
                <LoadingIndicator />
            ) : (
                <>
                    <HistoryTabsWrapper
                        title={selectedProject.name}
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
                                name: 'GBI Assessment',
                                component: GreenElementsDisplayScreen
                            },
                        ]}
                        navigation={navigation}
                        displayOnly={displayOnly}
                        selectedProject={selectedProject}
                        setSelectedProject={setSelectedProject}
                        greenElements={greenElements}
                        certifiedScaleRange={certifiedScaleRange}
                        certificationMultipliers={certificationMultipliers}
                        marksData={marksData}
                        setMarksData={setMarksData}
                        actualCostBreakdown={actualCostBreakdown}
                        onActualCostBreakdownChange={setActualCostBreakdown}
                        hasUnsavedCostChanges={hasUnsavedCostChanges}
                        onDisplayOnlyUnsavedChange={setHasUnsavedCostChanges}
                        hasUnsavedAuditChanges={hasUnsavedAuditChanges}
                        onAuditUnsavedChange={setHasUnsavedAuditChanges}
                        hasUnsavedChanges={hasUnsavedChanges}
                        resetCostChanges={resetCostChanges}
                        triggerResetCostChanges={() => setResetCostChanges(prev => prev + 1)}
                        onApplyMultiplier={handleApplyMultiplier}
                        showCostUpdatedToast={showCostUpdatedToast}
                        isSubmitting={isSubmitting}
                        isRefreshingProject={isRefreshingProject}
                        costSubmitRef={costSubmitRef}
                        auditSubmitRef={auditSubmitRef}
                        onCombinedSubmit={handleCombinedSubmit}
                    />
                    
                    {/* Grey overlay and loading indicator during submission */}
                    {isSubmitting && (
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <View
                                style={{
                                    paddingHorizontal: 24,
                                    paddingVertical: 20,
                                    borderRadius: 16,
                                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                    alignItems: 'center',
                                }}
                            >
                                <ActivityIndicator size="large" color="#FFFFFF" />
                                <Text allowFontScaling={false} style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '600' }}>
                                    Saving changes...
                                </Text>
                            </View>
                        </View>
                    )}
                    
                    {/* Toast message on submission complete */}
                    {showSubmitToast && (
                        <UpdatedToastMessage visible={showSubmitToast} toastMessage="Updates saved successfully!" />
                    )}
                </>
            )}
        </>
    )
}

export default HistoryTopTabs
