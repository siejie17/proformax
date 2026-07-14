import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import api from '../services/api';

import CostNode from '../components/CostNode';
import AddCostModal from '../components/AddCostModal';
import UpdatedToastMessage from '../components/UpdatedToastMessage';

const CostBreakdownScreen = ({ 
    newProjectCosts, setNewProjectCosts, 
    mappedFormData, 
    selectedProject = null, setSelectedProject, 
    displayOnly = false, 
    greenElements = [], 
    criteriaTotalMarks = 0, 
    marksData, setMarksData, 
    certifiedScaleRange, certificationMultipliers = {}, 
    onDisplayOnlyUnsavedChange = () => {}, 
    onActualCostBreakdownChange = () => {}, 
    resetCostChanges = 0, 
    onCostSubmitRef = null, 
    hideSubmitButton = false 
}) => {
    const projectCosts = newProjectCosts || { cost_breakdown: {}, total_cost: 0 };

    const initializedRef = useRef(false);
    const scrollViewRef = useRef(null);
    const baselineProjectIdRef = useRef(null);
    const baselineCostBreakdownRef = useRef(null);

    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [modalParentPath, setModalParentPath] = useState(null);
    const [actualCosts, setActualCosts] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [changedNodes, setChangedNodes] = useState({});

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const getBaselineCostBreakdown = useCallback(() => {
        return baselineCostBreakdownRef.current || selectedProject?.cost_breakdown || null;
    }, [selectedProject]);

    const toNumericId = useCallback((value) => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }, []);

    const getAllCriterionItems = useCallback((criterionData) => {
        if (!criterionData) return [];

        return [
            ...(criterionData.items || []),
            ...(criterionData.subcriteria?.flatMap(subcriterion => subcriterion.items || []) || []),
        ];
    }, []);

    const getProjectCheckedItemIds = useCallback((project) => {
        if (Array.isArray(project?.checked_items)) {
            return project.checked_items.map(toNumericId).filter(value => value !== null);
        }

        if (Array.isArray(project?.checked_items?.checkedItems)) {
            return project.checked_items.checkedItems.map(toNumericId).filter(value => value !== null);
        }

        return [];
    }, [toNumericId]);

    const getProjectCheckedOptionIds = useCallback((project, groupId, prefix = '') => {
        const projectKey = prefix ? `${prefix}_checked_options` : 'checked_options';
        const currentValue = project?.[projectKey]?.[groupId] ?? [];

        if (Array.isArray(currentValue)) {
            return currentValue.map(toNumericId).filter(value => value !== null);
        }

        if (currentValue && typeof currentValue === 'object') {
            return Object.keys(currentValue)
                .filter(key => currentValue[key])
                .map(toNumericId)
                .filter(value => value !== null);
        }

        return [];
    }, [toNumericId]);

    const getProjectSelectedSelectionId = useCallback((project, groupId, prefix = '') => {
        const snakeKey = prefix ? `${prefix}_selected_items` : 'selected_items';
        const camelKey = prefix ? `${prefix}SelectedItems` : 'selectedItems';
        return toNumericId(project?.[snakeKey]?.[groupId] ?? project?.[camelKey]?.[groupId] ?? null);
    }, [toNumericId]);

    const getProjectCheckedSubitemsList = useCallback((project, itemId, prefix = '') => {
        const key = prefix ? `${prefix}_checked_subitems` : 'checked_subitems';
        const currentValue = project?.[key]?.[itemId] ?? [];
        return Array.isArray(currentValue)
            ? currentValue.map(toNumericId).filter(value => value !== null)
            : [];
    }, [toNumericId]);

    const getProjectCustomInputsList = useCallback((project, itemId, prefix = '') => {
        const key = prefix ? `${prefix}_custom_inputs` : 'custom_inputs';
        const currentValue = project?.[key]?.[itemId] ?? [];
        return Array.isArray(currentValue) ? currentValue : [];
    }, []);

    const calculateCriterionMarksFromProject = useCallback((criterionData, project, prefix = '') => {
        if (!criterionData || !project) return 0;

        let totalMarksForCriterion = 0;
        const allItems = getAllCriterionItems(criterionData);

        allItems.forEach((item) => {
            const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
            const selectionGroups = Array.isArray(item.selection_groups) ? item.selection_groups : [];
            const subitems = Array.isArray(item.subitems) ? item.subitems : [];
            const hasSubitems = item.subitems_exist && subitems.length > 0;
            const hasSelections = selectionGroups.some(group => Array.isArray(group?.selections) && group.selections.length > 0);
            const hasOptions = optionGroups.some(group => Array.isArray(group?.options) && group.options.length > 0);

            if (hasSubitems) {
                const checkedSubitemsList = getProjectCheckedSubitemsList(project, item.id, prefix);
                const customInputsList = getProjectCustomInputsList(project, item.id, prefix);
                const totalCount = checkedSubitemsList.length + customInputsList.length;
                totalMarksForCriterion += Math.min(totalCount, item.marks || 6);
                return;
            }

            if (hasSelections && !hasOptions) {
                totalMarksForCriterion += selectionGroups.reduce((sum, group) => {
                    const selectedSelectionId = getProjectSelectedSelectionId(project, group.id, prefix);
                    const selectedSelection = (group.selections || []).find(selection => selection.id === selectedSelectionId);
                    return sum + (selectedSelection?.marks || 0);
                }, 0);
                return;
            }

            if (hasOptions && !hasSelections) {
                totalMarksForCriterion += optionGroups.reduce((sum, group) => {
                    const selectedOptionIds = getProjectCheckedOptionIds(project, group.id, prefix);
                    return sum + (group.options || []).reduce((groupSum, option) => (
                        groupSum + (selectedOptionIds.includes(option.id) ? (option.marks || 0) : 0)
                    ), 0);
                }, 0);
                return;
            }

            if (hasSelections && hasOptions) {
                const selectionMarks = selectionGroups.reduce((sum, group) => {
                    const selectedSelectionId = getProjectSelectedSelectionId(project, group.id, prefix);
                    const selectedSelection = (group.selections || []).find(selection => selection.id === selectedSelectionId);
                    return sum + (selectedSelection?.marks || 0);
                }, 0);

                const optionMarks = optionGroups.reduce((sum, group) => {
                    const selectedOptionIds = getProjectCheckedOptionIds(project, group.id, prefix);
                    return sum + (group.options || []).reduce((groupSum, option) => (
                        groupSum + (selectedOptionIds.includes(option.id) ? (option.marks || 0) : 0)
                    ), 0);
                }, 0);

                totalMarksForCriterion += selectionMarks + optionMarks;
                return;
            }

            if (getProjectCheckedItemIds(project).includes(item.id)) {
                totalMarksForCriterion += item.marks || 0;
            }
        });

        return totalMarksForCriterion;
    }, [getAllCriterionItems, getProjectCheckedItemIds, getProjectCheckedOptionIds, getProjectCheckedSubitemsList, getProjectCustomInputsList, getProjectSelectedSelectionId]);

    const overallScoreSummary = useMemo(() => {
        const total = greenElements.reduce((sum, criterion) => sum + (criterion?.total_marks || 0), 0);

        if (!displayOnly || !selectedProject || !Array.isArray(greenElements) || greenElements.length === 0) {
            return {
                predicted: criteriaTotalMarks || 0,
                actual: criteriaTotalMarks || 0,
                total,
                predictedPct: total > 0 ? Math.min(Math.round(((criteriaTotalMarks || 0) / total) * 100), 100) : 0,
                actualPct: total > 0 ? Math.min(Math.round(((criteriaTotalMarks || 0) / total) * 100), 100) : 0,
            };
        }

        const predicted = greenElements.reduce((sum, criterion) => sum + (calculateCriterionMarksFromProject(criterion, selectedProject) || 0), 0);
        const actual = greenElements.reduce((sum, criterion) => sum + (calculateCriterionMarksFromProject(criterion, selectedProject, 'actual') || 0), 0);

        return {
            predicted,
            actual,
            total,
            predictedPct: total > 0 ? Math.min(Math.round((predicted / total) * 100), 100) : 0,
            actualPct: total > 0 ? Math.min(Math.round((actual / total) * 100), 100) : 0,
        };
    }, [calculateCriterionMarksFromProject, criteriaTotalMarks, displayOnly, greenElements, selectedProject]);

    // Helper function to get node description from nested path
    const getNodeDescriptionFromPath = (path) => {
        if (!path || path === 'OTHERS_NEW') return 'OTHERS';

        const keys = path.split('.');
        let current = projectCosts.cost_breakdown;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!current || !current[key]) return null;

            current = current[key];

            // If not the last key, navigate to children
            if (i < keys.length - 1) {
                current = current.children;
            }
        }

        return current?.description || null;
    };

    // Get budget from mappedFormData (adjust the property name based on your data structure)
    const rawBudget = mappedFormData?.projectBudget ?? selectedProject?.budget;
    const hasBudget = rawBudget !== null && rawBudget !== undefined && rawBudget !== '';
    const projectBudget = hasBudget ? (parseFloat(rawBudget) || 0) : 0;
    const totalCost = displayOnly ? (selectedProject?.adjusted_cost || 0) : (projectCosts?.total_cost || 0);
    const actualTotalCost = displayOnly && actualCosts
        ? Object.values(actualCosts).reduce((sum, node) => sum + (Number(node?.actual_cost) || 0), 0)
        : 0;
    const isActualOverPredicted = actualTotalCost > totalCost;

    // Calculate budget status
    const isOverBudget = hasBudget && projectBudget > 0 && totalCost > projectBudget;

    const isCertificationNode = useCallback((node) => {
        const description = typeof node?.description === 'string'
            ? node.description.trim().toLowerCase()
            : '';

        return !!node && (node.isMultiplier || node.is_certification || description === 'certification');
    }, []);

    const syncMultiplierNodesIntoActualCosts = useCallback((currentActualCosts, projectCostBreakdown) => {
        if (!projectCostBreakdown || typeof projectCostBreakdown !== 'object') {
            return currentActualCosts;
        }

        const nextActualCosts = currentActualCosts
            ? JSON.parse(JSON.stringify(currentActualCosts))
            : JSON.parse(JSON.stringify(projectCostBreakdown));

        const projectMultiplierEntries = Object.entries(projectCostBreakdown).filter(([, node]) => isCertificationNode(node));
        const projectMultiplierKeys = new Set(projectMultiplierEntries.map(([key]) => key));

        let changed = false;

        Object.keys(nextActualCosts || {}).forEach((key) => {
            if (isCertificationNode(nextActualCosts[key]) && !projectMultiplierKeys.has(key)) {
                delete nextActualCosts[key];
                changed = true;
            }
        });

        projectMultiplierEntries.forEach(([key, node]) => {
            const existingNode = nextActualCosts[key];
            const nextActualCost = Number(node?.actual_cost) || 0;

            if (!existingNode) {
                nextActualCosts[key] = JSON.parse(JSON.stringify(node));
                changed = true;
                return;
            }

            if ((Number(existingNode.actual_cost) || 0) !== nextActualCost) {
                existingNode.actual_cost = nextActualCost;
                existingNode.isMultiplier = node.isMultiplier;
                existingNode.is_certification = node.is_certification;
                existingNode.certification_level = node.certification_level;
                existingNode.multiplier_percent = node.multiplier_percent;
                existingNode.locked = node.locked;
                changed = true;
            }
        });

        if (!changed) {
            return currentActualCosts;
        }

        recalculateActualCosts(nextActualCosts);
        return nextActualCosts;
    }, [isCertificationNode]);

    const recalculateCosts = (node) => {
        if (!node || !node.children) return node?.cost ?? 0;

        let total = 0;
        for (const childKey in node.children) {
            total += recalculateCosts(node.children[childKey]);
        }

        node.cost = total;
        return total;
    };

    const handleCostChange = (path, newCost, inputValue) => {
        if (!newProjectCosts || !setNewProjectCosts) return;

        // Prevent changes to multiplier cost
        const keys = path.split('.');
        if (keys.length === 1) {
            const node = projectCosts.cost_breakdown[keys[0]];
            if (node && node.isMultiplier && node.locked) {
                return; // Do not allow changes
            }
        }

        const updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));
        let current = updatedProjectCosts.cost_breakdown;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]].children;
        }

        const targetNode = current[keys[keys.length - 1]];
        targetNode.cost = newCost;

        // Store the raw input value to preserve decimal points during editing
        if (inputValue !== undefined) {
            targetNode.inputValue = inputValue;
        } else {
            delete targetNode.inputValue;
        }

        // Only recalc if newCost is a valid number
        const numericCost = parseFloat(newCost);
        if (!isNaN(numericCost)) {
            let total = 0;
            for (const topKey in updatedProjectCosts.cost_breakdown) {
                total += recalculateCosts(updatedProjectCosts.cost_breakdown[topKey]);
            }
            updatedProjectCosts.total_cost = total;
        }

        setNewProjectCosts(updatedProjectCosts);
    };

    const handleActualCostChange = (path, newActualCost, inputValue) => {
        if (!displayOnly || !selectedProject) return;

        const keys = path.split('.');

        // Create a deep copy of the actual costs from selectedProject.cost_breakdown
        let updatedActualCosts = actualCosts ? JSON.parse(JSON.stringify(actualCosts)) : JSON.parse(JSON.stringify(selectedProject.cost_breakdown));

        // Navigate to the target node
        let current = updatedActualCosts;
        for (let i = 0; i < keys.length; i++) {
            if (i < keys.length - 1) {
                current = current[keys[i]].children;
            } else {
                current = current[keys[i]];
            }
        }

        // Update the actual cost
        current.actual_cost = parseFloat(newActualCost) || 0;

        // Store input value for display
        if (inputValue !== undefined) {
            current.inputValue = inputValue;
        } else {
            delete current.inputValue;
        }

        // Recalculate parent actual costs
        recalculateActualCosts(updatedActualCosts);

        // Check if there are changes against the original loaded baseline
        const changeResult = hasActualChanges(updatedActualCosts, getBaselineCostBreakdown());
        setHasChanges(changeResult.hasChanges);
        setChangedNodes(changeResult.changedNodes);
        setActualCosts(updatedActualCosts);
        onActualCostBreakdownChange(updatedActualCosts);
    };

    const recalculateActualCosts = (costBreakdown) => {
        const traverse = (node) => {
            if (node.children && Object.keys(node.children).length > 0) {
                let total = 0;
                for (const childKey in node.children) {
                    total += traverse(node.children[childKey]);
                }
                node.actual_cost = total;
                return total;
            } else {
                // Leaf node - return its actual_cost or original cost
                return node.actual_cost !== undefined ? node.actual_cost : (node.cost || 0);
            }
        };

        for (const key in costBreakdown) {
            traverse(costBreakdown[key]);
        }
    };

    const hasActualChanges = (actual, original) => {
        const changes = {};

        const getOriginalComparableValue = (originalNode) => {
            if (!originalNode) return 0;
            if (originalNode.actual_cost !== undefined && originalNode.actual_cost !== null) {
                return Number(originalNode.actual_cost) || 0;
            }
            return Number(originalNode.cost) || 0;
        };

        const checkChanges = (actualNode, originalNode) => {
            if (!actualNode) return;

            const hasChildren = actualNode.children && Object.keys(actualNode.children).length > 0;

            // Only track editable leaf nodes in the payload.
            if (!hasChildren) {
                const nodeKey = actualNode.id ?? originalNode?.id;
                const currentValue = Number(actualNode.actual_cost ?? actualNode.cost) || 0;
                const originalValue = getOriginalComparableValue(originalNode);

                if (nodeKey !== undefined) {
                    if (currentValue !== originalValue) {
                        changes[nodeKey] = currentValue;
                    } else {
                        delete changes[nodeKey];
                    }
                }
            }

            if (hasChildren) {
                for (const key in actualNode.children) {
                    checkChanges(actualNode.children[key], originalNode?.children?.[key]);
                }
            }
        };

        if (actual && original) {
            for (const key in actual) {
                checkChanges(actual[key], original[key]);
            }
        }

        return { hasChanges: Object.keys(changes).length > 0, changedNodes: changes };
    };

    const handleSubmit = async () => {
        if (!hasChanges || !actualCosts) return true;

        const submittedCostBreakdown = JSON.parse(JSON.stringify(actualCosts));

        if (setSelectedProject) {
            setSelectedProject((prevProject) => {
                if (!prevProject) return prevProject;

                return {
                    ...prevProject,
                    cost_breakdown: submittedCostBreakdown,
                };
            });
        }

        setActualCosts(submittedCostBreakdown);
        setChangedNodes({});
        setHasChanges(false);

        const response = await api.post(`/projects/update-actual-cost`, {
            changedNodes: changedNodes
        });

        if (response.data.success) {
            baselineCostBreakdownRef.current = JSON.parse(JSON.stringify(submittedCostBreakdown));
            // Handle success case
            setToastMessage(response.data.message);
            setToastVisible(true);
            setTimeout(() => setToastVisible(false), 3000);
            return true;
        } else {
            // Handle error case
            setToastMessage(response.data.message);
            setToastVisible(true);
            setTimeout(() => setToastVisible(false), 3000);
            return false;
        }
    };

    // Register submit handler with parent component
    useEffect(() => {
        if (onCostSubmitRef) {
            onCostSubmitRef.current = handleSubmit;
        }
    }, [handleSubmit, onCostSubmitRef]);

    const handleDelete = (path) => {
        if (!newProjectCosts || !setNewProjectCosts) return;

        const keys = path.split('.');

        // Prevent deletion of multiplier cost
        if (keys.length === 1) {
            const node = projectCosts.cost_breakdown[keys[0]];
            if (node && node.isMultiplier && node.locked) {
                return; // Do not allow deletion
            }
        }

        // Determine if this is a top-level deletion or child deletion
        const isTopLevelDelete = keys.length === 1;

        const updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));

        if (isTopLevelDelete) {
            // Delete top-level node
            const topLevelKey = keys[0];
            delete updatedProjectCosts.cost_breakdown[topLevelKey];

            // Rename all top-level keys from A...Z
            const topLevelEntries = Object.entries(updatedProjectCosts.cost_breakdown);
            const renamedBreakdown = {};
            topLevelEntries.forEach((entry, index) => {
                const newKey = String.fromCharCode(65 + index); // A, B, C, ...
                renamedBreakdown[newKey] = entry[1];
            });
            updatedProjectCosts.cost_breakdown = renamedBreakdown;
        } else {
            // Delete child node
            let current = updatedProjectCosts.cost_breakdown;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]].children;
            }

            const itemToDelete = keys[keys.length - 1];
            delete current[itemToDelete];

            // Rename children from 1...n
            const childEntries = Object.entries(current);
            childEntries.forEach((entry, index) => {
                const newKey = String(index + 1); // 1, 2, 3, ...
                if (newKey !== entry[0]) {
                    current[newKey] = entry[1];
                    if (newKey !== entry[0]) {
                        delete current[entry[0]];
                    }
                }
            });

            // Check if parent node has no children left and delete parent if needed
            if (Object.keys(current).length === 0 && keys.length > 1) {
                // Navigate to parent and delete it
                let parentCurrent = updatedProjectCosts.cost_breakdown;
                for (let i = 0; i < keys.length - 2; i++) {
                    parentCurrent = parentCurrent[keys[i]].children;
                }
                const parentKey = keys[keys.length - 2];
                delete parentCurrent[parentKey];

                // Rename parent's siblings if they were deleted from top level
                if (keys.length === 2) {
                    const topLevelEntries = Object.entries(updatedProjectCosts.cost_breakdown);
                    const renamedBreakdown = {};
                    topLevelEntries.forEach((entry, index) => {
                        const newKey = String.fromCharCode(65 + index); // A, B, C, ...
                        renamedBreakdown[newKey] = entry[1];
                    });
                    updatedProjectCosts.cost_breakdown = renamedBreakdown;
                } else {
                    // Rename siblings at the parent's level
                    const siblingEntries = Object.entries(parentCurrent);
                    siblingEntries.forEach((entry, index) => {
                        const newKey = String(index + 1); // 1, 2, 3, ...
                        if (newKey !== entry[0]) {
                            parentCurrent[newKey] = entry[1];
                            if (newKey !== entry[0]) {
                                delete parentCurrent[entry[0]];
                            }
                        }
                    });
                }
            }
        }

        // Recalculate all costs from top level
        let total = 0;
        for (const topKey in updatedProjectCosts.cost_breakdown) {
            total += recalculateCosts(updatedProjectCosts.cost_breakdown[topKey]);
        }
        updatedProjectCosts.total_cost = total;

        setNewProjectCosts(updatedProjectCosts);
    };

    const handleAddCost = (parentPath = null) => {
        setModalParentPath(parentPath);
        setIsAddModalVisible(true);
    };

    const handleAddCostSubmit = ({ description, cost, sectionName }) => {
        if (!setNewProjectCosts) return;

        // Initialize newProjectCosts if it's empty
        let updatedProjectCosts;
        if (!newProjectCosts || Object.keys(newProjectCosts).length === 0) {
            updatedProjectCosts = {
                total_cost: 0,
                cost_breakdown: {}
            };
        } else {
            updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));
        }

        let highlightPath = null;

        // If adding to a parent node (nested addition)
        if (modalParentPath && modalParentPath !== 'OTHERS_NEW') {
            // Check if this is a regular parent path or an OTHERS section
            const keys = modalParentPath.split('.');

            // Check if modalParentPath is a top-level key (single key)
            if (keys.length === 1 && updatedProjectCosts.cost_breakdown[modalParentPath]) {
                // This is a direct parent (e.g., 'A', 'B', or an existing OTHERS section)
                const parentNode = updatedProjectCosts.cost_breakdown[modalParentPath];

                // Initialize children if not exists
                if (!parentNode.children) {
                    parentNode.children = {};

                    // If parent has a direct cost and we're creating the first child,
                    // move the parent's cost to the first child
                    if (parentNode.cost && parentNode.cost > 0) {
                        parentNode.children['1'] = {
                            description: parentNode.description + ' (Direct)',
                            cost: parentNode.cost
                        };
                        parentNode.cost = 0;
                    }
                }

                // Find next numeric key
                const existingChildKeys = Object.keys(parentNode.children);
                const nextChildKey = existingChildKeys.length > 0
                    ? Math.max(...existingChildKeys.map(k => parseInt(k) || 0)) + 1
                    : 1;

                // Add new child
                parentNode.children[nextChildKey] = {
                    description: description,
                    cost: cost
                };

                highlightPath = modalParentPath + '.' + nextChildKey;
            } else {
                // Navigate through nested path
                let current = updatedProjectCosts.cost_breakdown;

                for (let i = 0; i < keys.length; i++) {
                    current = current[keys[i]];
                    if (i < keys.length - 1 && current.children) {
                        current = current.children;
                    }
                }

                // Initialize children if not exists
                if (!current.children) {
                    current.children = {};

                    // If current node has a direct cost and we're creating the first child,
                    // move the node's cost to the first child
                    if (current.cost && current.cost > 0) {
                        current.children['1'] = {
                            description: current.description + ' (Direct)',
                            cost: current.cost
                        };
                        current.cost = 0;
                    }
                }

                // Find next numeric key
                const existingChildKeys = Object.keys(current.children);
                const nextChildKey = existingChildKeys.length > 0
                    ? Math.max(...existingChildKeys.map(k => parseInt(k) || 0)) + 1
                    : 1;

                // Add new child
                current.children[nextChildKey] = {
                    description: description,
                    cost: cost
                };

                highlightPath = modalParentPath + '.' + nextChildKey;
            }
        } else if (sectionName) {
            // Creating a new section with custom name (when cost breakdown is empty)
            const existingKeys = Object.keys(updatedProjectCosts.cost_breakdown);
            const nextKey = existingKeys.length > 0
                ? String.fromCharCode(Math.max(...existingKeys.map(k => k.charCodeAt(0))) + 1)
                : 'A';

            updatedProjectCosts.cost_breakdown[nextKey] = {
                description: sectionName,
                cost: 0,
                children: {
                    1: {
                        description: description,
                        cost: cost
                    }
                }
            };

            highlightPath = nextKey + '.1';
        } else {
            // Adding to OTHERS (from "Add New Section" button)
            let othersSection = null;
            let othersSectionKey = null;

            // Find if OTHERS already exists
            for (const [key, node] of Object.entries(updatedProjectCosts.cost_breakdown)) {
                if (node.description && node.description.toUpperCase().includes('OTHERS')) {
                    othersSection = node;
                    othersSectionKey = key;
                    break;
                }
            }

            // If OTHERS doesn't exist, create it
            if (!othersSection) {
                // Find the next available letter key
                const existingKeys = Object.keys(updatedProjectCosts.cost_breakdown);
                const lastKey = existingKeys.length > 0 ? existingKeys[existingKeys.length - 1] : null;
                const nextKey = lastKey ? String.fromCharCode(lastKey.charCodeAt(0) + 1) : 'A';

                othersSectionKey = nextKey;
                othersSection = {
                    description: 'OTHERS',
                    cost: 0,
                    children: {}
                };
                updatedProjectCosts.cost_breakdown[othersSectionKey] = othersSection;
            }

            // Ensure children object exists
            if (!othersSection.children) {
                othersSection.children = {};
            }

            // Generate new child key (1, 2, 3, etc.)
            const childrenKeys = Object.keys(othersSection.children);
            const newChildKey = childrenKeys.length > 0
                ? Math.max(...childrenKeys.map(k => parseInt(k) || 0)) + 1
                : 1;

            // Add new cost item
            othersSection.children[newChildKey] = {
                description: description,
                cost: cost
            };

            highlightPath = othersSectionKey + '.' + newChildKey;

            // Scroll to bottom or specific item
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }

        // Recalculate costs
        let total = 0;
        for (const topKey in updatedProjectCosts.cost_breakdown) {
            total += recalculateCosts(updatedProjectCosts.cost_breakdown[topKey]);
        }
        updatedProjectCosts.total_cost = total;

        setNewProjectCosts(updatedProjectCosts);
        setIsAddModalVisible(false);
        setModalParentPath(null);

        setHighlightedItem(highlightPath);

        // remove highlight after a while
        setTimeout(() => setHighlightedItem(null), 2000);
    };

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, (event) => {
            setKeyboardHeight(event.endCoordinates?.height || 0);
        });

        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        // Initialize newProjectCosts only when NOT in displayOnly mode
        if (!displayOnly && !initializedRef.current && newProjectCosts && setNewProjectCosts) {
            if (newProjectCosts.cost_breakdown && Object.keys(newProjectCosts.cost_breakdown).length > 0) {
                const initialCosts = JSON.parse(JSON.stringify(newProjectCosts));
                let total = 0;
                if (initialCosts.cost_breakdown) {
                    for (const key in initialCosts.cost_breakdown) {
                        total += recalculateCosts(initialCosts.cost_breakdown[key]);
                    }
                }
                initialCosts.total_cost = total;
                setNewProjectCosts(initialCosts);
                initializedRef.current = true;
            }
        }

        // Initialize and keep multiplier nodes in sync when displayOnly = true
        if (displayOnly && selectedProject?.cost_breakdown) {
            if (baselineProjectIdRef.current !== selectedProject.id) {
                baselineProjectIdRef.current = selectedProject.id;
                baselineCostBreakdownRef.current = JSON.parse(JSON.stringify(selectedProject.cost_breakdown));
            }

            if (!actualCosts) {
                const initialActualCosts = JSON.parse(JSON.stringify(selectedProject.cost_breakdown));
                recalculateActualCosts(initialActualCosts);
                const changeResult = hasActualChanges(initialActualCosts, getBaselineCostBreakdown());
                setHasChanges(changeResult.hasChanges);
                setChangedNodes(changeResult.changedNodes);
                setActualCosts(initialActualCosts);
                onActualCostBreakdownChange(initialActualCosts);
            } else {
                const syncedActualCosts = syncMultiplierNodesIntoActualCosts(actualCosts, selectedProject.cost_breakdown);
                if (syncedActualCosts !== actualCosts) {
                    const changeResult = hasActualChanges(syncedActualCosts, getBaselineCostBreakdown());
                    setHasChanges(changeResult.hasChanges);
                    setChangedNodes(changeResult.changedNodes);
                    setActualCosts(syncedActualCosts);
                    onActualCostBreakdownChange(syncedActualCosts);
                }
            }
        }
    }, [actualCosts, displayOnly, getBaselineCostBreakdown, hasActualChanges, onActualCostBreakdownChange, selectedProject, syncMultiplierNodesIntoActualCosts]);

    useEffect(() => {
        if (!displayOnly) return;

        onDisplayOnlyUnsavedChange(hasChanges);
    }, [displayOnly, hasChanges, onDisplayOnlyUnsavedChange]);

    useEffect(() => {
        return () => {
            onDisplayOnlyUnsavedChange(false);
        };
    }, [onDisplayOnlyUnsavedChange]);

    useEffect(() => {
        if (displayOnly && resetCostChanges > 0) {
            // Reset actual costs to original state
            const baselineCostBreakdown = getBaselineCostBreakdown();
            if (baselineCostBreakdown) {
                const resetActualCosts = JSON.parse(JSON.stringify(baselineCostBreakdown));
                
                // Recalculate costs for reset state
                const traverse = (node) => {
                    if (node.children && Object.keys(node.children).length > 0) {
                        let total = 0;
                        for (const childKey in node.children) {
                            total += traverse(node.children[childKey]);
                        }
                        node.actual_cost = total;
                        return total;
                    } else {
                        return node.actual_cost !== undefined ? node.actual_cost : (node.cost || 0);
                    }
                };

                for (const key in resetActualCosts) {
                    traverse(resetActualCosts[key]);
                }
                
                setActualCosts(resetActualCosts);
                if (setSelectedProject) {
                    setSelectedProject((prevProject) => {
                        if (!prevProject) return prevProject;

                        return {
                            ...prevProject,
                            cost_breakdown: JSON.parse(JSON.stringify(baselineCostBreakdown)),
                        };
                    });
                }
                onActualCostBreakdownChange(resetActualCosts);
                setHasChanges(false);
                setChangedNodes({});
            }
        }
    }, [resetCostChanges, displayOnly, getBaselineCostBreakdown, onActualCostBreakdownChange, setSelectedProject]);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-100"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 8}
        >
            {/* Add Cost Modal */}
            <AddCostModal
                visible={isAddModalVisible}
                onClose={() => {
                    setIsAddModalVisible(false);
                    setModalParentPath(null);
                }}
                onAdd={handleAddCostSubmit}
                parentPath={modalParentPath}
                parentDescription={getNodeDescriptionFromPath(modalParentPath)}
            />

            {/* Header Section */}
            <View className="px-6 py-2 border-b border-slate-100">
                <Text allowFontScaling={false} className="text-slate-800 font-bold text-lg mb-1">Construction Cost Breakdown</Text>
            </View>

            {/* Total Cost */}
            <View className="px-5">
                <View className="bg-slate-800 rounded-2xl p-4 shadow-lg">
                    <View className="flex-row items-center justify-between">
                        <View className={`${displayOnly ? 'ml-1' : ''}`}>
                            {!displayOnly ? (
                                <View className="ml-1">
                                    <View className="self-start bg-white/10 rounded-full px-2.5 py-1 mb-2">
                                        <Text allowFontScaling={false} className="text-slate-200 font-bold text-[9px] uppercase tracking-wider">
                                            Estimated
                                        </Text>
                                    </View>
                                    <Text allowFontScaling={false} className="text-white font-bold text-base">
                                        Total Cost
                                    </Text>
                                    <Text allowFontScaling={false} className="text-slate-400 text-[11px] mt-1">
                                        Live total from your editable breakdown
                                    </Text>
                                </View>
                            ) : (
                                <Text allowFontScaling={false} className="text-white font-bold text-sm">
                                    Summary
                                </Text>
                            )}
                        </View>
                        {!displayOnly && (
                            <View className="bg-blue-500 rounded-2xl px-4 py-3 min-w-[120px] shadow-sm border border-blue-400/40">
                                <Text allowFontScaling={false} className="text-white font-bold text-[10px] mb-0.5">
                                    RM
                                </Text>
                                <Text allowFontScaling={false} className="text-white font-bold text-xl tracking-tight">
                                    {(
                                        mappedFormData?.costPreviewWay === 'Detailed'
                                            ? projectCosts?.total_cost ?? 0
                                            : projectCosts?.total_cost ?? projectCosts ?? 0
                                    ).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>

                    {displayOnly && (
                        <View className="mt-3 flex-row gap-2">
                            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
                                <Text allowFontScaling={false} className="text-slate-300 font-medium text-[9px] uppercase tracking-wider mb-1">
                                    Predicted Cost
                                </Text>
                                <Text allowFontScaling={false} className="text-white font-bold text-base">
                                    RM {(parseFloat(selectedProject?.adjusted_cost) || 0).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                            </View>
                            <View className={`flex-1 rounded-2xl bg-emerald-500/20 px-4 py-3 border ${isActualOverPredicted ? 'bg-red-500/20 border-red-400/30' : 'border-emerald-400/30 '}`}>
                                <Text allowFontScaling={false} className={`${isActualOverPredicted ? 'text-red-200' : 'text-emerald-200'} font-medium text-[9px] uppercase tracking-wider mb-1`}>
                                    Actual Cost
                                </Text>
                                <Text allowFontScaling={false} className="text-white font-bold text-base">
                                    RM {actualTotalCost.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Budget Indicator */}
                    <View className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 mr-3">
                                <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${!hasBudget
                                    ? 'bg-slate-500/30'
                                    : isOverBudget
                                        ? 'bg-red-500/90'
                                        : 'bg-emerald-500/90'
                                    }`}>
                                    <Ionicons
                                        name={!hasBudget ? "wallet-outline" : isOverBudget ? "trending-up" : "shield-checkmark"}
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text allowFontScaling={false} className="text-slate-300 font-medium text-[9px] uppercase tracking-wider mb-1">
                                        Budget Indicator
                                    </Text>
                                    <Text allowFontScaling={false} className={`font-bold text-sm ${!hasBudget
                                        ? 'text-white'
                                        : isOverBudget
                                            ? 'text-red-300'
                                            : 'text-emerald-300'
                                        }`}>
                                        {!hasBudget ? 'Budget Not Available' : isOverBudget ? 'Over Budget' : 'Within Budget'}
                                    </Text>
                                </View>
                            </View>

                            <View className="items-end">
                                <Text allowFontScaling={false} className="text-slate-400 text-[9px] uppercase tracking-wider mb-1">Budget</Text>
                                <Text allowFontScaling={false} className="text-white font-bold text-sm">
                                    {hasBudget
                                        ? `RM ${projectBudget.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}`
                                        : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {(mappedFormData?.costPreviewWay === 'Detailed' || selectedProject?.cost_preview_way === 'Detailed') && (
                <>
                    {/* Check if cost breakdown is empty */}
                    {(!displayOnly && (!projectCosts.cost_breakdown || Object.keys(projectCosts.cost_breakdown).length === 0)) ||
                        (displayOnly && (!selectedProject?.cost_breakdown || Object.keys(selectedProject?.cost_breakdown || {}).length === 0)) ? (
                        <View className="flex-1 items-center justify-center">
                            <View className="items-center gap-3">
                                <View className="w-20 h-20 bg-slate-200 rounded-full items-center justify-center">
                                    <Ionicons name="document-outline" size={40} color="#94a3b8" />
                                </View>
                                <Text allowFontScaling={false} className="text-slate-600 font-bold text-base">Unavailable data at the moment</Text>
                                <Text allowFontScaling={false} className="text-slate-400 text-sm text-center px-4">
                                    {displayOnly ? 'No cost breakdown data available' : 'Start by adding your first cost item'}
                                </Text>
                                {!displayOnly && (
                                    <TouchableOpacity
                                        onPress={() => handleAddCost(null)}
                                        className="mt-2 bg-blue-500 rounded-xl px-6 py-3 flex-row items-center justify-center shadow-md active:bg-blue-600"
                                        activeOpacity={0.8}
                                    >
                                        <View className="w-5 h-5 bg-white/20 rounded-lg items-center justify-center mr-2">
                                            <Ionicons name="add" size={14} color="#FFFFFF" />
                                        </View>
                                        <Text allowFontScaling={false} className="text-white font-bold text-xs">Add Cost</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <>
                            {displayOnly ? null : (
                                <View className="flex-row px-5 py-4 gap-3">
                                    <TouchableOpacity
                                        onPress={() => setIsAddMode(!isAddMode)}
                                        className={`flex-1 rounded-xl py-3 flex-row items-center justify-center shadow-sm ${isAddMode
                                            ? 'bg-blue-600 active:bg-blue-700'
                                            : 'bg-white active:bg-blue-50 border-2 border-blue-200'
                                            }`}
                                        activeOpacity={0.8}
                                    >
                                        <View className={`w-5 h-5 rounded-lg items-center justify-center mr-2 ${isAddMode ? 'bg-white/20' : 'bg-blue-100'
                                            }`}>
                                            <Ionicons
                                                name={isAddMode ? "checkmark" : "add"}
                                                size={14}
                                                color={isAddMode ? "#FFFFFF" : "#2563EB"}
                                            />
                                        </View>
                                        <Text allowFontScaling={false} className={`font-bold text-xs ${isAddMode ? 'text-white' : 'text-blue-600'
                                            }`}>
                                            {isAddMode ? 'Done' : 'Add'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setIsDeleteMode(!isDeleteMode)}
                                        className={`flex-1 rounded-xl py-3 flex-row items-center justify-center shadow-sm ${isDeleteMode
                                            ? 'bg-red-600 active:bg-red-700'
                                            : 'bg-white active:bg-red-50 border-2 border-red-200'
                                            }`}
                                        activeOpacity={0.8}
                                    >
                                        <View className={`w-5 h-5 rounded-lg items-center justify-center mr-2 ${isDeleteMode ? 'bg-white/20' : 'bg-red-100'
                                            }`}>
                                            <Ionicons
                                                name={isDeleteMode ? "checkmark" : "trash-outline"}
                                                size={14}
                                                color={isDeleteMode ? "#FFFFFF" : "#DC2626"}
                                            />
                                        </View>
                                        <Text allowFontScaling={false} className={`font-bold text-xs ${isDeleteMode ? 'text-white' : 'text-red-600'
                                            }`}>
                                            {isDeleteMode ? 'Done' : 'Delete'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View className="bg-slate-100 px-5 py-3 flex-row border-t border-slate-200">
                                <Text allowFontScaling={false} className="flex-[2.5] text-slate-600 mx-2 font-bold text-[10px] uppercase tracking-wider">
                                    Description
                                </Text>

                                {displayOnly ? (
                                    <>
                                        <Text allowFontScaling={false} className="flex-[1] text-center text-slate-600 font-bold text-[8px] uppercase tracking-wider">
                                            Predicted{'\n'}(RM)
                                        </Text>
                                        <Text allowFontScaling={false} className="flex-[1] text-center text-slate-600 font-bold text-[8px] uppercase tracking-wider">
                                            Actual{'\n'}(RM)
                                        </Text>
                                        <Text allowFontScaling={false} className="w-[52px] ml-1 text-center text-slate-600 font-bold text-[8px] uppercase tracking-wider">
                                            Work{'\n'}Done (%)
                                        </Text>
                                    </>
                                ) : (
                                    <Text allowFontScaling={false} className="flex-1 text-right text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                                        Amount (RM)
                                    </Text>
                                )}
                            </View>

                            {/* Cost Breakdown List */}
                            {!displayOnly ? (
                                <ScrollView
                                    className="flex-1"
                                    ref={scrollViewRef}
                                    contentContainerClassName="p-4 py-2"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {projectCosts.cost_breakdown && Object.entries(projectCosts.cost_breakdown).map(([code, node]) => (
                                        <CostNode
                                            key={code}
                                            code={code}
                                            path={''}
                                            node={node}
                                            onCostChange={handleCostChange}
                                            onDelete={handleDelete}
                                            isDeleteMode={isDeleteMode}
                                            isAddMode={isAddMode}
                                            onAddCost={handleAddCost}
                                            highlightedItem={highlightedItem}
                                            displayOnly={displayOnly}
                                            predictedMarks={criteriaTotalMarks}
                                            certifiedScaleRange={certifiedScaleRange}
                                            certificationMultipliers={certificationMultipliers}
                                        />
                                    ))}

                                    {/* Add New Parent Section Button - Opens modal to add to OTHERS - Only show if OTHERS doesn't exist */}
                                    {!Object.values(projectCosts.cost_breakdown || {}).some(node => node.description && node.description.toUpperCase().includes('OTHERS')) && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                // Find or mark OTHERS section
                                                let othersKey = null;
                                                if (projectCosts.cost_breakdown) {
                                                    for (const [key, node] of Object.entries(projectCosts.cost_breakdown)) {
                                                        if (node.description && node.description.toUpperCase().includes('OTHERS')) {
                                                            othersKey = key;
                                                            break;
                                                        }
                                                    }
                                                }

                                                // Set parent path to OTHERS (use special marker if OTHERS doesn't exist yet)
                                                setModalParentPath(othersKey || 'OTHERS_NEW');
                                                setIsAddModalVisible(true);
                                            }}
                                            className="mt-3 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl py-4 flex-row items-center justify-center active:bg-slate-200"
                                            activeOpacity={0.7}
                                        >
                                            <View className="w-6 h-6 rounded-lg bg-slate-300 items-center justify-center mr-2">
                                                <Ionicons name="add" size={16} color="#64748b" />
                                            </View>
                                            <Text allowFontScaling={false} className="text-slate-600 font-bold text-xs">Add "OTHERS" Section</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            ) : (
                                <ScrollView
                                    className="flex-1"
                                    ref={scrollViewRef}
                                    contentContainerClassName="px-4 py-2"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {actualCosts && Object.entries(actualCosts).map(([code, node]) => (
                                        <CostNode
                                            key={code}
                                            code={code}
                                            path={''}
                                            node={node}
                                            originalNode={selectedProject.cost_breakdown?.[code]}
                                            onActualCostChange={handleActualCostChange}
                                            displayOnly={displayOnly}
                                            predictedMarks={overallScoreSummary.predicted}
                                            marksData={marksData}
                                            setMarksData={setMarksData}
                                            certifiedScaleRange={certifiedScaleRange}
                                            certificationMultipliers={certificationMultipliers}
                                        />
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Submit Button for displayOnly mode - only show if not hidden by parent */}
            {displayOnly && !hideSubmitButton && (
                <View
                    className="px-5 py-4 bg-white border-t border-slate-200"
                    style={{
                        paddingBottom: keyboardHeight > 0 ? keyboardHeight + 12 : 16,
                    }}
                >
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!hasChanges}
                        className={`rounded-2xl p-4 flex-row items-center justify-center shadow-md ${hasChanges ? 'bg-blue-600 active:bg-blue-700' : 'bg-slate-300'}`}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        <Text allowFontScaling={false} className="text-white font-bold text-sm ml-2">
                            {hasChanges ? 'Submit Changes' : 'No Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {displayOnly && toastVisible && (
                <UpdatedToastMessage visible={toastVisible} toastMessage={toastMessage} />
            )}
        </KeyboardAvoidingView>
    );
};

export default CostBreakdownScreen;
