import { View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

const ScoreBanner = ({ criteriaTotalMarks = 0 }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Certification scale ranges
    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74], 
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    };

    // Determine certification level
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
            'Platinum': 'bg-gradient-to-r from-purple-500 to-purple-600',
            'Gold': 'bg-gradient-to-r from-yellow-500 to-yellow-600', 
            'Silver': 'bg-gradient-to-r from-gray-500 to-gray-600',
            'Certified': 'bg-gradient-to-r from-green-500 to-green-600',
            'Not Certified': 'bg-gradient-to-r from-red-500 to-red-600'
        };
        return colors[level] || colors['Not Certified'];
    };

    const certificationLevel = getCertificationLevel(criteriaTotalMarks);
    const certificationGradient = getCertificationColors(certificationLevel);

    // Pulse animation when score changes
    useEffect(() => {
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1.05,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [criteriaTotalMarks]);

    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <Animated.View 
                className={`flex-row items-center justify-between p-3 rounded-xl ${certificationGradient}`}
                style={{
                    transform: [{ scale: pulseAnim }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                }}
            >
                <View className="flex-row items-center">
                    <Text className="text-white text-lg font-bold mr-2">
                        🏆 {certificationLevel}
                    </Text>
                </View>
                
                <View className="flex-row items-center">
                    <Text className="text-white/80 text-sm mr-2">Total GBI Score:</Text>
                    <Text className="text-white text-lg font-bold">
                        {criteriaTotalMarks} pts
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
};

export default ScoreBanner;