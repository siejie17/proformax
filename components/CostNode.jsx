import { View, Text, ScrollView, TextInput, TouchableOpacity, Animated, Alert } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const CostNode = ({ code, node, level = 0, onCostChange, path, onDelete, isDeleteMode }) => {
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

    const [isExpanded, setIsExpanded] = useState(level === 0);
    const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
    const rotateAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

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

    // Handle delete with confirmation
    const handleDelete = () => {
        Alert.alert(
            'Remove Item',
            `Are you sure you want to remove "${node.description}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => onDelete(currentPath)
                }
            ]
        );
    };

    // Top level sections (A, B, C)
    if (level === 0) {
        return (
            <View className="bg-white rounded-3xl mb-4 overflow-hidden shadow-md border border-gray-100">
                {/* Section Header */}
                <TouchableOpacity
                    className="px-5 py-4 flex-row items-center justify-between"
                    style={{ backgroundColor: '#1e293b' }}
                    onPress={hasChildren ? toggleExpanded : undefined}
                    activeOpacity={hasChildren ? 0.8 : 1}
                >
                    <View className="flex-row items-center flex-1 mr-4">
                        {hasChildren && (
                            <Animated.View
                                className="w-7 h-7 rounded-xl bg-white/10 items-center justify-center mr-3"
                                style={{ transform: [{ rotate: rotateInterpolate }] }}
                            >
                                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                            </Animated.View>
                        )}
                        <Text className="text-white font-bold text-xs leading-4 flex-1" numberOfLines={2}>
                            {code}. {node.description || 'No description'}
                        </Text>
                    </View>
                    {hasChildren ? (
                        <View className="bg-blue-500 rounded-xl px-3.5 py-2 flex-row items-center shadow-sm">
                            <Text className="text-blue-100 font-bold text-[9px] mr-1.5">RM</Text>
                            <Text className="text-white font-bold text-sm tracking-tight">
                                {node.cost !== null && node.cost !== undefined ? formatWithCommas(node.cost) : "—"}
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-2">
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
                            
                            {/* Delete Button for top-level items without children */}
                            {isDeleteMode && (
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
                {hasChildren && (
                    <Animated.View
                        style={{
                            opacity: animatedHeight,
                            maxHeight: animatedHeight.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1200],
                            }),
                        }}
                    >
                        {/* Table Header */}
                        <View className="bg-slate-50 px-5 py-3 flex-row justify-between">
                            <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Description</Text>
                            <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Amount</Text>
                        </View>

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
                            />
                        ))}
                    </Animated.View>
                )}
            </View>
        );
    }

    // Items within tables
    return (
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
                            />
                        ))}
                    </Animated.View>
                </>
            ) : (
                // Regular table row for items without children (innermost items - can be deleted)
                <View className={`px-5 py-3.5 flex-row items-center justify-between border-b border-slate-50 ${level > 1 ? 'pl-14 bg-slate-50/30' : 'bg-white'}`}>
                    <Text className={`flex-1 mr-3 leading-4 ${level > 1 ? 'text-slate-500 text-[10px]' : 'text-slate-600 text-[11px]'} font-medium`} numberOfLines={2}>
                        {code}. {node.description || 'No description'}
                    </Text>
                    
                    <View className="flex-row items-center gap-2">
                        {/* Input Field */}
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

                        {/* Delete Button */}
                        {isDeleteMode && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                className="bg-red-50 border border-red-200 rounded-lg p-2 active:bg-red-100"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

export default CostNode;