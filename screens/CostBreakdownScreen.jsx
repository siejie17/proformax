import { View, Text, ScrollView } from "react-native";
import { useRef, useEffect } from "react";
import CostNode from "../components/CostNode";

const CostBreakdownScreen = ({ route, navigation, newProjectCosts, setNewProjectCosts }) => {
    const projectCosts = newProjectCosts || { cost_breakdown: {}, total_cost: 0 };
    const initializedRef = useRef(false);

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
            <View className="bg-gray-50 rounded-2xl p-4 m-4 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 font-semibold text-xs">Total Project Cost</Text>
                    <View className="flex-row items-baseline">
                        <Text className="text-slate-500 font-medium text-[10px] mr-1.5">RM</Text>
                        <Text className="text-slate-800 font-bold text-xl">
                            {(projectCosts.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
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
                    />
                ))}
            </ScrollView>
        </View>
    );
};

export default CostBreakdownScreen;