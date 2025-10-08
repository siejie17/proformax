import { Animated, View, Text, FlatList, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, TextInput, Dimensions, Pressable } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import InfoGuideModal from '../components/InfoGuideModal';

const GreenElementsScreen = ({ route: ro, navigation, results, criteriaTotalMarks, setCriteriaTotalMarks = () => {} }) => {
    const route = useRoute();
    // Handle both direct route params and initialParams from TopTabsWrapper
    const params = route.params || {};
    const { cost, green_elements } = params;

    const [criteria, setCriteria] = useState([]); // *
    const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
    const [selectedCriterion, setSelectedCriterion] = useState(null);
    const [checkedItems, setCheckedItems] = useState({}); //*
    const [loading, setLoading] = useState(false);
    const [customInputs, setCustomInputs] = useState({});
    const [customItems, setCustomItems] = useState({});
    const [criteriaMarks, setCriteriaMarks] = useState({}); // Maps criterion name to earned marks

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const criteriaFlatListRef = useRef(null);

    const [isInfoGuideVisible, setIsInfoGuideVisible] = useState(false);
    const [infoGuideText, setInfoGuideText] = useState('');

    const SCREEN_WIDTH = Dimensions.get('window').width;

    const handleInfoGuideOpen = (text) => {
        setInfoGuideText(text);
        setIsInfoGuideVisible(true);
    }

    const selectedCriterionData = useMemo(() => {
        if (criteria && selectedCriterion) {
            return criteria.find(criterion => criterion.name === selectedCriterion);
        }
        return null;
    }, [criteria, selectedCriterion]);

    const handleSectionPress = useCallback((criterion) => {
        setSelectedCriterion(criterion.name);

        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, [fadeAnim, slideAnim]);

    const handleCheckboxToggle = useCallback((itemId, itemData = null) => {
        setCheckedItems(prev => {
            const wasChecked = prev[itemId];
            const newCheckedState = {
                ...prev,
                [itemId]: !wasChecked
            };

            // Find the criterion this item belongs to
            let targetCriterion = null;
            let parentItem = null;
            let isSubitem = false;

            // Search through all criteria to find this item
            for (const criterion of criteria) {
                // Check direct items
                if (criterion.items) {
                    for (const item of criterion.items) {
                        // ✅ Check subitems first
                        if (item.subitems && item.subitems.find(sub => sub.id === itemId)) {
                            targetCriterion = criterion.name;
                            parentItem = item;
                            isSubitem = true;
                            break;
                        }

                        // ✅ Then check if this item itself is the one toggled
                        if (item.id === itemId) {
                            targetCriterion = criterion.name;
                            parentItem = item;
                            break;
                        }
                    }

                    if (targetCriterion) break;
                }

                // Check subcriteria items
                if (criterion.subcriteria) {
                    for (const subcriterion of criterion.subcriteria) {
                        if (subcriterion.items) {
                            const foundItem = subcriterion.items.find(item => item.id === itemId);
                            if (foundItem) {
                                targetCriterion = criterion.name;
                                parentItem = foundItem;
                                break;
                            }

                            // Check subitems
                            for (const item of subcriterion.items) {
                                if (item.subitems && item.subitems.find(sub => sub.id === itemId)) {
                                    targetCriterion = criterion.name;
                                    parentItem = item;
                                    isSubitem = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (targetCriterion) break;
            }

            // Also check custom items
            if (!targetCriterion) {
                for (const criterion of criteria) {
                    const allItems = [
                        ...(criterion.items || []),
                        ...(criterion.subcriteria?.flatMap(sub => sub.items || []) || [])
                    ];

                    for (const item of allItems) {
                        if (customItems[item.id]?.find(custom => custom.id === itemId)) {
                            targetCriterion = criterion.name;
                            parentItem = item;
                            isSubitem = true; // Custom items behave like subitems
                            break;
                        }
                    }
                    if (targetCriterion) break;
                }
            }

            if (targetCriterion) {
                setCriteriaMarks(prevMarks => {
                    const currentMarks = prevMarks[targetCriterion] || 0;

                    if (isSubitem || (parentItem && parentItem.subitems_exist)) {
                        // Subitem logic: 1 mark each, max 6 marks for the parent item
                        const allSubitemIds = [];

                        // Get all subitem IDs for this parent item
                        if (parentItem.subitems) {
                            allSubitemIds.push(...parentItem.subitems.map(sub => sub.id));
                        }
                        if (customItems[parentItem.id]) {
                            allSubitemIds.push(...customItems[parentItem.id].map(custom => custom.id));
                        }

                        // Count how many subitems are checked (including this toggle)
                        const checkedSubitems = allSubitemIds.filter(id => newCheckedState[id]).length;

                        // Calculate marks: min(checkedSubitems, 6)
                        const subitemMarks = Math.min(checkedSubitems, 6);

                        // Calculate the difference from previous subitem marks
                        const previousCheckedSubitems = allSubitemIds.filter(id => prev[id]).length;
                        const previousSubitemMarks = Math.min(previousCheckedSubitems, 6);
                        const marksDifference = subitemMarks - previousSubitemMarks;

                        return {
                            ...prevMarks,
                            [targetCriterion]: Math.max(0, currentMarks + marksDifference)
                        };
                    } else {
                        // Regular item logic: add/deduct item.marks
                        const marks = parentItem.marks || 0;
                        const newMarks = wasChecked
                            ? Math.max(0, currentMarks - marks) // Deduct marks
                            : currentMarks + marks; // Add marks

                        return {
                            ...prevMarks,
                            [targetCriterion]: newMarks
                        };
                    }
                });
            }

            return newCheckedState;
        });
    }, [criteria, customItems]);

    const handleCustomInputChange = useCallback((itemId, text) => {
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: text
        }));
    }, []);

    const addCustomItem = useCallback((itemId, text) => {
        if (!text.trim()) return;

        const customItemId = `custom_${itemId}_${Date.now()}`;
        const newCustomItem = {
            id: customItemId,
            description: text.trim(),
            isCustom: true
        };

        // Find the parent item to check if it has subitems_exist
        let parentItem = null;
        for (const criterion of criteria) {
            const allItems = [
                ...(criterion.items || []),
                ...(criterion.subcriteria?.flatMap(sub => sub.items || []) || [])
            ];
            parentItem = allItems.find(item => item.id === itemId);
            if (parentItem) break;
        }

        // Update custom items
        setCustomItems(prevCustomItems => {
            const updatedCustomItems = {
                ...prevCustomItems,
                [itemId]: [...(prevCustomItems[itemId] || []), newCustomItem]
            };

            // Auto-check the custom item and update marks
            setCheckedItems(prevCheckedItems => {
                const updatedCheckedItems = {
                    ...prevCheckedItems,
                    [customItemId]: true
                };

                // Update marks for subitems if this is a subitem parent
                if (parentItem && parentItem.subitems_exist && selectedCriterion) {
                    setCriteriaMarks(pprevMarks => {
                        const currentMarks = pprevMarks[selectedCriterion] || 0;

                        // Get all subitem IDs for this parent item
                        const allSubitemIds = [];
                        if (parentItem.subitems) {
                            allSubitemIds.push(...parentItem.subitems.map(sub => sub.id));
                        }
                        // Include all custom items (including the new one)
                        allSubitemIds.push(...updatedCustomItems[itemId].map(custom => custom.id));

                        // Count checked subitems before and after
                        const prevCheckedSubitems = allSubitemIds.filter(id =>
                            id !== customItemId && prevCheckedItems[id]
                        ).length;
                        const newCheckedSubitems = allSubitemIds.filter(id =>
                            updatedCheckedItems[id]
                        ).length;

                        // Calculate marks difference (max 6 marks per parent)
                        const prevMarks = Math.min(prevCheckedSubitems, 6);
                        const newMarks = Math.min(newCheckedSubitems, 6);
                        const marksDifference = newMarks - prevMarks;

                        return {
                            ...prevMarks,
                            [selectedCriterion]: Math.max(0, currentMarks + marksDifference)
                        };
                    });
                }

                return updatedCheckedItems;
            });

            return updatedCustomItems;
        });

        // Clear the input field
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: ''
        }));
    }, [selectedCriterion, criteria]);

    const deleteCustomItem = useCallback((itemId, customItemId) => {
        const targetCriterion = selectedCriterion;

        setCustomItems(prev => ({
            ...prev,
            [itemId]: prev[itemId]?.filter(item => item.id !== customItemId) || []
        }));

        setCheckedItems(prev => {
            const newState = { ...prev };
            const wasChecked = newState[customItemId];
            delete newState[customItemId];

            // Update marks if this custom item was checked
            if (wasChecked && targetCriterion) {
                setCriteriaMarks(prevMarks => {
                    const currentMarks = prevMarks[targetCriterion] || 0;

                    // Find the parent item
                    let parentItem = null;
                    for (const criterion of criteria) {
                        const allItems = [
                            ...(criterion.items || []),
                            ...(criterion.subcriteria?.flatMap(sub => sub.items || []) || [])
                        ];
                        parentItem = allItems.find(item => item.id === itemId);
                        if (parentItem) break;
                    }

                    if (parentItem) {
                        // Get all subitem IDs for this parent item (excluding the deleted one)
                        const allSubitemIds = [];
                        if (parentItem.subitems) {
                            allSubitemIds.push(...parentItem.subitems.map(sub => sub.id));
                        }
                        // Include remaining custom items (after deletion)
                        const remainingCustomItems = (prev[itemId] || []).filter(item => item.id !== customItemId);
                        allSubitemIds.push(...remainingCustomItems.map(custom => custom.id));

                        // Count total checked subitems before deletion
                        const totalCheckedBefore = [
                            ...allSubitemIds,
                            customItemId // Include the one being deleted
                        ].filter(id => {
                            // Use the original checkedItems state for the deleted item
                            return id === customItemId ? wasChecked : prev[id];
                        }).length;

                        // Count total checked subitems after deletion
                        const totalCheckedAfter = allSubitemIds.filter(id => newState[id]).length;

                        // Calculate marks before and after
                        const marksBefore = Math.min(totalCheckedBefore, 6);
                        const marksAfter = Math.min(totalCheckedAfter, 6);

                        // Only deduct marks if total ticks were <= 6 (meaning each tick counted)
                        const marksDifference = marksAfter - marksBefore;

                        return {
                            ...prevMarks,
                            [targetCriterion]: Math.max(0, currentMarks + marksDifference)
                        };
                    }

                    return prevMarks;
                });
            }

            return newState;
        });
    }, [selectedCriterion, criteria]);

    // Update criteriaTotalMarks whenever criteriaMarks changes
    useEffect(() => {
        if (setCriteriaTotalMarks && typeof setCriteriaTotalMarks === 'function') {
            const totalMarks = Object.values(criteriaMarks).reduce((sum, marks) => sum + marks, 0);
            setCriteriaTotalMarks(totalMarks);
        }
    }, [criteriaMarks, setCriteriaTotalMarks]);

    useEffect(() => {
        setLoading(true);

        if (green_elements && Array.isArray(green_elements) && green_elements.length > 0) {
            const newSections = green_elements.map(item => {
                let name;

                if (typeof item === 'string') {
                    name = item;
                } else if (item && item.name) {
                    name = item.name;
                } else {
                    name = String(item);
                }

                return name ? { ...item } : null;
            }).filter(Boolean);

            // Initialize checked items state
            const initialCheckedState = {};
            newSections.forEach(criterion => {
                // Handle items at criterion level
                if (criterion.items && Array.isArray(criterion.items)) {
                    criterion.items.forEach(item => {
                        initialCheckedState[item.id] = false;
                        // Initialize subitems if they exist
                        if (item.subitems && Array.isArray(item.subitems)) {
                            item.subitems.forEach(subitem => {
                                initialCheckedState[subitem.id] = false;
                            });
                        }
                    });
                }
                // Handle items in subcriteria
                if (criterion.subcriteria && Array.isArray(criterion.subcriteria)) {
                    criterion.subcriteria.forEach(sub => {
                        if (sub.items && Array.isArray(sub.items)) {
                            sub.items.forEach(item => {
                                initialCheckedState[item.id] = false;
                                // Initialize subitems if they exist
                                if (item.subitems && Array.isArray(item.subitems)) {
                                    item.subitems.forEach(subitem => {
                                        initialCheckedState[subitem.id] = false;
                                    });
                                }
                            });
                        }
                    });
                }
            });

            setSelectedCriterion(newSections[0]?.name);
            setCriteria(newSections);
            setCheckedItems(initialCheckedState);
        } else {
            setCriteria([]);
        }

        setLoading(false);
    }, [green_elements]);

    const renderSection = useCallback(({ item }) => {
        // Enhanced UX implementation - one card per swipe, fixed size, no overflow
        const isSelected = selectedCriterion === item.name;
        const earnedPoints = criteriaMarks[item.name] || 0;
        const totalPoints = item.total_marks || 0;
        const minPoints = item.min_marks || 0;

        return (
            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, justifyContent: 'center' }}>
                <Pressable
                    key={item.name}
                    onPress={() => handleSectionPress(item)}
                    android_ripple={{ color: '#B7E4C7' }}
                >
                    <View 
                        className={`py-4 px-5 rounded-3xl shadow-lg ${
                            isSelected ? 'bg-[#B7E4C7] elevation-6' : 'bg-[#F8FFF9] elevation-3'
                        }`}
                        style={{
                            minHeight: 90,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isSelected ? 0.15 : 0.1,
                            shadowRadius: isSelected ? 8 : 4,
                            justifyContent: 'center', // Center content vertically
                        }}
                    >
                        {/* Title Section */}
                        <View className="justify-center mb-2">
                            <Text 
                                className='text-base font-semibold text-[#081C15] text-center leading-5'
                                numberOfLines={2}
                                style={{ 
                                    textAlign: 'center',
                                    fontWeight: '600'
                                }}
                            >
                                {item.name}
                            </Text>
                        </View>
                        
                        {/* Progress Section */}
                        <View className="items-center">
                            <View className="flex-row items-center justify-center gap-2">
                                <View 
                                    className={`px-3 py-1.5 rounded-full ${
                                        earnedPoints >= minPoints ? 'bg-[#52B788]' : 'bg-red-500/70'
                                    }`}
                                    style={{
                                        minWidth: 36,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                    }}
                                >
                                    <Text className="text-white text-sm font-bold text-center">
                                        {earnedPoints}
                                    </Text>
                                </View>
                                <Text className="text-[#081C15] text-sm font-semibold">/</Text>
                                <View 
                                    className="px-3 py-1.5 rounded-full bg-[#2D6A4F]"
                                    style={{
                                        minWidth: 36,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                    }}
                                >
                                    <Text className="text-white text-sm font-bold text-center">
                                        {totalPoints}
                                    </Text>
                                </View>
                            </View>
                            
                            {/* Progress indicator text */}
                            <View className="mt-2">
                                <Text className="text-[#081C15] text-xs font-medium opacity-70">
                                    {earnedPoints >= minPoints ? 'Completed' : `You need at least ${minPoints} marks to proceed`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </View>
        );
    }, [selectedCriterion, handleSectionPress, criteriaMarks]);

    const renderItem = useCallback((item) => {
        const hasSubitems = item.subitems_exist && item.subitems && item.subitems.length > 0;

        return (
            <View key={item.id} className="mb-3">
                <View className="flex-row items-center py-4 px-6 bg-white rounded-xl shadow-md border border-gray-100">
                    {!hasSubitems && (
                        <Checkbox
                            value={checkedItems[item.id] || false}
                            onValueChange={() => handleCheckboxToggle(item.id)}
                            color={checkedItems[item.id] ? '#40916C' : undefined}
                            className="mr-4"
                            style={{
                                transform: [{ scale: 1.1 }]
                            }}
                        />
                    )}
                    <TouchableOpacity
                        className="flex-1 mr-3"
                        onPress={() => !hasSubitems && handleCheckboxToggle(item.id)}
                        activeOpacity={hasSubitems ? 1 : 0.7}
                    >
                        <Text
                            className={`text-base leading-6 ${hasSubitems ? 'font-bold text-gray-900' : 'text-gray-800'}`}
                            style={{ fontWeight: hasSubitems ? '700' : (checkedItems[item.id] ? '600' : '500') }}
                        >
                            {item.description}
                        </Text>
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-2">
                        {item.marks && !hasSubitems && (
                            <TouchableOpacity
                                onPress={() => handleCheckboxToggle(item.id)}
                                activeOpacity={0.7}
                                className="bg-gradient-to-r from-[#D8F3DC] to-[#B7E4C7] px-3 py-1.5 rounded-full shadow-sm"
                                style={{ minWidth: 50 }}
                            >
                                <Text className="text-[#1B4332] text-xs font-bold text-center">{item.marks} pts</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleInfoGuideOpen(item.info)}
                            className="bg-gray-100 p-2 rounded-full active:bg-gray-200"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="information-circle-outline" size={20} color="#52B788" />
                        </TouchableOpacity>
                    </View>
                </View>

                {hasSubitems ? (
                    <View className="ml-4 mt-2">
                        {item.subitems.map((subitem) => (
                            <TouchableOpacity
                                key={subitem.id}
                                className="flex-row items-center py-3 px-5 bg-gray-50 rounded-lg mb-2 border border-gray-200"
                                onPress={() => handleCheckboxToggle(subitem.id)}
                                activeOpacity={0.7}
                            >
                                <Checkbox
                                    value={checkedItems[subitem.id] || false}
                                    onValueChange={() => handleCheckboxToggle(subitem.id)}
                                    color={checkedItems[subitem.id] ? '#40916C' : undefined}
                                    className="mr-3"
                                    style={{
                                        transform: [{ scale: 1.0 }]
                                    }}
                                />
                                <View className="flex-1 mr-3">
                                    <Text
                                        className="text-sm leading-5 text-gray-700"
                                        style={{ fontWeight: checkedItems[subitem.id] ? '600' : '500' }}
                                    >
                                        {subitem.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* Render custom items */}
                        {customItems[item.id] && customItems[item.id].map((customItem) => (
                            <View key={customItem.id} className="flex-row items-center py-3 px-5 bg-gray-50 rounded-lg mb-2 border border-blue-200">
                                <Checkbox
                                    value={true} // Always checked for custom items
                                    onValueChange={() => { }} // No-op - cannot toggle custom items
                                    color='#40916C'
                                    className="mr-3"
                                    style={{
                                        transform: [{ scale: 1.0 }],
                                        // opacity: 0.8 // Slightly transparent to show it's non-interactive
                                    }}
                                    disabled={true}
                                />
                                <View className="flex-1 mr-3">
                                    <Text
                                        className="text-sm leading-5 text-gray-700"
                                        style={{ fontWeight: '400' }} // Always lighter since it's always checked
                                    >
                                        {customItem.description}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => deleteCustomItem(item.id, customItem.id)}
                                    className="p-1 ml-2"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Custom input field for additional items */}
                        <View className="flex-row items-center py-3 px-5 bg-white rounded-lg mb-2 border border-gray-300">
                            <View className="mr-3 w-5 h-5">
                                {/* Empty space to align with checkboxes above */}
                            </View>
                            <View className="flex-1 mr-3">
                                <TextInput
                                    key={`input-${item.id}`}
                                    placeholder="Add other items not listed above..."
                                    value={customInputs[item.id] || ''}
                                    onChangeText={(text) => handleCustomInputChange(item.id, text)}
                                    onSubmitEditing={() => addCustomItem(item.id, customInputs[item.id])}
                                    className="text-sm leading-5 text-gray-700 pb-1"
                                    style={{
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#D1D5DB',
                                        paddingVertical: 4,
                                        fontWeight: '400'
                                    }}
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="done"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={() => addCustomItem(item.id, customInputs[item.id])}
                                className="p-2 ml-2 bg-green-500 rounded-full"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>
        );
    }, [checkedItems, handleCheckboxToggle, customItems, customInputs, handleCustomInputChange, addCustomItem, deleteCustomItem]);

    const renderCriterionHeader = useCallback(() => {
        if (!selectedCriterionData) return null;

        return (
            <View className="px-5 bg-gray-100">
                {/* Criterion Header */}
                <View className="mb-4 pb-4 border-b-2 border-gray-200">
                    <Text className="text-gray-900 text-xl font-bold mb-1" numberOfLines={2}>
                        {selectedCriterionData.name}
                    </Text>
                </View>
            </View>
        );
    }, [selectedCriterionData]);

    const renderCriterionItems = useCallback(() => {
        if (!selectedCriterionData) return null;

        const hasSubcriteria = selectedCriterionData.subcriteria &&
            selectedCriterionData.subcriteria.length > 0;
        const hasCriterionItems = selectedCriterionData.items &&
            selectedCriterionData.items.length > 0;

        return (
            <View className="px-5">
                {/* Render items directly if no subcriteria */}
                {!hasSubcriteria && hasCriterionItems && (
                    <View className="mb-6">
                        {selectedCriterionData.items.map(item => renderItem(item))}
                    </View>
                )}

                {/* Render subcriteria with their items */}
                {hasSubcriteria && selectedCriterionData.subcriteria.map((subcriterion, index) => {
                    const hasItems = subcriterion.items && subcriterion.items.length > 0;

                    if (!hasItems) return null;

                    return (
                        <View key={index} className="mb-3">
                            <View className="px-3 py-2 rounded-lg mb-2">
                                <Text className="text-gray-700 text-lg font-bold">
                                    {subcriterion.name}
                                </Text>
                            </View>
                            {subcriterion.items.map(item => renderItem(item))}
                        </View>
                    );
                })}
            </View>
        );
    }, [selectedCriterionData, renderItem]);

    if (loading) {
        return (
            <View className="flex-1 bg-gray-100 justify-center items-center">
                <Text className="text-gray-600 text-base">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-100">
            {criteria.length === 0 && !loading ? (
                <View className="flex-1 justify-center items-center px-6">
                    <Text className="text-gray-600 text-lg font-semibold mb-2 text-center">
                        No Green Elements Available
                    </Text>
                    <Text className="text-gray-500 text-base text-center">
                        There are no green building elements to display at this time.
                    </Text>
                </View>
            ) : criteria.length !== 0 && (
                <>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View>
                            <View className="px-4 pt-4">
                                <Text className="text-gray-900 text-base font-semibold px-2">
                                    Criteria
                                </Text>
                            </View>

                            <View className="relative" style={{ height: 140 }}>
                                <FlatList
                                    ref={criteriaFlatListRef}
                                    horizontal
                                    data={criteria}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    renderItem={renderSection}
                                    style={{ height: 110 }}
                                    contentContainerStyle={{ paddingVertical: 20 }}
                                    showsHorizontalScrollIndicator={false}
                                    snapToInterval={SCREEN_WIDTH}
                                    decelerationRate="fast"
                                    snapToAlignment="center"
                                    pagingEnabled={false} // Use snapToInterval for better UX control
                                    onMomentumScrollEnd={(event) => {
                                        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                        setCurrentCriteriaIndex(index);
                                        // Update selected criterion when swiping
                                        if (criteria[index]) {
                                            setSelectedCriterion(criteria[index].name);
                                        }
                                    }}
                                    bounces={false}
                                    overScrollMode="never"
                                />

                                {/* Enhanced pagination dots - positioned below FlatList */}
                                <View 
                                    className="flex-row justify-center items-center gap-2 absolute -bottom-3 left-0 right-0"
                                    style={{ paddingBottom: 8 }}
                                >
                                    {criteria.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                criteriaFlatListRef.current?.scrollToOffset({
                                                    offset: index * SCREEN_WIDTH,
                                                    animated: true
                                                });
                                                // Update selected criterion when tapping pagination dot
                                                setCurrentCriteriaIndex(index);
                                                if (criteria[index]) {
                                                    setSelectedCriterion(criteria[index].name);
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                className={`h-2 rounded-full ${
                                                    index === currentCriteriaIndex
                                                        ? 'w-8 bg-[#2D6A4F]'
                                                        : 'w-2 bg-gray-300'
                                                }`}
                                                style={{
                                                    shadowColor: index === currentCriteriaIndex ? '#2D6A4F' : 'transparent',
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 2,
                                                }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    <View className="flex-1 pt-2">
                        <View className="mt-4">
                            {renderCriterionHeader()}
                        </View>
                        <ScrollView
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {renderCriterionItems()}
                        </ScrollView>
                    </View>

                    <InfoGuideModal
                        isVisible={isInfoGuideVisible}
                        info={infoGuideText}
                        onClose={() => setIsInfoGuideVisible(false)}
                    />
                </>
            )}
        </View>
    );
}

export default GreenElementsScreen;