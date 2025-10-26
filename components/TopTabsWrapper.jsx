import { View, Text, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import TabBar from './TabBar';

const TopBar = createMaterialTopTabNavigator();

const TopTabsWrapper = ({ title, tabs, params, onSubmit, criteriaTotalMarks = 0, mappedFormData, submitLoading, newProjectCosts, ...props }) => {
    // Certification scale ranges
    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74],
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    };

    // Determine certification level based on total marks
    const getCertificationLevel = (marks) => {
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (marks >= range[0] && marks <= range[1]) {
                return level;
            }
        }
        return 'Not Certified';
    };

    // Get certification colors
    const getCertificationColors = (level) => {
        const colors = {
            'Platinum': { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-white', badge: 'bg-slate-100', badgeText: 'text-slate-900' },
            'Gold': { bg: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-white', badge: 'bg-yellow-50', badgeText: 'text-yellow-900' },
            'Silver': { bg: 'bg-slate-400', border: 'border-slate-300', text: 'text-white', badge: 'bg-slate-50', badgeText: 'text-slate-900' },
            'Certified': { bg: 'bg-emerald-600', border: 'border-emerald-500', text: 'text-white', badge: 'bg-emerald-50', badgeText: 'text-emerald-900' },
            'Not Certified': { bg: 'bg-red-600', border: 'border-red-500', text: 'text-white', badge: 'bg-red-50', badgeText: 'text-red-900' }
        };
        return colors[level] || colors['Not Certified'];
    };

    const certificationLevel = getCertificationLevel(criteriaTotalMarks);
    const certificationColors = getCertificationColors(certificationLevel);

    // Check if target certification is met
    const hasTargetRating = mappedFormData && mappedFormData.certifiedRatingScale;
    const targetMet = !hasTargetRating || (() => {
        const targetRating = mappedFormData.certifiedRatingScale;
        const targetRange = certifiedScaleRange[targetRating];

        if (!targetRange) {
            return true;
        }

        return criteriaTotalMarks >= targetRange[0];
    })();

    // Check if newProjectCosts is empty for Detailed cost preview
    const isCostBreakdownEmpty = mappedFormData?.costPreviewWay === 'Detailed' && 
        (!newProjectCosts || 
         Object.keys(newProjectCosts).length === 0 ||
         !newProjectCosts?.cost_breakdown || 
         Object.keys(newProjectCosts?.cost_breakdown).length === 0);

    const isSubmitDisabled = !targetMet || isCostBreakdownEmpty;
    const pointsNeeded = (hasTargetRating && !targetMet) ? certifiedScaleRange[mappedFormData.certifiedRatingScale]?.[0] - criteriaTotalMarks : 0;

    useEffect(() => {
        // You can add any side effects here if needed
        console.log(isSubmitDisabled);
    }, []);
    
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <View className="px-6 pt-6 pb-2">
                <Text className="text-gray-900 text-2xl font-bold mb-2">{title}</Text>
            </View>

            <View className="flex-1">
                <TopBar.Navigator
                    tabBar={props => <TabBar {...props} />}
                    screenOptions={{
                        tabBarActiveTintColor: '#1E40AF',
                        tabBarInactiveTintColor: '#6B7280',
                        tabBarStyle: {
                            elevation: 0,
                            shadowOpacity: 0,
                        },
                        swipeEnabled: false,
                        lazy: true,
                        lazyPreloadDistance: 1,
                    }}
                >
                    {tabs.map((tab, index) => (
                        <TopBar.Screen key={index} name={tab.name} options={tab.options}>
                            {(screenProps) => (
                                <tab.component
                                    {...params}
                                    {...props}
                                    mappedFormData={mappedFormData}
                                    newProjectCosts={newProjectCosts}
                                />
                            )}
                        </TopBar.Screen>
                    ))}
                </TopBar.Navigator>
            </View>

            {/* Submit Button Section */}
            <View className="bg-white border-t border-gray-200 shadow-lg rounded-t-3xl">
                <View className="px-6 py-3 pt-4">
                    {/* GBI Score Indicator - Compact */}
                    <View className="px-1 mb-3 flex-row items-center justify-between">
                        <Text className="text-gray-600 text-sm font-medium">GBI Score</Text>
                        <View className="flex-row items-center gap-1.5">
                            <View className="bg-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
                                <Text className="text-white text-[12px] font-bold">
                                    {criteriaTotalMarks} pts
                                </Text>
                            </View>
                            <View className={`px-2.5 py-1 rounded-lg shadow-sm border ${certificationColors.border} ${certificationColors.bg}`}>
                                <Text className={`text-[12px] font-bold ${certificationColors.text}`}>
                                    {certificationLevel}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Target Warning - Compact */}
                    {hasTargetRating && !targetMet && (
                        <View className="mb-2.5 px-3 py-2 bg-orange-50 rounded-xl border border-orange-200">
                            <View className="flex-row items-center justify-between mb-0.5">
                                <Text className="text-orange-800 text-[10px] font-semibold">
                                    Target Not Met
                                </Text>
                                <Text className="text-orange-700 text-[10px] font-bold">
                                    +{pointsNeeded} pts needed
                                </Text>
                            </View>
                            <Text className="text-orange-600 text-[9px]">
                                Target: {mappedFormData.certifiedRatingScale} • {certifiedScaleRange[mappedFormData.certifiedRatingScale]?.[0]}-{certifiedScaleRange[mappedFormData.certifiedRatingScale]?.[1]} pts
                            </Text>
                        </View>
                    )}

                    {/* Target Met - Compact */}
                    {hasTargetRating && targetMet && (
                        <View className="mb-2.5 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-4 h-4 bg-emerald-500 rounded-full items-center justify-center mr-2">
                                        <Text className="text-white text-xs font-bold">✓</Text>
                                    </View>
                                    <Text className="text-emerald-700 text-[10px] font-semibold">
                                        Target Achieved
                                    </Text>
                                </View>
                                <Text className="text-emerald-600 text-[9px]">
                                    {mappedFormData.certifiedRatingScale} reached
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Cost Breakdown Empty Warning - Detailed Preview */}
                    {isCostBreakdownEmpty && (
                        <View className="mb-2.5 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-4 h-4 bg-red-500 rounded-full items-center justify-center mr-2">
                                        <Text className="text-white text-xs font-bold">!</Text>
                                    </View>
                                    <Text className="text-red-700 text-[10px] font-semibold">
                                        Cost Breakdown Required
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-red-600 text-[9px] mt-1">
                                Please add at least one cost item to proceed
                            </Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 w-full items-center shadow-md transition-colors ${isSubmitDisabled
                                ? 'bg-gray-300'
                                : submitLoading
                                ? 'bg-gray-700 opacity-90'
                                : 'bg-gray-800'
                            }`}
                        activeOpacity={submitLoading ? 1 : 0.8}
                        disabled={isSubmitDisabled || submitLoading}
                        onPress={onSubmit}
                    >
                        <View className="flex-row items-center justify-center gap-2">
                            {submitLoading && (
                                <ActivityIndicator 
                                    size="small" 
                                    color="#FFFFFF" 
                                    style={{ marginRight: 4 }}
                                />
                            )}
                            <Text className={`text-sm font-bold ${isSubmitDisabled ? 'text-gray-500' : submitLoading ? 'text-white opacity-90' : 'text-white'
                                }`}>
                                {submitLoading ? 'Submitting...' : 'Submit Assessment'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default TopTabsWrapper;