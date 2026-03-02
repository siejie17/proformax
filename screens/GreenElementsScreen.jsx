import { Animated, View, Text, FlatList, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, TextInput, Dimensions, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Checkbox from 'expo-checkbox';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Markdown from '@ronradtke/react-native-markdown-display';
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from 'react-native-reanimated';

import InfoGuideModal from '../components/InfoGuideModal';
import SkeletonLoader from '../components/SkeletonLoader';
import UpdatedToastMessage from '../components/UpdatedToastMessage';

// This is the default configuration
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false, // Reanimated runs in strict mode by default
});

const GreenElementsScreen = ({ greenElements, setGreenElements = () => { }, criteriaTotalMarks, setCriteriaTotalMarks = () => { }, criteriaMarks, setCriteriaMarks = () => { }, checkedItems, setCheckedItems, checkedSubitems, setCheckedSubitems, customItems, setCustomItems, showCostUpdatedToast, setShowCostUpdatedToast, objectsConfig, visibleObjects, setVisibleObjects, user3DVisibility, setUser3DVisibility, ...otherProps }) => {
    const [criteria, setCriteria] = useState([]);
    const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
    const [selectedCriterion, setSelectedCriterion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customInputs, setCustomInputs] = useState({});
    const [expandedItems, setExpandedItems] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const criteriaFlatListRef = useRef(null);
    const verticalScrollRef = useRef(null); // Ref for vertical ScrollView

    const [isInfoGuideVisible, setIsInfoGuideVisible] = useState(false);
    const [infoGuideText, setInfoGuideText] = useState('');

    const SCREEN_WIDTH = Dimensions.get('window').width;

    // const [showToast, setShowToast] = useState(false);

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCriterion(criterion.name);

        // Reset vertical scroll to top
        verticalScrollRef.current?.scrollTo({ y: 0, animated: true });

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

    // const evaluateVisibility = (checkedItems, checkedSubitems) => {
    //     const newVisibility = {};
    //     const newUser3DVisibility = { ...user3DVisibility };

    //     objectsConfig.forEach(obj => {
    //         const visible = obj.triggers.some(trigger => {
    //             if (trigger.trigger_type === 'ITEM') {
    //                 return checkedItems[trigger.trigger_id] === true;
    //             }
    //             if (trigger.trigger_type === 'SUBITEM') {
    //                 return checkedSubitems[trigger.trigger_id] === true;
    //             }
    //             return false;
    //         });

    //         newVisibility[obj.obj_name] = visible;
    //         newUser3DVisibility[obj.name] = visible;
    //     });

    //     setVisibleObjects(newVisibility);
    //     setUser3DVisibility(newUser3DVisibility);
    // }

    const handleCheckboxToggle = useCallback((itemId, parentId = null, itemData) => {
        // Add haptic feedback for checkbox interactions
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // const hasRelated3DObject = objectsConfig.some(obj =>
        //     obj.triggers.some(trigger =>
        //         (trigger.trigger_type === 'ITEM' && trigger.trigger_id === itemId) ||
        //         (trigger.trigger_type === 'SUBITEM' && trigger.trigger_id === itemId)
        //     )
        // );

        if (itemData == "subitems") {
            // Use checkedSubitems for subitems checkbox state
            setCheckedSubitems(prev => {
                const wasChecked = prev[parentId]?.[itemId];
                const newCheckedState = {
                    [parentId]: {
                        ...prev[parentId],
                        [itemId]: !wasChecked
                    }
                };

                // Find the criterion this item belongs to
                let targetCriterion = null;
                let maximumPoints = null;
                let parentItem = null;

                // Search through all criteria to find this item
                for (const criterion of criteria) {
                    // Check direct items
                    if (criterion.items) {
                        for (const item of criterion.items) {
                            // Check if this subitem belongs to this item
                            if (item.subitems && item.subitems.find(sub => sub.id === itemId)) {
                                targetCriterion = criterion.name;
                                maximumPoints = item.marks || null;
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
                                // Check subitems
                                for (const item of subcriterion.items) {
                                    if (item.subitems && item.subitems.find(sub => sub.id === itemId)) {
                                        targetCriterion = criterion.name;
                                        maximumPoints = item.marks || null;
                                        parentItem = item;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (targetCriterion) break;
                }

                if (targetCriterion && parentItem) {
                    setCriteriaMarks(prevMarks => {
                        const currentMarks = prevMarks[targetCriterion] || 0;

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
                        // Need to check both newCheckedState (subitems) and checkedItems (custom items)
                        const totalCheckedSubitems = allSubitemIds.filter(id => {
                            // If it's in newCheckedState (subitems being toggled), use that
                            if (parentId in newCheckedState && id in newCheckedState[parentId]) {
                                return newCheckedState[parentId][id];
                            }
                            // Otherwise check checkedSubitems (for other subitems)
                            if (parentId in checkedSubitems && id in checkedSubitems[parentId]) {
                                return checkedSubitems[parentId][id];
                            }
                            // Check if it's a custom item (auto-checked, so return true)
                            if (customItems[parentId]?.find(custom => custom.id === id)) {
                                return true;
                            }
                            return checkedItems[id];
                        }).length;

                        // Calculate marks: min(checkedSubitems, maximumPoints or default 6)
                        const maxMarks = maximumPoints || 6;
                        const subitemMarks = Math.min(totalCheckedSubitems, maxMarks);

                        // Calculate the difference from previous subitem marks
                        const previousCheckedSubitems = allSubitemIds.filter(id => {
                            // If it's in prev (previous subitems state), use that
                            if (parentId in prev && id in prev[parentId]) {
                                return prev[parentId][id];
                            }
                            // Check if it's a custom item (auto-checked, so return true)
                            if (customItems[parentId]?.find(custom => custom.id === id)) {
                                return true;
                            }
                            // Otherwise check checkedItems (custom items)
                            return checkedItems[id];
                        }).length;
                        const previousSubitemMarks = Math.min(previousCheckedSubitems, maxMarks);
                        const marksDifference = subitemMarks - previousSubitemMarks;

                        return {
                            ...prevMarks,
                            [targetCriterion]: Math.max(0, currentMarks + marksDifference)
                        };
                    });
                }

                // evaluateVisibility(checkedItems, Object.values(newCheckedState)[0]);

                // if (hasRelated3DObject) {
                //     setShowToast(true);
                //     setTimeout(() => setShowToast(false), 2000);
                // }

                return newCheckedState;
            });
        } else {
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

                            const totalChecked = allSubitemIds.filter(id => {
                                // If it's in newCheckedState, use that (for items being toggled)
                                if (id in newCheckedState) {
                                    return newCheckedState[id];
                                }
                                // Otherwise check checkedSubitems
                                return checkedSubitems[id];
                            }).length;

                            // Calculate marks: min(checkedSubitems, parentItem.marks or 6)
                            const maxMarks = parentItem.marks || 6;
                            const subitemMarks = Math.min(totalChecked, maxMarks);

                            // Calculate the difference from previous subitem marks
                            const previousTotal = allSubitemIds.filter(id => {
                                // If it's in prev, use that
                                if (id in prev) {
                                    return prev[id];
                                }
                                // Otherwise check checkedSubitems
                                return checkedSubitems[id];
                            }).length;
                            const previousSubitemMarks = Math.min(previousTotal, maxMarks);
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

                // evaluateVisibility(newCheckedState, checkedSubitems);

                // if (hasRelated3DObject) {
                //     setShowToast(true);
                //     setTimeout(() => setShowToast(false), 2000);
                // }

                return newCheckedState;
            });
        }
    }, [criteria, customItems]);

    const handleCustomInputChange = useCallback((itemId, text) => {
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: text
        }));
    }, []);

    const addCustomItem = useCallback((itemId, text) => {
        if (!text.trim()) return;

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

        // Success haptic for adding custom item
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const customItemId = `custom_${itemId}_${Date.now()}`;
        const newCustomItem = {
            id: customItemId,
            description: text.trim(),
            isCustom: true
        };

        // Update custom items
        setCustomItems(prevCustomItems => {
            const updatedCustomItems = {
                ...prevCustomItems,
                [itemId]: [...(prevCustomItems[itemId] || []), newCustomItem]
            };

            // Update marks for subitems if this is a subitem parent
            if (parentItem && parentItem.subitems_exist && selectedCriterion) {
                setCriteriaMarks(prevMarks => {
                    const currentMarks = prevMarks[selectedCriterion] || 0;

                    // Get all subitem IDs for this parent item
                    const allSubitemIds = [];
                    if (parentItem.subitems) {
                        allSubitemIds.push(...parentItem.subitems.map(sub => sub.id));
                    }
                    // Include all custom items (including the new one)
                    allSubitemIds.push(...updatedCustomItems[itemId].map(custom => custom.id));

                    // Count PREVIOUSLY checked subitems for THIS parent item only
                    const previouslyCheckedForThisParent = (parentItem.subitems || []).filter(sub =>
                        checkedSubitems[itemId]?.[sub.id] || false
                    ).length + (prevCustomItems[itemId]?.length || 0);

                    // Count NEW total (after adding custom item)
                    const totalCheckedForThisParent = allSubitemIds.filter(id => {
                        // Check if it's a regular subitem that's checked
                        if (parentItem.subitems?.find(sub => sub.id === id)) {
                            return checkedSubitems[itemId]?.[id] || false;
                        }
                        // Custom items are auto-checked, so always return true
                        return true;
                    }).length;

                    // Calculate marks (max 6 marks per parent, or parentItem.marks if specified)
                    const maxMarks = parentItem.marks || 6;
                    const previousMarks = Math.min(previouslyCheckedForThisParent, maxMarks);
                    const newMarks = Math.min(totalCheckedForThisParent, maxMarks);
                    const marksDifference = newMarks - previousMarks;

                    return {
                        ...prevMarks,
                        [selectedCriterion]: Math.max(0, currentMarks + marksDifference)
                    };
                });
            }

            return updatedCustomItems;
        });

        // Clear the input field
        setCustomInputs(prev => ({
            ...prev,
            [itemId]: ''
        }));
    }, [selectedCriterion, criteria, checkedItems, checkedSubitems, customItems]);

    const deleteCustomItem = useCallback((itemId, customItemId) => {
        const targetCriterion = selectedCriterion;

        const updatedCustomItems = {
            ...customItems,
            [itemId]: customItems[itemId]?.filter(item => item.id !== customItemId) || []
        };

        setCustomItems(updatedCustomItems);

        // Update marks if this custom item was checked
        if (targetCriterion) {
            setCriteriaMarks(prevMarks => {
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
                    const remainingCustomItems = updatedCustomItems[itemId];
                    allSubitemIds.push(...remainingCustomItems.map(custom => custom.id));

                    // Count total checked subitems after deletion
                    const totalCheckedAfter = allSubitemIds.filter(id => {
                        // If it's a regular subitem that's checked
                        if (parentItem.subitems?.find(sub => sub.id === id)) {
                            return checkedSubitems[itemId]?.[id] || false;
                        }
                        // Custom items are auto-checked, so always return true
                        return true;
                    }).length;

                    // Calculate marks after
                    const marksAfter = Math.min(totalCheckedAfter, 6);

                    // Calculate new marks for this parent item (subitems only)
                    const maxMarks = parentItem.marks || 6;
                    const newSubitemMarks = Math.min(totalCheckedAfter, maxMarks);

                    // Now rebuild full criterion total properly
                    let newCriterionTotal = 0;

                    // Loop through every item in the criterion
                    const criterionObj = criteria.find(c => c.name === targetCriterion);
                    if (criterionObj) {
                        const allItems = [
                            ...(criterionObj.items || []),
                            ...(criterionObj.subcriteria?.flatMap(sub => sub.items || []) || [])
                        ];

                        for (let item of allItems) {
                            // If this is the parent item whose subitems changed
                            if (item.id === parentItem.id) {
                                newCriterionTotal += newSubitemMarks;
                            }
                            else if (item.subitems_exist) {
                                // For other subitem-type items
                                const ids = [
                                    ...(item.subitems?.map(s => s.id) || []),
                                    ...(customItems[item.id]?.map(c => c.id) || [])
                                ];

                                const count = ids.filter(id => {
                                    if (checkedSubitems[item.id]?.[id]) return true;
                                    if (checkedItems[id]) return true;
                                    return false;
                                }).length;

                                newCriterionTotal += Math.min(count, item.marks || 6);
                            }
                            else {
                                // Normal items
                                if (checkedItems[item.id]) {
                                    newCriterionTotal += item.marks || 0;
                                }
                            }
                        }
                    }

                    return {
                        ...prevMarks,
                        [targetCriterion]: newCriterionTotal
                    };

                }

                return prevMarks;
            });
        };
    }, [selectedCriterion, criteria, checkedItems, checkedSubitems, customItems]);

    // Update criteriaTotalMarks whenever criteriaMarks changes
    useEffect(() => {
        if (setCriteriaTotalMarks && typeof setCriteriaTotalMarks === 'function') {
            const newTotal = Object.values(criteriaMarks).reduce((sum, marks) => sum + marks, 0);
            setCriteriaTotalMarks(newTotal);

            // Celebration effect when criterion is completed
            if (selectedCriterion && criteriaMarks[selectedCriterion]) {
                const selectedCriterionData = criteria.find(c => c.name === selectedCriterion);
                if (selectedCriterionData) {
                    const earnedPoints = criteriaMarks[selectedCriterion];
                    const minPoints = selectedCriterionData.min_marks || 0;

                    // Check if just completed this criterion
                    if (earnedPoints >= minPoints && earnedPoints > 0) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            }
        }
    }, [criteriaMarks, setCriteriaTotalMarks, selectedCriterion, criteria]);

    useEffect(() => {
        setLoading(true);

        if (greenElements && Array.isArray(greenElements) && greenElements.length > 0) {
            const newSections = greenElements.map(item => {
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

            // Initialize checked items state for regular items only (IDs 1-18)
            const initialCheckedState = {};
            // Initialize checked subitems state separately
            const initialCheckedSubitems = {};

            newSections.forEach(criterion => {
                // Handle items at criterion level
                if (criterion.items && Array.isArray(criterion.items)) {
                    criterion.items.forEach(item => {
                        // Only add regular items to checkedItems
                        initialCheckedState[item.id] = false;

                        // Initialize subitems separately in checkedSubitems
                        if (item.subitems && Array.isArray(item.subitems) && item.subitems.length > 0) {
                            initialCheckedSubitems[item.id] = {};
                            item.subitems.forEach(subitem => {
                                initialCheckedSubitems[item.id][subitem.id] = false;
                            });
                        }
                    });
                }
                // Handle items in subcriteria
                if (criterion.subcriteria && Array.isArray(criterion.subcriteria)) {
                    criterion.subcriteria.forEach(sub => {
                        if (sub.items && Array.isArray(sub.items)) {
                            sub.items.forEach(item => {
                                // Only add regular items to checkedItems
                                initialCheckedState[item.id] = false;

                                // Initialize subitems separately in checkedSubitems
                                if (item.subitems && Array.isArray(item.subitems) && item.subitems.length > 0) {
                                    initialCheckedSubitems[item.id] = {};
                                    item.subitems.forEach(subitem => {
                                        initialCheckedSubitems[item.id][subitem.id] = false;
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
            setCheckedSubitems(initialCheckedSubitems);
        } else {
            setCriteria([]);
            setCheckedItems({});
            setCheckedSubitems({});
        }

        setLoading(false);
    }, [greenElements]);

    const renderSection = useCallback(({ item }) => {
        const isSelected = selectedCriterion === item.name;
        const earnedPoints = criteriaMarks[item.name] || 0;
        const totalPoints = item.total_marks || 0;
        const minPoints = item.min_marks || 0;
        const isCompleted = earnedPoints >= minPoints;

        return (
            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, justifyContent: 'center' }}>
                <Pressable
                    key={item.name}
                    onPress={() => handleSectionPress(item)}
                    android_ripple={{ color: '#E0F2FE' }}
                >
                    <Animated.View
                        className={`rounded-2xl overflow-hidden ${isSelected ? 'shadow-lg' : 'shadow-md'
                            }`}
                        style={{
                            backgroundColor: '#FFFFFF',
                            shadowColor: isSelected ? '#3B82F6' : '#000',
                            shadowOffset: { width: 0, height: isSelected ? 6 : 3 },
                            shadowOpacity: isSelected ? 0.2 : 0.1,
                            shadowRadius: isSelected ? 12 : 6,
                            elevation: isSelected ? 8 : 4,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                        }}
                    >
                        {/* Gradient Header */}
                        <View
                            className="px-4 py-2.5"
                            style={{ backgroundColor: isSelected ? '#1E293B' : '#F8FAFC' }}
                        >
                            <Text
                                className={`text-sm font-bold text-center leading-4 ${isSelected ? 'text-white' : 'text-slate-800'
                                    }`}
                                numberOfLines={2}
                            >
                                {item.name}
                            </Text>
                        </View>

                        {/* Content Section */}
                        <View className="px-4 py-3">
                            {/* Score Display with Label */}
                            <View className="flex-row items-center justify-center gap-2 mb-2">
                                <View
                                    className={`rounded-lg px-3 py-1.5 ${isCompleted ? 'bg-emerald-500' : 'bg-red-500'
                                        }`}
                                    style={{
                                        shadowColor: isCompleted ? '#10B981' : '#EF4444',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="text-white text-[8px] font-semibold uppercase tracking-wide">
                                        Earned
                                    </Text>
                                    <Text className="text-white text-lg font-bold text-center">
                                        {earnedPoints}
                                    </Text>
                                </View>

                                <Text className="text-slate-400 text-lg font-bold">/</Text>

                                <View
                                    className="bg-slate-800 rounded-lg px-3 py-1.5"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="text-slate-300 text-[8px] font-semibold uppercase tracking-wide">
                                        Total
                                    </Text>
                                    <Text className="text-white text-lg font-bold text-center">
                                        {totalPoints}
                                    </Text>
                                </View>
                            </View>

                            {/* Status Badge */}
                            <View className={`rounded-lg px-2.5 py-1.5 ${isCompleted ? 'bg-emerald-50 border border-emerald-200' : 'bg-orange-50 border border-orange-200'
                                }`}>
                                <View className="flex-row items-center justify-center">
                                    {isCompleted ? (
                                        <>
                                            <View className="w-3.5 h-3.5 bg-emerald-500 rounded-full items-center justify-center mr-1.5">
                                                <Text className="text-white text-[9px] font-bold">✓</Text>
                                            </View>
                                            <Text className="text-emerald-700 text-[10px] font-semibold">
                                                Completed • Minimum points required: {minPoints} pts
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <View className="w-3.5 h-3.5 bg-orange-400 rounded-full items-center justify-center mr-1.5">
                                                <Text className="text-white text-[9px] font-bold">!</Text>
                                            </View>
                                            <Text className="text-orange-700 text-[10px] font-semibold text-center" numberOfLines={1}>
                                                Need {minPoints - earnedPoints} more • Minimum points required: {minPoints} pts
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </Pressable>
            </View>
        );
    }, [selectedCriterion, handleSectionPress, criteriaMarks]);

    const renderItem = useCallback((item) => {
        const hasSubitems = item.subitems_exist && item.subitems && item.subitems.length > 0;
        const isExpanded = expandedItems[item.id] || false;

        return (
            <View key={item.id} className="mb-3">
                {/* Main Item Card */}
                <View className="flex-row items-center py-4 px-5 bg-white rounded-2xl shadow-md border-2 border-gray-100">
                    {!hasSubitems && (
                        <TouchableOpacity
                            onPress={() => handleCheckboxToggle(item.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}
                        >
                            <Checkbox
                                value={checkedItems[item.id] || false}
                                onValueChange={() => handleCheckboxToggle(item.id)}
                                color={checkedItems[item.id] ? '#10B981' : undefined}
                                className="mr-3"
                            />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        className="flex-1 mr-3"
                        onPress={() => !hasSubitems && handleCheckboxToggle(item.id)}
                        activeOpacity={hasSubitems ? 1 : 0.7}
                    >
                        <Text
                            className={`text-sm leading-5 ${hasSubitems ? 'font-bold text-gray-900' : 'text-gray-700'
                                }`}
                            style={{
                                fontWeight: hasSubitems ? '700' : (checkedItems[item.id] ? '600' : '500')
                            }}
                        >
                            {item.description}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-2">
                        {item.marks && !hasSubitems && (
                            <TouchableOpacity
                                onPress={() => handleCheckboxToggle(item.id)}
                                activeOpacity={0.7}
                                className={`px-3 py-1.5 rounded-xl shadow-sm ${checkedItems[item.id]
                                    ? 'border-emerald-500 border bg-emerald-500'
                                    : 'bg-emerald-50 border border-emerald-200'
                                    }`}
                                style={{ minWidth: 50 }}
                            >
                                <Text className={`text-xs font-bold text-center ${checkedItems[item.id] ? 'text-white' : 'text-emerald-700'
                                    }`}>
                                    {item.marks} pts
                                </Text>
                            </TouchableOpacity>
                        )}

                        {item.info && (
                            <TouchableOpacity
                                onPress={() => handleInfoGuideOpen(item.info)}
                                className="bg-blue-50 p-1.5 rounded-lg active:bg-blue-100 border border-blue-200"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="information-circle" size={14} color="#3B82F6" />
                            </TouchableOpacity>
                        )}

                        {(item.suggestions || item.esg) && (
                            <TouchableOpacity
                                onPress={() => setExpandedItems(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                }))}
                                className={`bg-amber-50 p-1.5 rounded-lg active:bg-amber-100 border border-amber-200 ${isExpanded ? 'bg-amber-200' : ''}`}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={14}
                                    color={isExpanded ? "#92400E" : "#D97706"}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Expandable Suggestions Accordion */}
                {isExpanded && (
                    <View className="ml-3 mt-3 bg-white p-5 rounded-2xl border border-amber-100">
                        {item.esg && (
                            <View className="mb-5">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-1 h-4 bg-amber-400 rounded-full mr-2" />
                                    <Text className="text-gray-900 font-semibold text-[13px]">Environmental, Social, and Governance (ESG) Sarawak</Text>
                                </View>
                                <Markdown
                                    style={{
                                        body: {
                                            color: '#374151',
                                            fontSize: 12,
                                            lineHeight: 22
                                        },
                                        bullet_list: {
                                            marginLeft: 4
                                        },
                                        list_item: {
                                            color: '#4B5563',
                                            marginBottom: 6,
                                            paddingLeft: 4
                                        },
                                        strong: {
                                            fontWeight: '600',
                                            color: '#1F2937'
                                        },
                                        em: {
                                            fontStyle: 'italic',
                                            color: '#6B7280'
                                        },
                                        paragraph: {
                                            marginTop: 0,
                                            marginBottom: 0
                                        }
                                    }}
                                >
                                    {item.esg}
                                </Markdown>
                            </View>
                        )}

                        {item.suggestions && (
                            <View className="flex-1">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-1 h-4 bg-amber-400 rounded-full mr-2" />
                                    <Text className="text-gray-900 font-semibold text-[13px]">Materials & Suggestions</Text>
                                </View>
                                <Markdown
                                    style={{
                                        body: {
                                            color: '#374151',
                                            fontSize: 12,
                                            lineHeight: 22
                                        },
                                        bullet_list: {
                                            marginLeft: 4
                                        },
                                        list_item: {
                                            color: '#4B5563',
                                            marginBottom: 6,
                                            paddingLeft: 4
                                        },
                                        strong: {
                                            fontWeight: '600',
                                            color: '#1F2937'
                                        },
                                        em: {
                                            fontStyle: 'italic',
                                            color: '#6B7280'
                                        },
                                        paragraph: {
                                            marginTop: 0,
                                            marginBottom: 0
                                        }
                                    }}
                                >
                                    {item.suggestions}
                                </Markdown>
                            </View>
                        )}
                    </View>
                )}

                {/* Subitems */}
                {hasSubitems ? (
                    <View className="ml-3 mt-2 space-y-2">
                        {item.subitems.map((subitem) => (
                            <TouchableOpacity
                                key={subitem.id}
                                className={`flex-row items-center py-3 px-4 rounded-xl border-2 ${checkedSubitems[subitem.id]
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-white border-gray-200'
                                    }`}
                                onPress={() => handleCheckboxToggle(subitem.id, item.id, "subitems")}
                                activeOpacity={0.7}
                                style={{
                                    shadowColor: checkedSubitems[item.id]?.[subitem.id] ? '#10B981' : '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: checkedSubitems[item.id]?.[subitem.id] ? 0.1 : 0.05,
                                    shadowRadius: 2,
                                    elevation: checkedSubitems[item.id]?.[subitem.id] ? 2 : 1,
                                }}
                            >
                                <Checkbox
                                    value={checkedSubitems[item.id]?.[subitem.id] || false}
                                    onValueChange={() => handleCheckboxToggle(subitem.id, item.id, "subitems")}
                                    color={checkedSubitems[item.id]?.[subitem.id] ? '#10B981' : undefined}
                                    className="mr-3"
                                />
                                <Text
                                    className="flex-1 text-sm leading-5 text-gray-700"
                                    style={{
                                        fontWeight: checkedSubitems[item.id]?.[subitem.id] ? '600' : '400'
                                    }}
                                >
                                    {subitem.description}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Custom Items */}
                        {customItems[item.id] && customItems[item.id].map((customItem) => (
                            <View
                                key={customItem.id}
                                className="flex-row items-center py-3 px-4 bg-blue-50 rounded-xl border-2 border-blue-300"
                                style={{
                                    shadowColor: '#3B82F6',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                            >
                                <View className="mr-3 bg-blue-100 rounded-md p-0.5">
                                    <Checkbox
                                        value={true}
                                        onValueChange={() => { }}
                                        color='#10B981'
                                        disabled={true}
                                    />
                                </View>
                                <Text className="flex-1 text-sm leading-5 text-gray-700 font-medium">
                                    {customItem.description}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => deleteCustomItem(item.id, customItem.id)}
                                    className="bg-red-100 p-1.5 rounded-lg active:bg-red-200"
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Add Custom Item Input */}
                        <View className="flex-row items-center py-3 px-4 mt-2 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <View className="mr-3 w-5">
                                <Ionicons name="add-circle-outline" size={20} color="#9CA3AF" />
                            </View>
                            <TextInput
                                key={`input-${item.id}`}
                                placeholder="Add custom item..."
                                value={customInputs[item.id] || ''}
                                onChangeText={(text) => handleCustomInputChange(item.id, text)}
                                onSubmitEditing={() => addCustomItem(item.id, customInputs[item.id])}
                                className="flex-1 text-sm text-gray-700 mr-2"
                                placeholderTextColor="#9CA3AF"
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={() => addCustomItem(item.id, customInputs[item.id])}
                                className="bg-emerald-500 p-2 rounded-lg shadow-sm active:bg-emerald-600"
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>
        );
    }, [checkedItems, checkedSubitems, handleCheckboxToggle, customItems, customInputs, handleCustomInputChange, addCustomItem, deleteCustomItem, expandedItems]);

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
                            <View className="px-2 py-2 rounded-lg mb-2">
                                <Text className="text-gray-700 text-lg font-bold">
                                    📍 {subcriterion.name}
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
        return <SkeletonLoader type="criteriaCards" />;
    }

    return (
        <View className="flex-1 bg-gray-100">
            {criteria.length === 0 && !loading ? (
                <View className="flex-1 justify-center items-center px-6">
                    {/* Empty State Icon */}
                    <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
                        <Ionicons name="leaf-outline" size={40} color="#52B788" />
                    </View>

                    <Text className="text-gray-900 text-xl font-bold mb-3 text-center">
                        No Green Elements Available
                    </Text>
                    <Text className="text-gray-600 text-base text-center leading-6 mb-6">
                        It looks like there are no green building elements to assess for this project configuration.
                    </Text>

                    {/* Action suggestions */}
                    <View className="bg-blue-50 p-4 rounded-xl w-full">
                        <Text className="text-blue-800 text-sm font-medium mb-2">💡 Suggestions:</Text>
                        <Text className="text-blue-700 text-sm leading-5">
                            • Check your project settings{'\n'}
                            • Verify building type selection{'\n'}
                            • Contact support if this seems incorrect
                        </Text>
                    </View>
                </View>
            ) : criteria.length !== 0 && (
                <>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View className="bg-gray-100">
                            {/* Section Header */}
                            <View className="px-5 pt-2">
                                <Text className="text-slate-800 font-bold text-base mb-0.5">Assessment Criteria</Text>
                                <Text className="text-slate-500 text-[10px]">Swipe to view all criteria</Text>
                            </View>

                            <View className="relative" style={{ height: 170 }}>
                                <FlatList
                                    ref={criteriaFlatListRef}
                                    horizontal
                                    data={criteria}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    renderItem={renderSection}
                                    style={{ height: 140 }}
                                    contentContainerStyle={{ paddingVertical: 15 }}
                                    showsHorizontalScrollIndicator={false}
                                    snapToInterval={SCREEN_WIDTH}
                                    decelerationRate="fast"
                                    snapToAlignment="center"
                                    pagingEnabled={false}
                                    onMomentumScrollEnd={(event) => {
                                        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                        setCurrentCriteriaIndex(index);
                                        if (criteria[index]) {
                                            setSelectedCriterion(criteria[index].name);
                                            // Reset vertical scroll to top
                                            verticalScrollRef.current?.scrollTo({ y: 0, animated: true });
                                        }
                                    }}
                                    bounces={false}
                                    overScrollMode="never"
                                />

                                {/* Pagination Dots */}
                                <View
                                    className="flex-row justify-center items-center gap-2 absolute left-0 right-0"
                                    style={{ bottom: 0 }}
                                >
                                    {criteria.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                criteriaFlatListRef.current?.scrollToOffset({
                                                    offset: index * SCREEN_WIDTH,
                                                    animated: true
                                                });
                                                setCurrentCriteriaIndex(index);
                                                if (criteria[index]) {
                                                    setSelectedCriterion(criteria[index].name);
                                                    // Reset vertical scroll to top
                                                    verticalScrollRef.current?.scrollTo({ y: 0, animated: true });
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                className={`h-2 rounded-full transition-all ${index === currentCriteriaIndex
                                                    ? 'w-8 bg-slate-800'
                                                    : 'w-2 bg-slate-300'
                                                    }`}
                                                style={{
                                                    shadowColor: index === currentCriteriaIndex ? '#1E293B' : 'transparent',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 3,
                                                    elevation: index === currentCriteriaIndex ? 2 : 0,
                                                }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    <View className="flex-1 pt-2">
                        <ScrollView
                            ref={verticalScrollRef}
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

                    {/* <UpdatedToastMessage visible={showToast} toastMessage={"3D model's item updated"} /> */}

                    <UpdatedToastMessage visible={showCostUpdatedToast} toastMessage={"Cost updated with certification multiplier"} />
                </>
            )}
        </View>
    );
}

export default GreenElementsScreen;