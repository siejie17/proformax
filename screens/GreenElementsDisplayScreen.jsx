import { Animated, View, Text, FlatList, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, Dimensions, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from 'react-native-reanimated';

import InfoGuideModal from '../components/InfoGuideModal';
import SkeletonLoader from '../components/SkeletonLoader';

// This is the default configuration
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false, // Reanimated runs in strict mode by default
});

const GreenElementsDisplayScreen = ({ greenElements, selectedProject, ...otherProps }) => {
    const [criteria, setCriteria] = useState([]);
    const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
    const [selectedCriterion, setSelectedCriterion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInfoGuideVisible, setIsInfoGuideVisible] = useState(false);
    const [infoGuideText, setInfoGuideText] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const criteriaFlatListRef = useRef(null);

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

            setSelectedCriterion(newSections[0]?.name);
            setCriteria(newSections);
        } else {
            setCriteria([]);
        }

        setLoading(false);
    }, [greenElements]);

    const calculateCumulativeMarks = useCallback((criterionData) => {
        if (!selectedProject || !criterionData) return 0;

        let totalMarks = 0;

        // Get all items in this criterion (both direct items and items in subcriteria)
        const allItems = [];
        
        if (criterionData.items && Array.isArray(criterionData.items)) {
            allItems.push(...criterionData.items);
        }
        
        if (criterionData.subcriteria && Array.isArray(criterionData.subcriteria)) {
            criterionData.subcriteria.forEach(subcriterion => {
                if (subcriterion.items && Array.isArray(subcriterion.items)) {
                    allItems.push(...subcriterion.items);
                }
            });
        }

        // Calculate marks for each item
        allItems.forEach(item => {
            const hasSubitems = item.subitems_exist && item.subitems && item.subitems.length > 0;

            if (!hasSubitems) {
                // For items without subitems: check if item.id is in checked_items
                if (selectedProject.checked_items?.includes(item.id)) {
                    totalMarks += item.marks || 0;
                }
            } else {
                // For items with subitems: calculate based on checked subitems and custom inputs
                const checkedSubitemsList = selectedProject.checked_subitems?.[item.id] || [];
                const customInputsList = selectedProject.custom_inputs?.[item.id] || [];

                // Count total: subitems (1 mark each) + custom inputs (1 mark each)
                const totalCount = checkedSubitemsList.length + customInputsList.length;

                // Limit to item.marks
                const maxMarks = item.marks || 6;
                const itemMarks = Math.min(totalCount, maxMarks);

                totalMarks += itemMarks;
            }
        });

        return totalMarks;
    }, [selectedProject]);

    const renderSection = useCallback(({ item }) => {
        const isSelected = selectedCriterion === item.name;
        const cumulativeMarks = calculateCumulativeMarks(item);
        const totalPoints = item.total_marks || 0;
        const minPoints = item.min_marks || 0;
        const isCompleted = cumulativeMarks >= minPoints;

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
                                    className={`rounded-lg px-3 py-1.5 ${isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                                        }`}
                                    style={{
                                        shadowColor: isCompleted ? '#10B981' : '#F97316',
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
                                        {cumulativeMarks}
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
                                                Completed • {minPoints} pts required
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <View className="w-3.5 h-3.5 bg-orange-400 rounded-full items-center justify-center mr-1.5">
                                                <Text className="text-white text-[9px] font-bold">!</Text>
                                            </View>
                                            <Text className="text-orange-700 text-[10px] font-semibold text-center" numberOfLines={1}>
                                                Need {minPoints - cumulativeMarks} more • {minPoints} pts required
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
    }, [selectedCriterion, handleSectionPress, calculateCumulativeMarks]);

    const renderItem = useCallback((item) => {
        const hasSubitems = item.subitems_exist && item.subitems && item.subitems.length > 0;

        // Display-only mode logic - get data from selectedProject
        let isItemChecked = false;
        let checkedSubitemsList = [];
        let customInputsList = [];

        if (selectedProject) {
            // For items without subitems: check if item.id is in checked_items
            if (!hasSubitems) {
                isItemChecked = selectedProject.checked_items?.includes(item.id) || false;
            } else {
                // For items with subitems: check checked_subitems[item.id]
                checkedSubitemsList = selectedProject.checked_subitems?.[item.id] || [];
                // Also get custom inputs for this item
                customInputsList = selectedProject.custom_inputs?.[item.id] || [];
            }
        }

        return (
            <View key={item.id} className="mb-3">
                {/* Main Item Card */}
                <View className="flex-row items-center py-4 px-5 bg-white rounded-2xl shadow-md border-2 border-gray-100">
                    {/* Display-only checkbox status */}
                    {!hasSubitems ? (
                        isItemChecked ? (
                            <MaterialCommunityIcons name="checkbox-marked" size={28} color="#10B981" />
                        ) : (
                            <MaterialCommunityIcons name="checkbox-blank-outline" size={28} color="#D1D5DB" />
                        )
                    ) : null}

                    <TouchableOpacity
                        className={`flex-1 ${!hasSubitems ? 'ml-3' : ''}`}
                        activeOpacity={1}
                    >
                        <Text
                            className={`text-sm leading-5 ${hasSubitems ? 'font-bold text-gray-900' : 'text-gray-700'
                                }`}
                            style={{
                                fontWeight: hasSubitems ? '700' : (isItemChecked ? '600' : '500')
                            }}
                        >
                            {item.description}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleInfoGuideOpen(item.info)}
                        className="bg-blue-50 p-2 rounded-xl active:bg-blue-100 border border-blue-200 ml-2"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="information-circle" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Subitems - shown in display mode */}
                {hasSubitems ? (
                    <View className="ml-3 mt-2 space-y-2">
                        {item.subitems.map((subitem) => {
                            // Check if subitem.id is in checkedSubitemsList
                            const isSubitemChecked = checkedSubitemsList.includes(subitem.id);

                            return (
                                <View
                                    key={subitem.id}
                                    className={`flex-row items-center py-3 px-4 mb-2 rounded-xl border-2 ${isSubitemChecked
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : 'bg-white border-gray-200'
                                        }`}
                                    style={{
                                        shadowColor: isSubitemChecked ? '#10B981' : '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: isSubitemChecked ? 0.1 : 0.05,
                                        shadowRadius: 2,
                                        elevation: isSubitemChecked ? 2 : 1,
                                    }}
                                >
                                    <View className="mr-3">
                                        {isSubitemChecked ? (
                                            <MaterialCommunityIcons name="checkbox-marked" size={28} color="#10B981" />
                                        ) : (
                                            <MaterialCommunityIcons name="checkbox-blank-outline" size={28} color="#D1D5DB" />
                                        )}
                                    </View>
                                    <Text
                                        className="flex-1 text-sm leading-5 text-gray-700"
                                        style={{
                                            fontWeight: isSubitemChecked ? '600' : '400'
                                        }}
                                    >
                                        {subitem.description}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Custom Inputs - Display Only Mode */}
                        {customInputsList && customInputsList.length > 0 && (
                            <View className="mt-2">
                                <Text className="text-xs font-semibold text-gray-500 mb-2 px-2">CUSTOM ENTRIES</Text>
                                {customInputsList.map((customInput, index) => (
                                    <View
                                        key={`custom-${item.id}-${index}`}
                                        className="flex-row items-center py-3 px-4 bg-blue-50 rounded-xl border-2 border-blue-300 mb-2"
                                        style={{
                                            shadowColor: '#3B82F6',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                    >
                                        <View className="mr-3 bg-blue-100 rounded-md p-0.5">
                                            <MaterialCommunityIcons name="checkbox-marked" size={20} color="#10B981" />
                                        </View>
                                        <Text className="flex-1 text-sm leading-5 text-gray-700 font-medium">
                                            {customInput}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}
            </View>
        );
    }, [selectedProject]);

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
                        It looks like there are no green building elements to display for this project.
                    </Text>

                    {/* Info message */}
                    <View className="bg-blue-50 p-4 rounded-xl w-full">
                        <Text className="text-blue-800 text-sm font-medium mb-2">ℹ️ Information:</Text>
                        <Text className="text-blue-700 text-sm leading-5">
                            This is a display-only view of green elements assessment. No edits can be made here.
                        </Text>
                    </View>
                </View>
            ) : criteria.length !== 0 && selectedProject && (
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

export default GreenElementsDisplayScreen;
