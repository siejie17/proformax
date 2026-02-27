import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import CostNode from '../components/CostNode';
import AddCostModal from '../components/AddCostModal';

const CostBreakdownScreen = ({ newProjectCosts, setNewProjectCosts, mappedFormData, selectedProject = null, displayOnly = false }) => {
    const projectCosts = newProjectCosts || { cost_breakdown: {}, total_cost: 0 };
    const initializedRef = useRef(false);
    const scrollViewRef = useRef(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [highlightedItem, setHighlightedItem] = useState(null);
    const [modalParentPath, setModalParentPath] = useState(null);

    // Get budget from mappedFormData (adjust the property name based on your data structure)
    const projectBudget = mappedFormData?.projectBudget || parseFloat(selectedProject?.budget) || 0;
    const totalCost = displayOnly ? (selectedProject?.adjusted_cost || 0) : (projectCosts?.total_cost || 0);

    // Calculate budget status
    const isOverBudget = projectBudget > 0 && totalCost > projectBudget;
    const budgetDifference = Math.abs(totalCost - projectBudget);
    const budgetPercentage = projectBudget > 0 ? ((totalCost / projectBudget) * 100).toFixed(1) : 0;

    // Reverse-engineer multiplier cost for Simplified view (display only)
    const getSimplifiedMultiplierInfo = () => {
        if (!displayOnly || selectedProject?.cost_preview_way !== 'Simplified' || !selectedProject?.adjusted_cost) {
            return null;
        }

        const adjustedCost = parseFloat(selectedProject.adjusted_cost);
        const certificationMultipliers = [
            { level: 'Certified', multiplier: 1.87 },
            { level: 'Silver', multiplier: 2.97 },
            { level: 'Gold', multiplier: 4.54 },
            { level: 'Platinum', multiplier: 8.7 }
        ];

        // Try to reverse-engineer: baseCost = adjustedCost / (1 + multiplier/100)
        // Check in order from smallest to largest multiplier for better accuracy
        for (const { level, multiplier } of certificationMultipliers) {
            const baseCost = adjustedCost / (1 + multiplier / 100);
            const calculatedAdjusted = baseCost * (1 + multiplier / 100);
            
            // Check if this matches (with small tolerance for rounding)
            if (Math.abs(calculatedAdjusted - adjustedCost) < 1) {
                const multiplierCost = adjustedCost - baseCost;
                return {
                    certificationLevel: level,
                    multiplierPercent: multiplier,
                    baseCost: baseCost,
                    multiplierCost: multiplierCost
                };
            }
        }

        return null;
    };

    const simplifiedMultiplierInfo = getSimplifiedMultiplierInfo();

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
        if (!newProjectCosts || !setNewProjectCosts || initializedRef.current) return;

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
    }, []);

    return (
        <View className="flex-1 bg-gray-100">
            {/* Add Cost Modal */}
            <AddCostModal
                visible={isAddModalVisible}
                onClose={() => {
                    setIsAddModalVisible(false);
                    setModalParentPath(null);
                }}
                onAdd={handleAddCostSubmit}
                parentPath={modalParentPath}
                parentDescription={
                    modalParentPath && modalParentPath !== 'OTHERS_NEW'
                        ? projectCosts.cost_breakdown?.[modalParentPath]?.description
                        : 'OTHERS'
                }
            />

            {/* Header Section */}
            <View className="px-5 py-2 border-b border-slate-100">
                <Text className="text-slate-800 font-bold text-lg mb-1">Construction Cost</Text>
                <View className="flex-row items-center">
                    <View className={`px-2.5 py-1 rounded-lg mr-2 ${mappedFormData?.costPreviewWay === 'Detailed' || selectedProject?.cost_preview_way === 'Detailed'
                        ? 'bg-blue-100'
                        : 'bg-emerald-100'
                        }`}>
                        <Text className={`font-bold text-[10px] uppercase tracking-wide ${mappedFormData?.costPreviewWay === 'Detailed' || selectedProject?.cost_preview_way === 'Detailed'
                            ? 'text-blue-700'
                            : 'text-emerald-700'
                            }`}>
                            {mappedFormData?.costPreviewWay || selectedProject?.cost_preview_way || 'Detailed'}
                        </Text>
                    </View>
                    <Text className="text-slate-500 text-xs flex-1">
                        {mappedFormData?.costPreviewWay === 'Detailed' || selectedProject?.cost_preview_way === 'Detailed'
                            ? 'Thorough cost breakdown based on real project data'
                            : 'Fast, general overview from BCISM Costbook'}
                    </Text>
                </View>
            </View>

            {/* Total Cost */}
            <View className="px-5 pt-2 pb-3">
                <View className="bg-slate-800 rounded-2xl p-4 shadow-lg">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-slate-300 font-medium text-[9px] uppercase tracking-wider mb-1">Project Total</Text>
                            <Text className="text-white font-bold text-sm">Cost Summary</Text>
                        </View>
                        <View className="bg-blue-500 rounded-xl px-4 py-2.5 shadow-sm">
                            <Text className="text-blue-100 font-bold text-[9px] text-center mb-0.5">RM</Text>
                            <Text className="text-white font-bold text-xl tracking-tight">
                                {displayOnly && selectedProject?.adjusted_cost ? (
                                    (parseFloat(selectedProject?.adjusted_cost) || 0).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                ) : (
                                    ((mappedFormData?.costPreviewWay === 'Detailed' ? projectCosts.total_cost : projectCosts.total_cost || projectCosts) || 0).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                )
                                }
                            </Text>
                        </View>
                    </View>

                    {/* Budget Indicator */}
                    {projectBudget > 0 && (
                        <View className={`rounded-2xl p-2.5 px-4 mt-3 flex-row items-center justify-between ${isOverBudget ? 'bg-red-500/20' : 'bg-emerald-500/20'
                            }`}>
                            <View className="flex-row items-center flex-1">
                                <View className={`w-6 h-6 rounded-lg items-center justify-center mr-2 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}>
                                    <Ionicons
                                        name={isOverBudget ? "alert" : "checkmark"}
                                        size={14}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={`font-bold text-[10px] ${isOverBudget ? 'text-red-300' : 'text-emerald-300'
                                        }`}>
                                        {isOverBudget ? 'Over Budget' : 'Within Budget'}
                                    </Text>
                                    <Text className="text-slate-300 text-[9px]">
                                        Budget: RM {projectBudget.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className={`font-bold text-xs ${isOverBudget ? 'text-red-300' : 'text-emerald-300'
                                    }`}>
                                    {isOverBudget ? '+' : '-'}RM {budgetDifference.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                                <Text className="text-slate-400 text-[9px]">
                                    {budgetPercentage}%
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Certification Multiplier for Simplified */}
                    {mappedFormData?.costPreviewWay === 'Simplified' && projectCosts.multiplierCost && projectCosts.multiplierCost > 0 && (
                        <View className="rounded-2xl p-2.5 px-4 mt-3 flex-row items-center justify-between bg-amber-500/20">
                            <View className="flex-row items-center flex-1">
                                <View className="w-6 h-6 rounded-lg items-center justify-center mr-2 bg-amber-500">
                                    <Ionicons name="star" size={14} color="#FFFFFF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-[10px] text-amber-300">
                                        {projectCosts.certificationLevel} Certification
                                    </Text>
                                    <Text className="text-slate-300 text-[9px]">
                                        +{projectCosts.multiplierPercent}% multiplier applied
                                    </Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-xs text-amber-300">
                                    +RM {projectCosts.multiplierCost.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Certification Multiplier for Simplified (Display Only - Reverse Engineered) */}
                    {selectedProject?.cost_preview_way === 'Simplified' && simplifiedMultiplierInfo && simplifiedMultiplierInfo.multiplierCost > 0 && (
                        <View className="rounded-2xl p-2.5 px-4 mt-3 flex-row items-center justify-between bg-amber-500/20">
                            <View className="flex-row items-center flex-1">
                                <View className="w-6 h-6 rounded-lg items-center justify-center mr-2 bg-amber-500">
                                    <Ionicons name="star" size={14} color="#FFFFFF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-[10px] text-amber-300">
                                        {simplifiedMultiplierInfo.certificationLevel} Certification
                                    </Text>
                                    <Text className="text-slate-300 text-[9px]">
                                        +{simplifiedMultiplierInfo.multiplierPercent}% multiplier applied
                                    </Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-xs text-amber-300">
                                    +RM {simplifiedMultiplierInfo.multiplierCost.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}
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
                                <Text className="text-slate-600 font-bold text-base">Unavailable data at the moment</Text>
                                <Text className="text-slate-400 text-sm text-center px-4">
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
                                        <Text className="text-white font-bold text-xs">Add Cost</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <>
                            {displayOnly ? null : (
                                <View className="flex-row px-5 pb-4 gap-3">
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
                                        <Text className={`font-bold text-xs ${isAddMode ? 'text-white' : 'text-blue-600'
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
                                        <Text className={`font-bold text-xs ${isDeleteMode ? 'text-white' : 'text-red-600'
                                            }`}>
                                            {isDeleteMode ? 'Done' : 'Delete'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Column Headers */}
                            <View className="bg-slate-100 px-7 py-3 flex-row justify-between border-t border-slate-200">
                                <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Description</Text>
                                <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Amount (RM)</Text>
                            </View>

                            {/* Cost Breakdown List */}
                            {!displayOnly ? (
                                <ScrollView
                                    className="flex-1"
                                    ref={scrollViewRef}
                                    contentContainerClassName="p-4"
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
                                            <Text className="text-slate-600 font-bold text-xs">Add "OTHERS" Section</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            ) : (
                                <ScrollView
                                    className="flex-1"
                                    ref={scrollViewRef}
                                    contentContainerClassName="p-4"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {selectedProject.cost_breakdown && Object.entries(selectedProject.cost_breakdown).map(([code, node]) => (
                                        <CostNode
                                            key={code}
                                            code={code}
                                            path={''}
                                            node={node}
                                            displayOnly={displayOnly}
                                        />
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
};

export default CostBreakdownScreen;