import { Animated, View, Text, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, TextInput } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from 'react-native-reanimated';

import InfoGuideModal from '../components/InfoGuideModal';
import SkeletonLoader from '../components/SkeletonLoader';
import UpdatedToastMessage from '../components/UpdatedToastMessage';
import PointsBadge from '../components/PointsBadge';
import GroupLabel from '../components/GroupLabel';
import SubitemRow from '../components/SubitemRow';
import IconButton from '../components/IconButton';
import CustomItemRow from '../components/CustomItemRow';
import AddCustomItemRow from '../components/AddCustomItemRow';

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

const GreenElementsScreen = ({ 
    greenElements, setGreenElements = () => { }, 
    criteriaTotalMarks, setCriteriaTotalMarks = () => { }, 
    criteriaMarks, setCriteriaMarks = () => { }, 
    selectedDropdowns, setSelectedDropdowns, 
    selectionMarks, setSelectionMarks, 
    checkedItems, setCheckedItems, 
    checkedOptions, setCheckedOptions, 
    checkedSubitems, setCheckedSubitems, 
    customItems, setCustomItems, 
    showCostUpdatedToast, setShowCostUpdatedToast, 
    ...otherProps 
}) => {
    const isRefreshingProject = otherProps?.isRefreshingProject || false;
    const [criteria, setCriteria] = useState([]);
    const [selectedCriterion, setSelectedCriterion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customInputs, setCustomInputs] = useState({});
    const [optionMarksTotals, setOptionMarksTotals] = useState({});
    const [activeExclusiveGroups, setActiveExclusiveGroups] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const verticalScrollRef = useRef(null);

    const [isInfoGuideVisible, setIsInfoGuideVisible] = useState(false);
    const [infoGuideText, setInfoGuideText] = useState('');
    const [infoGuideTitle, setInfoGuideTitle] = useState('Information');
    const [infoGuideLabel, setInfoGuideLabel] = useState('Guide');

    const handleInfoGuideOpen = (text, title = 'Information', label = 'Guide') => {
        setInfoGuideText(text);
        setInfoGuideTitle(title);
        setInfoGuideLabel(label);
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

    const handleCheckboxToggle = useCallback((itemId, parentId = null, itemData) => {
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

                        const totalCheckedSubitems = allSubitemIds.filter(id => {
                            if (parentId in newCheckedState && id in newCheckedState[parentId]) {
                                return newCheckedState[parentId][id];
                            }

                            if (parentId in checkedSubitems && id in checkedSubitems[parentId]) {
                                return checkedSubitems[parentId][id];
                            }

                            if (customItems[parentId]?.find(custom => custom.id === id)) {
                                return true;
                            }

                            return checkedItems[id];
                        }).length;

                        const maxMarks = maximumPoints || 6;
                        const subitemMarks = Math.min(totalCheckedSubitems, maxMarks);

                        const previousCheckedSubitems = allSubitemIds.filter(id => {
                            if (parentId in prev && id in prev[parentId]) {
                                return prev[parentId][id];
                            }

                            if (customItems[parentId]?.find(custom => custom.id === id)) {
                                return true;
                            }

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
                            if (item.subitems && item.subitems.find(sub => sub.id === itemId)) {
                                targetCriterion = criterion.name;
                                parentItem = item;
                                isSubitem = true;
                                break;
                            }

                            if (item.id === itemId) {
                                targetCriterion = criterion.name;
                                parentItem = item;
                                break;
                            }
                        }

                        if (targetCriterion) break;
                    }

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
                            const allSubitemIds = [];

                            if (parentItem.subitems) {
                                allSubitemIds.push(...parentItem.subitems.map(sub => sub.id));
                            }

                            if (customItems[parentItem.id]) {
                                allSubitemIds.push(...customItems[parentItem.id].map(custom => custom.id));
                            }

                            const totalChecked = allSubitemIds.filter(id => {
                                if (id in newCheckedState) {
                                    return newCheckedState[id];
                                }

                                return checkedSubitems[id];
                            }).length;

                            const maxMarks = parentItem.marks || 6;
                            const subitemMarks = Math.min(totalChecked, maxMarks);

                            const previousTotal = allSubitemIds.filter(id => {
                                if (id in prev) {
                                    return prev[id];
                                }

                                return checkedSubitems[id];
                            }).length;

                            const previousSubitemMarks = Math.min(previousTotal, maxMarks);
                            const marksDifference = subitemMarks - previousSubitemMarks;

                            return {
                                ...prevMarks,
                                [targetCriterion]: Math.max(0, currentMarks + marksDifference)
                            };
                        } else {
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
        }
    }, [criteria, customItems]);

    const handleOptionToggle = useCallback((itemId, optionIndex, option, criterionId) => {
        setCheckedOptions(prev => {
            const itemOptions = prev[itemId] || {};
            const isChecked = !itemOptions[optionIndex];

            return {
                ...prev,
                [itemId]: { ...itemOptions, [optionIndex]: isChecked },
            };
        });

        // Update marks after state change is batched
        const currentOptions = checkedOptions[itemId] || {};
        const wasChecked = currentOptions[optionIndex];
        const marksDelta = (option.marks || 0) * (wasChecked ? -1 : 1);

        setCriteriaMarks(prevMarks => ({
            ...prevMarks,
            [criterionId]: Math.max(0, (prevMarks[criterionId] || 0) + marksDelta),
        }));

        setOptionMarksTotals(prevTotals => ({
            ...prevTotals,
            [itemId]: Math.max(0, (prevTotals[itemId] || 0) + marksDelta),
        }));
    }, [checkedOptions]);

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

            const initialCheckedState = {};
            const initialCheckedSubitems = {};
            const initialCheckedOptions = {};

            newSections.forEach(criterion => {
                const targetCriterion = criterion.name;

                setCriteriaMarks(prevMarks => ({
                    ...prevMarks,
                    [targetCriterion]: 0
                }));

                // Handle items at criterion level
                if (criterion.items && Array.isArray(criterion.items)) {
                    criterion.items.forEach(item => {
                        // Only add regular items to checkedItems
                        initialCheckedState[item.id] = item.is_compulsory === 1 ? true : false;


                        item.is_compulsory && setCriteriaMarks(prevMarks => {
                            const currentMarks = prevMarks[targetCriterion] || 0;

                            return {
                                ...prevMarks,
                                [targetCriterion]: Math.max(0, currentMarks + item.marks)
                            };
                        });

                        const groupedOptions = item.option_groups?.flatMap(group => (
                            Array.isArray(group?.options) ? group.options : []
                        )) || [];

                        if (groupedOptions.length > 0) {
                            initialCheckedOptions[item.id] = {};
                            groupedOptions.forEach(option => {
                                initialCheckedOptions[item.id][option.id] = false;
                            });
                        }

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
                                initialCheckedState[item.id] = item.is_compulsory === 1 ? true : false;

                                item.is_compulsory && setCriteriaMarks(prevMarks => {
                                    const currentMarks = prevMarks[targetCriterion] || 0;

                                    return {
                                        ...prevMarks,
                                        [targetCriterion]: Math.max(0, currentMarks + item.marks)
                                    };
                                });

                                const groupedOptions = item.option_groups?.flatMap(group => (
                                    Array.isArray(group?.options) ? group.options : []
                                )) || [];

                                if (groupedOptions.length > 0) {
                                    initialCheckedOptions[item.id] = {};
                                    groupedOptions.forEach(option => {
                                        initialCheckedOptions[item.id][option.id] = false;
                                    });
                                }

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

            const firstCriterionName = newSections[0]?.name || (typeof newSections[0] === 'string' ? newSections[0] : null);

            setSelectedCriterion(firstCriterionName);
            setCriteria(newSections);
            setCheckedItems(initialCheckedState);
            setCheckedOptions(initialCheckedOptions);
            setCheckedSubitems(initialCheckedSubitems);
            setSelectedDropdowns({});
            setSelectionMarks({});
            setActiveExclusiveGroups({});
        } else {
            setCriteria([]);
            setCheckedItems({});
            setCheckedSubitems({});
            setSelectedDropdowns({});
            setSelectionMarks({});
            setActiveExclusiveGroups({});
        }

        setLoading(false);
    }, [greenElements]);

    // Helper function to find the criterion an item belongs to
    const findItemCriterion = useCallback((itemId) => {
        for (const criterion of criteria) {
            // Check direct items
            if (criterion.items) {
                if (criterion.items.find(item => item.id === itemId)) {
                    return criterion.name;
                }
            }
            // Check subcriteria items
            if (criterion.subcriteria) {
                for (const subcriterion of criterion.subcriteria) {
                    if (subcriterion.items && subcriterion.items.find(item => item.id === itemId)) {
                        return criterion.name;
                    }
                }
            }
        }
        return null;
    }, [criteria]);

    const buildSupplementalInfo = useCallback((item) => {
        const sections = [];

        if (item.esg) {
            sections.push(`## ESG Sarawak\n\n${item.esg}`);
        }

        if (item.suggestions) {
            sections.push(`## Materials & Suggestions\n\n${item.suggestions}`);
        }

        return sections.join('\n\n');
    }, []);

    // Custom render function for dropdown items with marks
    const renderSelectionItem = useCallback((item) => {
        return (
            <View className="flex-row items-center justify-between px-3 py-2.5">
                <Text className="flex-1 text-gray-700 font-medium text-sm">{item.description}</Text>
                <View className="bg-blue-100 px-2.5 py-1 rounded-lg ml-2">
                    <Text className="text-blue-700 font-bold text-xs">{item.marks} pts</Text>
                </View>
            </View>
        );
    }, []);

    // Custom render function for selected label
    const renderSelectedLabel = useCallback((selectedItem) => {
        if (!selectedItem) {
            return <Text>Select an option...</Text>;
        }
        return (
            <View className="flex-row items-center justify-between flex-1">
                <Text className="text-gray-900 font-semibold text-sm flex-1">{selectedItem.description}</Text>
                <View className="bg-emerald-100 px-2.5 py-1 rounded-lg ml-2">
                    <Text className="text-emerald-700 font-bold text-xs">{selectedItem.marks} pts</Text>
                </View>
            </View>
        );
    }, []);

    const renderItem = useCallback((item) => {
        const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
        const selectionGroups = Array.isArray(item.selection_groups) ? item.selection_groups : [];
        const subitems = Array.isArray(item.subitems) ? item.subitems : [];
        const itemOptions = optionGroups.flatMap(g => Array.isArray(g?.options) ? g.options : []);
        const hasOptions = itemOptions.length > 0;
        const hasSubitems = item.subitems_exist && subitems.length > 0;
        const itemSelections = selectionGroups.flatMap(g => Array.isArray(g?.selections) ? g.selections : []);
        const hasSelections = itemSelections.length > 0;
        const hasCheckbox = !hasSubitems && !hasSelections && !hasOptions;
        const isUnchanged = item.is_compulsory === 1;
        const isChecked = checkedItems[item.id] || false;

        const itemSelectionTotal =
            selectionGroups.reduce((sum, g) => sum + (selectionMarks[g.id] || 0), 0) +
            optionGroups.reduce((sum, g) => {
                return sum + g.options.reduce((s, o) => s + (checkedOptions[g.id]?.[o.id] ? o.marks : 0), 0);
            }, 0);

        const showPointsBadge = !!item.marks && hasCheckbox && !hasSelections && !hasOptions;
        const showSelectionBadge = hasSelections || hasOptions;

        return (
            <View key={item.id} className="mb-2 px-1">

                {/* ── Main Card ── */}
                <View
                    className={`bg-white rounded-xl overflow-hidden ${isChecked && hasCheckbox
                        ? 'border-l-2 border-l-emerald-400 border border-gray-100'
                        : 'border border-gray-100'
                        }`}
                    style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1 }}
                >
                    <View className="px-4 py-3.5">

                        {/* Row 1: Checkbox + Label + Badges + Actions */}
                        <View className="flex-row items-center">

                            {/* Checkbox — only for simple items */}
                            {hasCheckbox ? (
                                <TouchableOpacity
                                    onPress={isUnchanged ? undefined : () => handleCheckboxToggle(item.id)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    activeOpacity={isUnchanged ? 1 : 0.6}
                                    className="mr-3"
                                >
                                    <Checkbox
                                        value={isChecked}
                                        onValueChange={isUnchanged ? undefined : () => handleCheckboxToggle(item.id)}
                                        color={isChecked ? '#10B981' : undefined}
                                        style={{ transform: [{ scale: 0.88 }] }}
                                    />
                                </TouchableOpacity>
                            ) : null}

                            {/* Description */}
                            <TouchableOpacity
                                className="flex-1 mr-3"
                                onPress={isUnchanged ? undefined : () => hasCheckbox && handleCheckboxToggle(item.id)}
                                activeOpacity={(hasSubitems || isUnchanged) ? 1 : 0.6}
                            >
                                <Text
                                    className={`text-[13.5px] leading-[20px] ${hasSubitems ? 'text-gray-800' : isChecked ? 'text-gray-500' : 'text-gray-700'
                                        }`}
                                    style={{
                                        fontWeight: hasSubitems ? '600' : isChecked ? '400' : '450',
                                    }}
                                >
                                    {item.description}
                                </Text>
                            </TouchableOpacity>

                            {/* Right-side badges & icon actions */}
                            <View className="flex-row items-center gap-2">
                                {showPointsBadge ? (
                                    <TouchableOpacity onPress={isUnchanged ? undefined : () => handleCheckboxToggle(item.id)} activeOpacity={isUnchanged ? 1 : 0.6}>
                                        <PointsBadge points={item.marks} active={isChecked} />
                                    </TouchableOpacity>
                                ) : null}

                                {showSelectionBadge ? (
                                    <PointsBadge points={itemSelectionTotal || 0} active={itemSelectionTotal !== 0} />
                                ) : null}

                                {(item.info && !hasOptions) ? (
                                    <IconButton
                                        onPress={() => handleInfoGuideOpen(item.info, 'Information', 'Guide')}
                                        icon="information-circle-outline"
                                        color="#9CA3AF"
                                        bg="bg-gray-50"
                                        activeBg="active:bg-gray-100"
                                    />
                                ) : null}

                                {(item.suggestions || item.esg) ? (
                                    <IconButton
                                        onPress={() => handleInfoGuideOpen(buildSupplementalInfo(item), 'ESG & Suggestions', 'Details')}
                                        icon="document-text-outline"
                                        color="#F59E0B"
                                        bg="bg-amber-50"
                                        activeBg="active:bg-amber-100"
                                    />
                                ) : null}
                            </View>
                        </View>

                        {/* Option Groups */}
                        {optionGroups.map((group, gi) => (
                            <View key={`${group.id}-${gi}`} className="mt-4">
                                <GroupLabel label={group.label} accentColor="#A5B4FC" />
                                <View>
                                    {group.options?.map((option, oi) => {
                                        const isChecked = checkedOptions[group.id]?.[option.id] || false;
                                        const criterionId = findItemCriterion(item.id);
                                        return (
                                            <TouchableOpacity
                                                key={oi}
                                                className={`flex-row items-center py-2.5 px-3 rounded-lg mb-1 ${isChecked ? 'bg-emerald-50' : 'bg-gray-50'}`}
                                                onPress={() => handleOptionToggle(group.id, option.id, option, criterionId)}
                                                activeOpacity={0.6}
                                            >
                                                <Checkbox
                                                    value={isChecked}
                                                    onValueChange={() => handleOptionToggle(group.id, option.id, option, criterionId)}
                                                    color={isChecked ? '#10B981' : undefined}
                                                    style={{ transform: [{ scale: 0.82 }], marginRight: 10 }}
                                                />
                                                <Text
                                                    className={`flex-1 pr-1 text-[13px] leading-5 ${isChecked ? 'text-emerald-700' : 'text-gray-600'}`}
                                                    style={{ fontWeight: isChecked ? '500' : '400' }}
                                                >
                                                    {option?.description}
                                                </Text>
                                                <Text className={`text-[11px] font-semibold mr-2 ${isChecked ? 'text-emerald-500' : 'text-gray-300'}`}>
                                                    {option.marks} pts
                                                </Text>
                                                <IconButton
                                                    onPress={() => handleInfoGuideOpen(option.sub_description)}
                                                    icon="information-circle-outline"
                                                    color="#9CA3AF"
                                                    bg="bg-transparent"
                                                    activeBg=""
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}

                        {/* Selection Dropdown Groups */}
                        {(() => {
                            const exclusiveGroups = selectionGroups.filter(g => g.exclusive);
                            const normalGroups = selectionGroups.filter(g => !g.exclusive);

                            return (
                                <>
                                    {/* ── Normal groups (existing behaviour) ── */}
                                    {normalGroups.map((group, gi) => (
                                        <View key={`${group.id}-${gi}`} className="mt-4">
                                            <GroupLabel label={group.label} accentColor="#A5B4FC" />
                                            <Dropdown
                                                style={{
                                                    height: 44,
                                                    backgroundColor: '#F9FAFB',
                                                    borderRadius: 8,
                                                    paddingHorizontal: 12,
                                                    borderWidth: 1,
                                                    borderColor: '#E5E7EB',
                                                }}
                                                containerStyle={{
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: '#E5E7EB',
                                                    backgroundColor: '#FFFFFF',
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.06,
                                                    shadowRadius: 8,
                                                    elevation: 3,
                                                    marginTop: 2,
                                                }}
                                                itemContainerStyle={{ backgroundColor: '#FFFFFF' }}
                                                itemTextStyle={{ color: '#374151', fontSize: 13, fontWeight: '400' }}
                                                activeColor="#F3F4F6"
                                                selectedTextStyle={{ fontSize: 13, color: '#111827', fontWeight: '500' }}
                                                placeholderStyle={{ color: '#9CA3AF', fontSize: 13 }}
                                                renderRightIcon={() => (
                                                    <Ionicons
                                                        name={selectedDropdowns[group.id] ? 'chevron-up' : 'chevron-down'}
                                                        size={14}
                                                        color="#9CA3AF"
                                                    />
                                                )}
                                                data={group.selections}
                                                value={selectedDropdowns[group.id] || group.selections[0] || null}
                                                onChange={(selected) => {
                                                    const targetCriterion = findItemCriterion(item.id);
                                                    if (!targetCriterion) return;
                                                    setSelectedDropdowns(prev => ({ ...prev, [group.id]: selected }));
                                                    setSelectionMarks(prev => {
                                                        const diff = (selected?.marks || 0) - (prev[group.id] || 0);
                                                        setCriteriaMarks(p => ({ ...p, [targetCriterion]: Math.max(0, (p[targetCriterion] || 0) + diff) }));
                                                        return { ...prev, [group.id]: selected?.marks || 0 };
                                                    });
                                                }}
                                                labelField="description"
                                                valueField="id"
                                                placeholder="Select an option..."
                                                renderItem={(item) => renderSelectionItem(item)}
                                                renderSelectedLabel={(item) => renderSelectedLabel(item)}
                                                search={false}
                                                maxHeight={240}
                                            />
                                        </View>
                                    ))}

                                    {/* ── Exclusive groups: only one can be active ── */}
                                    {exclusiveGroups.length > 0 && (
                                        <View className="mt-4">
                                            {/* Section divider */}
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                marginBottom: 8,
                                            }}>
                                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                                                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                                                    SELECT ONE GROUP ONLY
                                                </Text>
                                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                                            </View>

                                            {exclusiveGroups.map((group, gi) => {
                                                const activeGroupId = activeExclusiveGroups[item.id] ?? null;
                                                const isActive = activeGroupId === group.id;

                                                return (
                                                    <View
                                                        key={`${group.id}-${gi}`}
                                                        style={{
                                                            marginBottom: 10,
                                                            borderRadius: 10,
                                                            borderWidth: 1.5,
                                                            borderColor: isActive ? '#A5B4FC' : '#E5E7EB',
                                                            backgroundColor: isActive ? '#F5F3FF' : '#F9FAFB',
                                                            padding: 10,
                                                            opacity: (!isActive && activeGroupId !== null) ? 0.45 : 1,
                                                        }}
                                                    >
                                                        {/* Radio row + label */}
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                const targetCriterion = findItemCriterion(item.id);
                                                                if (!targetCriterion) return;

                                                                if (isActive) {
                                                                    // Deselect this group — remove its marks
                                                                    const oldMarks = selectionMarks[group.id] || 0;
                                                                    setCriteriaMarks(p => ({
                                                                        ...p,
                                                                        [targetCriterion]: Math.max(0, (p[targetCriterion] || 0) - oldMarks),
                                                                    }));
                                                                    setSelectionMarks(prev => ({ ...prev, [group.id]: 0 }));
                                                                    setSelectedDropdowns(prev => ({ ...prev, [group.id]: null }));
                                                                    setActiveExclusiveGroups(prev => ({ ...prev, [item.id]: null }));
                                                                } else {
                                                                    // Switching to this group — clear previously active exclusive group's marks
                                                                    if (activeGroupId !== null) {
                                                                        const oldMarks = selectionMarks[activeGroupId] || 0;
                                                                        setCriteriaMarks(p => ({
                                                                            ...p,
                                                                            [targetCriterion]: Math.max(0, (p[targetCriterion] || 0) - oldMarks),
                                                                        }));
                                                                        setSelectionMarks(prev => ({ ...prev, [activeGroupId]: 0 }));
                                                                        setSelectedDropdowns(prev => ({ ...prev, [activeGroupId]: null }));
                                                                    }
                                                                    setActiveExclusiveGroups(prev => ({ ...prev, [item.id]: group.id }));
                                                                }
                                                            }}
                                                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                                                            activeOpacity={0.7}
                                                        >
                                                            {/* Radio indicator */}
                                                            <View style={{
                                                                width: 18,
                                                                height: 18,
                                                                borderRadius: 9,
                                                                borderWidth: 2,
                                                                borderColor: isActive ? '#818CF8' : '#D1D5DB',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: 8,
                                                            }}>
                                                                {isActive && (
                                                                    <View style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: 4,
                                                                        backgroundColor: '#818CF8',
                                                                    }} />
                                                                )}
                                                            </View>
                                                            <Text style={{
                                                                fontSize: 13,
                                                                fontWeight: '600',
                                                                color: isActive ? '#4F46E5' : '#6B7280',
                                                            }}>
                                                                {group.label}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        {/* Dropdown — disabled until this group is activated */}
                                                        <Dropdown
                                                            disable={!isActive}
                                                            style={{
                                                                height: 44,
                                                                backgroundColor: isActive ? '#FFFFFF' : '#F3F4F6',
                                                                borderRadius: 8,
                                                                paddingHorizontal: 12,
                                                                borderWidth: 1,
                                                                borderColor: isActive ? '#C7D2FE' : '#E5E7EB',
                                                            }}
                                                            containerStyle={{
                                                                borderRadius: 8,
                                                                borderWidth: 1,
                                                                borderColor: '#E5E7EB',
                                                                backgroundColor: '#FFFFFF',
                                                                shadowColor: '#000',
                                                                shadowOffset: { width: 0, height: 4 },
                                                                shadowOpacity: 0.06,
                                                                shadowRadius: 8,
                                                                elevation: 3,
                                                                marginTop: 2,
                                                            }}
                                                            itemContainerStyle={{ backgroundColor: '#FFFFFF' }}
                                                            itemTextStyle={{ color: '#374151', fontSize: 13, fontWeight: '400' }}
                                                            activeColor="#F3F4F6"
                                                            selectedTextStyle={{ fontSize: 13, color: '#111827', fontWeight: '500' }}
                                                            placeholderStyle={{ color: '#9CA3AF', fontSize: 13 }}
                                                            renderRightIcon={() => (
                                                                <Ionicons
                                                                    name={selectedDropdowns[group.id] ? 'chevron-up' : 'chevron-down'}
                                                                    size={14}
                                                                    color={isActive ? '#9CA3AF' : '#D1D5DB'}
                                                                />
                                                            )}
                                                            data={group.selections}
                                                            value={selectedDropdowns[group.id] || null}
                                                            onChange={(selected) => {
                                                                const targetCriterion = findItemCriterion(item.id);
                                                                if (!targetCriterion) return;
                                                                setSelectedDropdowns(prev => {
                                                                    let updated = { ...prev };
                                                                    // Clear other exclusive dropdowns
                                                                    selectionGroups.forEach(g => {
                                                                        if (g.exclusive && g.id !== group.id) {
                                                                            updated[g.id] = null;
                                                                        }
                                                                    });
                                                                    updated[group.id] = selected;
                                                                    return updated;
                                                                });
                                                                setSelectionMarks(prev => {
                                                                    let updatedMarks = { ...prev };
                                                                    let removedMarks = 0;
                                                                    // Reset other exclusive marks
                                                                    selectionGroups.forEach(g => {
                                                                        if (g.exclusive && g.id !== group.id) {
                                                                            removedMarks += (prev[g.id] || 0);
                                                                            updatedMarks[g.id] = 0;
                                                                        }
                                                                    });
                                                                    const newMark = selected?.marks || 0;
                                                                    const oldMark = prev[group.id] || 0;
                                                                    updatedMarks[group.id] = newMark;
                                                                    setCriteriaMarks(p => ({
                                                                        ...p,
                                                                        [targetCriterion]: Math.max(
                                                                            0,
                                                                            (p[targetCriterion] || 0) + (newMark - oldMark - removedMarks)
                                                                        ),
                                                                    }));
                                                                    return updatedMarks;
                                                                });
                                                            }}
                                                            labelField="description"
                                                            valueField="id"
                                                            placeholder="Select an option..."
                                                            renderItem={(i) => renderSelectionItem(i)}
                                                            renderSelectedLabel={(i) => renderSelectedLabel(i)}
                                                            search={false}
                                                            maxHeight={240}
                                                        />
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </View>


                {/* ── Subitems ── */}
                {hasSubitems ? (
                    <View className="mt-2 mx-1">
                        {subitems.map((subitem) => (
                            <SubitemRow
                                key={subitem.id}
                                subitem={subitem}
                                isChecked={checkedSubitems[item.id]?.[subitem.id] || false}
                                onToggle={() => handleCheckboxToggle(subitem.id, item.id, 'subitems')}
                            />
                        ))}

                        {customItems[item.id]?.map((customItem) => (
                            <CustomItemRow
                                key={customItem.id}
                                customItem={customItem}
                                onDelete={() => deleteCustomItem(item.id, customItem.id)}
                            />
                        ))}

                        <AddCustomItemRow
                            itemId={item.id}
                            value={customInputs[item.id]}
                            onChange={(text) => handleCustomInputChange(item.id, text)}
                            onSubmit={() => addCustomItem(item.id, customInputs[item.id])}
                        />
                    </View>
                ) : null}
            </View>
        );
    }, [activeExclusiveGroups, checkedItems, checkedSubitems, checkedOptions, handleCheckboxToggle, customItems, customInputs,
        handleCustomInputChange, addCustomItem, deleteCustomItem,
        selectionMarks, selectedDropdowns, findItemCriterion, renderSelectedLabel, renderSelectionItem, buildSupplementalInfo]);

    const renderCriterionItems = useCallback(() => {
        if (!selectedCriterionData) return null;

        const hasSubcriteria = selectedCriterionData.subcriteria &&
            selectedCriterionData.subcriteria.length > 0;
        const hasCriterionItems = selectedCriterionData.items &&
            selectedCriterionData.items.length > 0;

        return (
            <View className="px-5">
                {/* Render items directly if no subcriteria */}
                {(!hasSubcriteria && hasCriterionItems) ? (
                    <View className="mb-6">
                        {selectedCriterionData.items.map(item => renderItem(item))}
                    </View>
                ) : null}

                {/* Render subcriteria with their items */}
                {hasSubcriteria && selectedCriterionData.subcriteria.map((subcriterion, index) => {
                    const hasItems = subcriterion.items && subcriterion.items.length > 0;

                    if (!hasItems) return null;

                    return (
                        <View key={index} className="mb-3">
                            <View className="flex-row px-2 py-2 rounded-lg mb-2">
                                <Ionicons name="leaf-sharp" size={15} color="#10B981" style={{ paddingTop: 2, paddingLeft: 2, marginRight: 6 }} />
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

    if (loading || isRefreshingProject) {
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
                        <View className="bg-gray-100 px-6 py-2">
                            {/* Section Header */}
                            <View className="mb-1">
                                <Text className="text-slate-800 font-bold text-base mb-2">Assessment Criteria</Text>
                                <Dropdown
                                    style={{
                                        height: 52,
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 14,
                                        paddingHorizontal: 14,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                    }}
                                    containerStyle={{
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        backgroundColor: '#FFFFFF',
                                        shadowColor: '#94A3B8',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.12,
                                        shadowRadius: 12,
                                        elevation: 4,
                                        marginTop: 4,
                                        overflow: 'hidden',
                                    }}
                                    itemContainerStyle={{
                                        backgroundColor: '#FFFFFF',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F1F5F9',
                                    }}
                                    itemTextStyle={{
                                        color: '#334155',
                                        fontSize: 13,
                                        fontWeight: '500',
                                    }}
                                    activeColor="#E6E8EB"
                                    selectedTextStyle={{
                                        fontSize: 13,
                                        color: '#1E293B',
                                        fontWeight: '600',
                                    }}
                                    placeholderStyle={{
                                        color: '#CBD5E1',
                                        fontSize: 13,
                                        fontWeight: '400',
                                    }}
                                    renderLeftIcon={() => null}
                                    renderRightIcon={() => (
                                        <Ionicons name="chevron-down" size={14} color="#CBD5E1" />
                                    )}
                                    data={criteria}
                                    onChange={(item) => {
                                        handleSectionPress(item);
                                        verticalScrollRef.current?.scrollTo({ y: 0, animated: true });
                                    }}
                                    labelField="name"
                                    valueField="name"
                                    value={selectedCriterion}
                                    placeholder="Choose a criterion"
                                    search={false}
                                    maxHeight={320}
                                    renderItem={(item) => {
                                        const earned = criteriaMarks[item.name] || 0;
                                        const total = item.total_marks || 0;

                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                }}
                                            >
                                                {/* Name */}
                                                <Text
                                                    style={{
                                                        flex: 1,
                                                        color: '#1E293B',
                                                        fontSize: 13,
                                                        fontWeight: '600',
                                                        flexShrink: 1,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>

                                                {/* Score badge */}
                                                <View
                                                    style={{
                                                        backgroundColor: '#F1F5F9',
                                                        borderRadius: 8,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 3,
                                                        marginLeft: 8,
                                                        marginRight: 8
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#475569',
                                                            fontSize: 11,
                                                            fontWeight: '700',
                                                            letterSpacing: 0.3,
                                                        }}
                                                    >
                                                        {earned}/{total} pts
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    }}
                                    renderSelectedLabel={(item) => {
                                        const earned = criteriaMarks[item.name] || 0;
                                        const total = item.total_marks || 0;

                                        return (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                <Text
                                                    style={{ color: '#1E293B', fontSize: 13, fontWeight: '600', flexShrink: 1 }}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>
                                                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '500' }}>
                                                    {earned}/{total}
                                                </Text>
                                            </View>
                                        );
                                    }}
                                />

                                {/* ── Score Row (shown after a criterion is selected) ── */}
                                {selectedCriterionData && (() => {
                                    const earned = criteriaMarks[selectedCriterionData.name] || 0;
                                    const total = selectedCriterionData.total_marks || 1;
                                    const pct = Math.min(Math.round((earned / total) * 100), 100);

                                    return (
                                        <View className="flex-row items-stretch mt-3 gap-2">

                                            {/* Scored box */}
                                            <View
                                                className="flex-1 items-center justify-center py-3 rounded-2xl bg-white"
                                                style={{ borderWidth: 1, borderColor: '#E2E8F0' }}
                                            >
                                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500', letterSpacing: 0.4, marginBottom: 4 }}>
                                                    SCORED
                                                </Text>
                                                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1E293B', lineHeight: 32 }}>
                                                    {earned}
                                                </Text>
                                            </View>

                                            {/* Divider slash */}
                                            <View className="items-center justify-center" style={{ width: 20 }}>
                                                <Text style={{ fontSize: 20, color: '#CBD5E1', fontWeight: '300' }}>/</Text>
                                            </View>

                                            {/* Total box */}
                                            <View
                                                className="flex-1 items-center justify-center py-3 rounded-2xl bg-white"
                                                style={{ borderWidth: 1, borderColor: '#E2E8F0' }}
                                            >
                                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500', letterSpacing: 0.4, marginBottom: 4 }}>
                                                    TOTAL
                                                </Text>
                                                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1E293B', lineHeight: 32 }}>
                                                    {total}
                                                </Text>
                                            </View>

                                            {/* Progress box */}
                                            <View
                                                className="justify-center px-4 py-3 rounded-2xl bg-white"
                                                style={{ flex: 2, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 }}
                                            >
                                                {/* Percentage */}
                                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>
                                                    {pct}%
                                                </Text>

                                                {/* Progress bar */}
                                                <View style={{ height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                                                    <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: '#94A3B8' }} />
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    <View className="flex-1">
                        <ScrollView
                            ref={verticalScrollRef}
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 4 }}
                        >
                            {renderCriterionItems()}
                        </ScrollView>
                    </View>

                    <InfoGuideModal
                        isVisible={isInfoGuideVisible}
                        info={infoGuideText}
                        title={infoGuideTitle}
                        label={infoGuideLabel}
                        onClose={() => setIsInfoGuideVisible(false)}
                    />

                    <UpdatedToastMessage visible={showCostUpdatedToast} toastMessage={"Cost updated with certification multiplier"} />
                </>
            )}
        </View>
    );
}

export default GreenElementsScreen;

