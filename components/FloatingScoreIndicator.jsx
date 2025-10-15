import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const FloatingScoreIndicator = ({ criteriaTotalMarks = 0, onPress = () => {} }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const widthAnim = useRef(new Animated.Value(60)).current;

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
            'Platinum': '#8B5CF6',
            'Gold': '#F59E0B',
            'Silver': '#6B7280', 
            'Certified': '#10B981',
            'Not Certified': '#EF4444'
        };
        return colors[level] || colors['Not Certified'];
    };

    const certificationLevel = getCertificationLevel(criteriaTotalMarks);
    const certificationColor = getCertificationColors(certificationLevel);

    // Pulse animation when score changes
    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [criteriaTotalMarks]);

    const handlePress = () => {
        setIsExpanded(!isExpanded);
        
        Animated.timing(widthAnim, {
            toValue: isExpanded ? 60 : 140,
            duration: 300,
            useNativeDriver: false,
        }).start();
        
        onPress();
    };

    return (
        <View className="absolute bottom-20 right-4 z-50">
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <Animated.View
                    className="rounded-full px-4 py-3 shadow-lg"
                    style={{
                        backgroundColor: certificationColor,
                        transform: [{ scale: scaleAnim }],
                        width: widthAnim,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <View className="flex-row items-center justify-center">
                        {!isExpanded ? (
                            <Text className="text-white text-sm font-bold">
                                {criteriaTotalMarks}
                            </Text>
                        ) : (
                            <>
                                <Text className="text-white text-xs font-semibold mr-2">
                                    {certificationLevel}
                                </Text>
                                <Text className="text-white text-sm font-bold">
                                    {criteriaTotalMarks}
                                </Text>
                            </>
                        )}
                        <View className="ml-2">
                            <Ionicons 
                                name={isExpanded ? "chevron-down" : "chevron-up"} 
                                size={16} 
                                color="white" 
                            />
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

export default FloatingScoreIndicator;