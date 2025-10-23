import React from 'react';
import { View, Text } from 'react-native';

const DisplayField = React.memo(({ label, value, certifiedScaleRange = null }) => {
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

    const isCertifiedRating = label === "Certified Rating" && value !== null && value !== undefined && certifiedScaleRange;
    
    // Reverse map: find the rating level based on the numeric score
    let ratingLevel = null;
    if (isCertifiedRating && typeof value === 'number') {
        for (const [level, range] of Object.entries(certifiedScaleRange)) {
            if (value >= range[0] && value <= range[1]) {
                ratingLevel = level;
                break;
            }
        }
    }
    
    const colors = ratingLevel ? getCertificationColors(ratingLevel) : null;

    return (
        <View className="mb-4">
            <View className="flex-row items-center px-4 mb-2">
                <Text className="text-gray-700 text-sm font-medium">
                    {label}
                </Text>
            </View>
            {isCertifiedRating && ratingLevel && colors ? (
                <View className="bg-white mx-3 rounded-lg shadow-sm min-h-[48px] flex-row items-center justify-between">
                    <View className="flex-1 px-4 py-3">
                        <Text className="text-sm font-semibold text-gray-900">
                            {value}
                        </Text>
                    </View>
                    <View className={`${colors.badge} px-4 py-2 mr-5 rounded-xl border ${colors.border}`}>
                        <Text className={`text-sm font-semibold ${colors.badgeText}`}>
                            {ratingLevel}
                        </Text>
                    </View>
                </View>
            ) : (
                <View className="bg-white mx-3 rounded-lg shadow-sm px-4 py-3 min-h-[48px] justify-center">
                    <Text className={`text-sm ${value ? "text-gray-900" : "text-gray-400"}`}>
                        {value || '-'}
                    </Text>
                </View>
            )}
        </View>
    )
});

export default DisplayField;
