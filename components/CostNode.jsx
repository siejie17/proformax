import { View, Text, TextInput, TouchableOpacity, Animated, Modal } from 'react-native';
import React, { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const CostNode = ({ code, node, level = 0, onCostChange, path, onDelete = () => {}, isDeleteMode = null, isAddMode = null, onAddCost = () => {}, highlightedItem = null, displayOnly }) => {
    // Helper function to format number with thousands separators
    const formatWithCommas = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Helper function to remove commas from input
    const removeCommas = (value) => {
        return value.replace(/,/g, '');
    };

    // Helper function to add commas to input while typing
    const formatInputWithCommas = (value) => {
        const cleanValue = removeCommas(value);
        if (cleanValue === '') return '';

        if (cleanValue.endsWith('.')) {
            const intPart = cleanValue.slice(0, -1);
            return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.';
        }

        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return parts.join('.');
    };

    if (!node) return null;

    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const currentPath = path ? `${path}.${code}` : code;
    const isHighlighted = highlightedItem === currentPath;

    const [isExpanded, setIsExpanded] = useState(level === 0);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const rotateAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const highlightAnimation = useRef(new Animated.Value(0)).current;

    const toggleExpanded = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);

        Animated.parallel([
            Animated.timing(animatedHeight, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnimation, {
                toValue,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const rotateInterpolate = rotateAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    // Highlight animation effect
    React.useEffect(() => {
        if (isHighlighted) {
            // Blink 3 times
            Animated.sequence([
                Animated.timing(highlightAnimation, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightAnimation, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightAnimation, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(highlightAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [isHighlighted]);

    const highlightBackgroundColor = highlightAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 1)', 'rgba(59, 130, 246, 0.2)'], // white to blue
    });

    // Handle delete with confirmation
    const handleDelete = () => {
        setDeleteModalVisible(true);
    };

    const confirmDelete = () => {
        setDeleteModalVisible(false);
        onDelete(currentPath);
    };

    // Top level sections (A, B, C)
    if (level === 0) {
        const isLocked = node.locked && node.isMultiplier;

        return (
            <View className="bg-white rounded-3xl mb-4 overflow-hidden shadow-md border border-gray-100">
                {/* Section Header */}
                <TouchableOpacity
                    className={`px-5 py-4 flex-row items-center justify-between ${isLocked ? 'bg-amber-700' : 'bg-slate-800'}`}
                    onPress={!isLocked ? toggleExpanded : undefined}
                    activeOpacity={isLocked ? 1 : 0.8}
                    disabled={isLocked}
                >
                    <View className="flex-row items-center flex-1 mr-4">
                        {/* Chevron or Lock Icon */}
                        <View className={`w-7 h-7 rounded-xl ${isLocked ? 'bg-white/10' : 'bg-white/10'} items-center justify-center mr-3`}>
                            {isLocked ? (
                                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                            ) : hasChildren ? (
                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                                </Animated.View>
                            ) : (
                                <Ionicons name="attach" size={16} color="#FFFFFF" opacity={0.5} />
                            )}
                        </View>
                        <Text className="text-white font-bold text-xs leading-4 flex-1" numberOfLines={2}>
                            {code}. {node.description || 'No description'}
                        </Text>
                    </View>
                    {/* Cost Display or Input */}
                    {displayOnly || hasChildren || isLocked ? (
                        <View className={`${isLocked ? 'bg-amber-500' : 'bg-blue-500'} rounded-xl px-3.5 py-2 flex-row items-center shadow-sm`}>
                            <Text className="text-white font-bold text-sm tracking-tight">
                                {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : "—"}
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 min-w-[80px] shadow-sm">
                            <TextInput
                                className="text-slate-800 text-sm font-bold text-right p-0"
                                keyboardType="numeric"
                                value={node.inputValue !== undefined ? formatInputWithCommas(node.inputValue) : (node.cost !== null && node.cost !== undefined && node.cost !== 0 ? formatWithCommas(node.cost) : '')}
                                onChangeText={(val) => {
                                    const cleanVal = removeCommas(val);
                                    if (val === '' || /^[\d,]*\.?\d*$/.test(val)) {
                                        if (cleanVal === '' || /^\d*\.?\d*$/.test(cleanVal)) {
                                            onCostChange(currentPath, cleanVal === '' ? 0 : parseFloat(cleanVal) || 0, cleanVal);
                                        }
                                    }
                                }}
                                placeholder="0.00"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    )}

                    {/* Add/Delete buttons section - Hide for locked items */}
                    {!isLocked && (
                        <View className="flex-row items-center gap-2 ml-2">
                            {/* Add Child Button for top-level items */}
                            {isAddMode && hasChildren&& !displayOnly && (
                                <TouchableOpacity
                                    onPress={() => onAddCost(currentPath)}
                                    className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 active:bg-emerald-100"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={14} color="#059669" />
                                </TouchableOpacity>
                            )}

                            {/* Delete Button for top-level items */}
                            {isDeleteMode && !displayOnly && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </TouchableOpacity>

                {/* Table Container */}
                {!isLocked && hasChildren && (
                    <Animated.View
                        style={{
                            opacity: animatedHeight,
                            maxHeight: animatedHeight.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1200],
                            }),
                        }}
                    >
                        {/* Table Rows */}
                        {isExpanded && Object.entries(node.children).map(([childCode, childNode]) => (
                            <CostNode
                                key={childCode}
                                code={childCode}
                                node={childNode}
                                level={level + 1}
                                path={currentPath}
                                onCostChange={onCostChange}
                                onDelete={onDelete}
                                isDeleteMode={isDeleteMode}
                                isAddMode={isAddMode}
                                onAddCost={onAddCost}
                                highlightedItem={highlightedItem}
                                displayOnly={displayOnly}
                            />
                        ))}
                    </Animated.View>
                )}
            </View>
        );
    }

    // Items within tables
    return (
        <>
            <View>
                {hasChildren ? (
                    // Items with children - accordion
                    <>
                        <TouchableOpacity
                            className="bg-blue-50/40 border-b border-slate-100"
                            onPress={toggleExpanded}
                            activeOpacity={0.7}
                        >
                            <View className="px-5 py-3.5 flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1 mr-3">
                                    <Animated.View
                                        className="w-6 h-6 rounded-lg bg-blue-100 items-center justify-center mr-2.5"
                                        style={{ transform: [{ rotate: rotateInterpolate }] }}
                                    >
                                        <Ionicons name="chevron-forward" size={13} color="#3b82f6" />
                                    </Animated.View>
                                    <Text className="text-slate-700 font-semibold text-[11px] leading-4 flex-1" numberOfLines={2}>
                                        {code}. {node.description || 'No description'}
                                    </Text>
                                </View>
                                <View className="bg-blue-50 rounded-lg px-2.5 py-1.5 min-w-[85px]">
                                    <Text className="text-blue-600 font-bold text-[11px] text-right">
                                        {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : "—"}
                                    </Text>
                                </View>

                                {/* Add Child Button */}
                                {isAddMode && hasChildren && !displayOnly && (
                                    <TouchableOpacity
                                        onPress={() => onAddCost(currentPath)}
                                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 active:bg-emerald-100"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="add" size={12} color="#059669" />
                                    </TouchableOpacity>
                                )}

                                {/* Delete Button */}
                                {isDeleteMode && !displayOnly && (
                                    <TouchableOpacity
                                        onPress={handleDelete}
                                        className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="trash-outline" size={12} color="#dc2626" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Accordion Content */}
                        <Animated.View
                            style={{
                                opacity: animatedHeight,
                                maxHeight: animatedHeight.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 600],
                                }),
                            }}
                            className="overflow-hidden"
                        >
                            {isExpanded && Object.entries(node.children).map(([childCode, childNode]) => (
                                <CostNode
                                    key={childCode}
                                    code={childCode}
                                    node={childNode}
                                    level={level + 1}
                                    path={currentPath}
                                    onCostChange={onCostChange}
                                    onDelete={onDelete}
                                    isDeleteMode={isDeleteMode}
                                    isAddMode={isAddMode}
                                    onAddCost={onAddCost}
                                    highlightedItem={highlightedItem}
                                    displayOnly={displayOnly}
                                />
                            ))}
                        </Animated.View>
                    </>
                ) : (
                    // Regular table row for items without children (innermost items - can be deleted)
                    <Animated.View
                        className={`px-5 py-3.5 flex-row items-center justify-between border-b border-slate-50 ${level > 1 ? 'pl-14 bg-slate-50/30' : 'bg-white'}`}
                        style={{
                            backgroundColor: isHighlighted ? highlightBackgroundColor : undefined
                        }}
                    >
                        <Text className={`flex-1 mr-3 leading-4 ${level > 1 ? 'text-slate-500 text-[10px]' : 'text-slate-600 text-[11px]'} font-medium`} numberOfLines={2}>
                            {code}. {node.description || 'No description'}
                        </Text>

                        <View className="flex-row items-center gap-2">
                            {/* Input Field or Display Only */}
                            {displayOnly ? (
                                <View className="bg-gray-100 rounded-xl px-3 py-2 min-w-[85px]">
                                    <Text className="text-slate-600 text-[11px] font-bold text-right">
                                        {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : "—"}
                                    </Text>
                                </View>
                            ) : (
                                <View className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 min-w-[85px] shadow-sm">
                                    <TextInput
                                        className="text-slate-800 text-[11px] font-bold text-right p-0"
                                        keyboardType="numeric"
                                        value={node.inputValue !== undefined ? formatInputWithCommas(node.inputValue) : (node.cost !== null && node.cost !== undefined && node.cost !== 0 ? formatWithCommas(node.cost) : '')}
                                        onChangeText={(val) => {
                                            const cleanVal = removeCommas(val);
                                            if (val === '' || /^[\d,]*\.?\d*$/.test(val)) {
                                                if (cleanVal === '' || /^\d*\.?\d*$/.test(cleanVal)) {
                                                    onCostChange(currentPath, cleanVal === '' ? 0 : parseFloat(cleanVal) || 0, cleanVal);
                                                }
                                            }
                                        }}
                                        placeholder="0.00"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            )}

                            {/* Delete Button */}
                            {isDeleteMode && !displayOnly && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-lg">
                        {/* Icon */}
                        <View className="items-center mb-4">
                            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center">
                                <Ionicons name="trash-outline" size={32} color="#dc2626" />
                            </View>
                        </View>

                        {/* Title */}
                        <Text className="text-slate-900 font-bold text-lg text-center mb-2">
                            Remove Item
                        </Text>

                        {/* Message */}
                        <Text className="text-slate-600 text-sm text-center mb-6">
                            Are you sure you want to remove "{node.description}"?
                        </Text>

                        {/* Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setDeleteModalVisible(false)}
                                className="flex-1 bg-slate-100 rounded-xl py-3 active:bg-slate-200"
                                activeOpacity={0.8}
                            >
                                <Text className="text-slate-700 font-bold text-center text-sm">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={confirmDelete}
                                className="flex-1 bg-red-600 rounded-xl py-3 active:bg-red-700"
                                activeOpacity={0.8}
                            >
                                <Text className="text-white font-bold text-center text-sm">
                                    Remove
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default CostNode;