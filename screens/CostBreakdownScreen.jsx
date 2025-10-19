import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import CostNode from '../components/CostNode';
import AddCostModal from '../components/AddCostModal';

const CostBreakdownScreen = ({ route, navigation, newProjectCosts, setNewProjectCosts, mappedFormData }) => {
    const projectCosts = newProjectCosts || { cost_breakdown: {}, total_cost: 0 };
    const initializedRef = useRef(false);
    const scrollViewRef = useRef(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [highlightedItem, setHighlightedItem] = useState(null);

    // Get budget from mappedFormData (adjust the property name based on your data structure)
    const projectBudget = mappedFormData?.projectBudget || 0;
    const totalCost = projectCosts.total_cost || projectCosts || 0;

    // Calculate budget status
    const isOverBudget = projectBudget > 0 && totalCost > projectBudget;
    const isWithinBudget = projectBudget > 0 && totalCost <= projectBudget;
    const budgetDifference = Math.abs(totalCost - projectBudget);
    const budgetPercentage = projectBudget > 0 ? ((totalCost / projectBudget) * 100).toFixed(1) : 0;

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

        const updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));
        const keys = path.split('.');

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

        const updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));
        const keys = path.split('.');

        // Navigate to parent
        let current = updatedProjectCosts.cost_breakdown;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]].children;
        }

        // Delete the item
        const itemToDelete = keys[keys.length - 1];
        delete current[itemToDelete];

        // Recalculate all costs from top level
        let total = 0;
        for (const topKey in updatedProjectCosts.cost_breakdown) {
            total += recalculateCosts(updatedProjectCosts.cost_breakdown[topKey]);
        }
        updatedProjectCosts.total_cost = total;

        setNewProjectCosts(updatedProjectCosts);
    };

    const handleAddCost = () => {
        setIsAddModalVisible(true);
    };

    const handleAddCostSubmit = ({ description, cost }) => {
        if (!newProjectCosts || !setNewProjectCosts) return;

        const updatedProjectCosts = JSON.parse(JSON.stringify(projectCosts));

        // Check if "OTHERS" section exists
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
            const lastKey = existingKeys[existingKeys.length - 1];
            const nextKey = String.fromCharCode(lastKey.charCodeAt(0) + 1);

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

        // Generate new child key (OTHERS1, OTHERS2, etc.)
        const childrenKeys = Object.keys(othersSection.children);
        const newChildKey = childrenKeys.length + 1;

        // Add new cost item
        othersSection.children[newChildKey] = {
            description: description,
            cost: cost
        };

        // Recalculate costs
        let total = 0;
        for (const topKey in updatedProjectCosts.cost_breakdown) {
            total += recalculateCosts(updatedProjectCosts.cost_breakdown[topKey]);
        }
        updatedProjectCosts.total_cost = total;

        setNewProjectCosts(updatedProjectCosts);
        setIsAddModalVisible(false);

        setHighlightedItem(othersSectionKey + '.' + newChildKey);

        // Scroll to bottom or specific item
        scrollViewRef.current?.scrollToEnd({ animated: true });

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
                onClose={() => setIsAddModalVisible(false)}
                onAdd={handleAddCostSubmit}
            />

            {/* Header Section */}
            <View className="px-5 py-2 border-b border-slate-100">
                <Text className="text-slate-800 font-bold text-lg mb-1">Construction Cost</Text>
                <View className="flex-row items-center">
                    <View className={`px-2.5 py-1 rounded-lg mr-2 ${mappedFormData?.costPreviewWay === 'Detailed'
                        ? 'bg-blue-100'
                        : 'bg-emerald-100'
                        }`}>
                        <Text className={`font-bold text-[10px] uppercase tracking-wide ${mappedFormData?.costPreviewWay === 'Detailed'
                            ? 'text-blue-700'
                            : 'text-emerald-700'
                            }`}>
                            {mappedFormData?.costPreviewWay || 'Detailed'}
                        </Text>
                    </View>
                    <Text className="text-slate-500 text-xs flex-1">
                        {mappedFormData?.costPreviewWay === 'Detailed'
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
                                {(projectCosts.total_cost || projectCosts || 0).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
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
                </View>
            </View>

            {mappedFormData?.costPreviewWay === 'Detailed' && (
                <>
                    {/* Action Buttons */}
                    <View className="flex-row px-5 pb-4 gap-3">
                        <TouchableOpacity
                            onPress={handleAddCost}
                            className="flex-1 bg-blue-500 rounded-xl py-3 flex-row items-center justify-center shadow-md active:bg-blue-600"
                            activeOpacity={0.8}
                        >
                            <View className="w-5 h-5 bg-white/20 rounded-lg items-center justify-center mr-2">
                                <Ionicons name="add" size={14} color="#FFFFFF" />
                            </View>
                            <Text className="text-white font-bold text-xs">Add Cost</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsDeleteMode(!isDeleteMode)}
                            className={`flex-1 rounded-xl py-3 flex-row items-center justify-center shadow-md ${isDeleteMode
                                ? 'bg-red-500 active:bg-red-600'
                                : 'bg-slate-100 active:bg-slate-200 border-2 border-slate-200'
                                }`}
                            activeOpacity={0.8}
                        >
                            <View className={`w-5 h-5 rounded-lg items-center justify-center mr-2 ${isDeleteMode ? 'bg-white/20' : 'bg-slate-200'
                                }`}>
                                <Ionicons
                                    name={isDeleteMode ? "checkmark" : "trash-outline"}
                                    size={14}
                                    color={isDeleteMode ? "#FFFFFF" : "#475569"}
                                />
                            </View>
                            <Text className={`font-bold text-xs ${isDeleteMode ? 'text-white' : 'text-slate-700'
                                }`}>
                                {isDeleteMode ? 'Done' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Column Headers */}
                    <View className="bg-slate-100 px-5 py-3 flex-row justify-between border-t border-slate-200">
                        <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Description</Text>
                        <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Amount (RM)</Text>
                    </View>

                    {/* Cost Breakdown List */}
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
                                highlightedItem={highlightedItem}
                            />
                        ))}
                    </ScrollView>
                </>
            )}
        </View>
    );
};

export default CostBreakdownScreen;