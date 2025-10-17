import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRef, useEffect, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import CostNode from "../components/CostNode";

const CostBreakdownScreen = ({ route, navigation, newProjectCosts, setNewProjectCosts }) => {
    const projectCosts = newProjectCosts || { cost_breakdown: {}, total_cost: 0 };
    const initializedRef = useRef(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

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
            // Clear inputValue when we're setting from calculation (not user input)
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

    // Function to renumber hierarchical codes after deletion
    const renumberHierarchicalCodes = (obj, prefix = '') => {
        const entries = Object.entries(obj);
        const renumberedObj = {};

        entries.forEach(([key, node], index) => {
            // Extract the alphabetic/numeric part and description
            const match = key.match(/^([A-Z]+|H)(\d*)(.*)$/);
            if (match) {
                const [, letter, , rest] = match;
                // Create new key with sequential numbering
                const newKey = letter === 'H' ? `H${index + 1}${rest}` : `${letter}${index + 1}${rest}`;

                renumberedObj[newKey] = { ...node };

                // Recursively renumber children if they exist
                if (node.children && Object.keys(node.children).length > 0) {
                    renumberedObj[newKey].children = renumberHierarchicalCodes(node.children, newKey);
                }
            } else {
                // If key doesn't match expected pattern, keep original
                renumberedObj[key] = { ...node };
                if (node.children && Object.keys(node.children).length > 0) {
                    renumberedObj[key].children = renumberHierarchicalCodes(node.children, key);
                }
            }
        });

        return renumberedObj;
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

        // Renumber the items after deletion
        if (keys.length === 1) {
            // Deleting from top level
            updatedProjectCosts.cost_breakdown = renumberHierarchicalCodes(updatedProjectCosts.cost_breakdown);
        } else {
            // Deleting from nested level - find the parent and renumber its children
            let parent = updatedProjectCosts.cost_breakdown;
            for (let i = 0; i < keys.length - 2; i++) {
                parent = parent[keys[i]].children;
            }
            const parentKey = keys[keys.length - 2];
            if (parent[parentKey] && parent[parentKey].children) {
                parent[parentKey].children = renumberHierarchicalCodes(parent[parentKey].children);
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

    const handleAddCost = () => {
        console.log('Add Cost button pressed');
        console.log('Current project costs:', projectCosts);
        // TODO: Implement add cost functionality
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
            {/* Total Container */}
            <View className="bg-gray-50 rounded-2xl p-4 mx-4 my-2 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 font-semibold text-xs uppercase">Total Project Cost :</Text>
                    <View className="flex-row items-baseline">
                        <Text className="text-slate-500 font-medium text-[10px] mr-1.5">RM</Text>
                        <Text className="text-slate-800 font-bold text-xl">
                            {(projectCosts.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row px-4 py-3 gap-3">
                {/* Add Cost Button */}
                <TouchableOpacity
                    onPress={handleAddCost}
                    className="flex-1 bg-blue-500 rounded-xl py-3 flex-row items-center justify-center shadow-sm active:bg-blue-600"
                    activeOpacity={0.8}
                >
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm ml-2">Add Cost</Text>
                </TouchableOpacity>

                {/* Delete Mode Toggle Button */}
                <TouchableOpacity
                    onPress={() => setIsDeleteMode(!isDeleteMode)}
                    className={`flex-1 rounded-xl py-3 flex-row items-center justify-center shadow-sm ${isDeleteMode
                        ? 'bg-red-500 active:bg-red-600'
                        : 'bg-slate-200 active:bg-slate-300'
                        }`}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isDeleteMode ? "checkmark-circle-outline" : "trash-outline"}
                        size={18}
                        color={isDeleteMode ? "#FFFFFF" : "#475569"}
                    />
                    <Text className={`font-bold text-sm ml-2 ${isDeleteMode ? 'text-white' : 'text-slate-700'
                        }`}>
                        {isDeleteMode ? 'Done' : 'Delete Cost'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerClassName="p-4"
                showsVerticalScrollIndicator={false}
            >
                {/* Cost Breakdown Lists */}
                {projectCosts.cost_breakdown && Object.entries(projectCosts.cost_breakdown).map(([code, node]) => (
                    <CostNode
                        key={code}
                        code={code}
                        node={node}
                        onCostChange={handleCostChange}
                        onDelete={handleDelete}
                        isDeleteMode={isDeleteMode}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

export default CostBreakdownScreen;