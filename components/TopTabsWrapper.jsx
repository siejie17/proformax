import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from './TabBar';
import Button from './Button';

const TopBar = createMaterialTopTabNavigator();

const TopTabsWrapper = ({ title, tabs, params, onSubmit, criteriaTotalMarks = 0, mappedFormData, ...props }) => {
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

        return criteriaTotalMarks >= targetRange[0] && criteriaTotalMarks <= targetRange[1];
    })();

    const isSubmitDisabled = Boolean(hasTargetRating && !targetMet);
    const pointsNeeded = isSubmitDisabled ? certifiedScaleRange[mappedFormData.certifiedRatingScale]?.[0] - criteriaTotalMarks : 0;
    
    // Check if target is exceeded
    const targetExceeded = hasTargetRating && criteriaTotalMarks > certifiedScaleRange[mappedFormData.certifiedRatingScale]?.[1];

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
                                />
                            )}
                        </TopBar.Screen>
                    ))}
                </TopBar.Navigator>
            </View>

            {/* Submit Button Section - Minimalist Redesign (Compact) */}
            <View className="bg-white border-t rounded-tl-3xl rounded-tr-3xl border-gray-100">
                <View className="px-6 py-3">
                    {/* Score Display & Target Warning - Combined Row */}
                    <View className="mb-2.5 flex-row gap-2">
                        {/* Score Card */}
                        <View className={`flex-1 p-3 rounded-xl border ${certificationColors.border} ${certificationColors.bg}`}>
                            <Text className={`text-[10px] font-medium mb-1 ${certificationColors.text} opacity-80`}>
                                GBI Score
                            </Text>
                            <View className="flex-row items-end justify-between">
                                <Text className={`text-2xl font-bold ${certificationColors.text} leading-none`}>
                                    {criteriaTotalMarks}
                                </Text>
                                <View className={`px-2.5 py-1 rounded-md ${certificationColors.badge}`}>
                                    <Text className={`text-[10px] font-bold ${certificationColors.badgeText}`}>
                                        {certificationLevel}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Target Status Card */}
                        {hasTargetRating && (
                            <View className={`flex-1 p-3 rounded-xl border ${
                                targetMet 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-amber-50 border-amber-200'
                            }`}>
                                <Text className={`text-[10px] font-semibold mb-1 ${
                                    targetMet ? 'text-emerald-900' : 'text-amber-900'
                                }`}>
                                    Target Status
                                </Text>
                                <View className="flex-1 justify-center">
                                    {targetMet ? (
                                        <>
                                            <Text className="text-emerald-800 text-xs font-bold leading-tight mb-0.5">
                                                {targetExceeded ? '🎉 Exceeded!' : '✓ Achieved'}
                                            </Text>
                                            <Text className="text-emerald-600 text-[9px] leading-tight">
                                                {mappedFormData.certifiedRatingScale} {targetExceeded ? 'surpassed' : 'reached'}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text className="text-amber-800 text-xs font-bold leading-tight mb-0.5">
                                                +{pointsNeeded} pts needed
                                            </Text>
                                            <Text className="text-amber-600 text-[9px] leading-tight">
                                                For {mappedFormData.certifiedRatingScale}
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Submit Button - Compact */}
                    <TouchableOpacity
                        className={`${
                            isSubmitDisabled 
                                ? 'bg-gray-200 border border-gray-300' 
                                : 'bg-blue-600 border border-blue-700'
                        } rounded-xl py-3 items-center active:opacity-80`}
                        activeOpacity={1}
                        disabled={isSubmitDisabled}
                        onPress={onSubmit}
                    >
                        <Text className={`${
                            isSubmitDisabled ? 'text-gray-500' : 'text-white'
                        } text-sm font-semibold`}>
                            {isSubmitDisabled ? 'Cannot Submit' : 'Submit'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default TopTabsWrapper;