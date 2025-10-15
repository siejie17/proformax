import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SkeletonLoader = ({ type = 'criteriaCards' }) => {
    const shimmerAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = () => {
            shimmerAnimation.setValue(0);
            Animated.timing(shimmerAnimation, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }).start(() => shimmer());
        };
        shimmer();
    }, [shimmerAnimation]);

    const translateX = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    const SkeletonBox = ({ width, height, className = "" }) => (
        <View className={`bg-gray-200 rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
            <Animated.View
                className="bg-gradient-to-r from-transparent via-white/40 to-transparent h-full w-full"
                style={{
                    transform: [{ translateX }],
                }}
            />
        </View>
    );

    if (type === 'criteriaCards') {
        return (
            <View className="flex-1 bg-gray-100">
                {/* Header */}
                <View className="px-6 pt-4 pb-2">
                    <SkeletonBox width={80} height={20} className="mb-2" />
                </View>

                {/* Criteria Cards Section */}
                <View className="px-4 pt-4 pb-2">
                    <SkeletonBox width={60} height={16} className="px-2 mb-4" />
                </View>

                <View className="relative" style={{ height: 140 }}>
                    {/* Skeleton Cards */}
                    <View className="flex-row gap-4 px-5">
                        {[1, 2, 3].map((_, index) => (
                            <View
                                key={index}
                                className="bg-gray-200 rounded-3xl overflow-hidden"
                                style={{ width: SCREEN_WIDTH - 40, height: 90, minHeight: 90 }}
                            >
                                <Animated.View
                                    className="bg-gradient-to-r from-transparent via-white/40 to-transparent h-full w-full absolute"
                                    style={{
                                        transform: [{ translateX }],
                                    }}
                                />
                                {/* Card content skeleton */}
                                <View className="justify-center items-center h-full px-5">
                                    <SkeletonBox width="80%" height={16} className="mb-3" />
                                    <View className="flex-row items-center gap-2">
                                        <SkeletonBox width={40} height={24} className="rounded-full" />
                                        <SkeletonBox width={8} height={12} />
                                        <SkeletonBox width={40} height={24} className="rounded-full" />
                                    </View>
                                    <SkeletonBox width="60%" height={12} className="mt-2" />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Pagination dots skeleton */}
                    <View className="flex-row justify-center items-center gap-2 absolute -bottom-3 left-0 right-0">
                        {[1, 2, 3].map((_, index) => (
                            <SkeletonBox key={index} width={index === 0 ? 32 : 8} height={8} className="rounded-full" />
                        ))}
                    </View>
                </View>

                {/* Items list skeleton */}
                <View className="flex-1 px-5 mt-8">
                    <SkeletonBox width="40%" height={20} className="mb-4" />
                    
                    {[1, 2, 3, 4].map((_, index) => (
                        <View key={index} className="mb-4">
                            <View className="flex-row items-center py-4 px-6 bg-gray-200 rounded-xl overflow-hidden">
                                <Animated.View
                                    className="bg-gradient-to-r from-transparent via-white/40 to-transparent h-full w-full absolute"
                                    style={{
                                        transform: [{ translateX }],
                                    }}
                                />
                                <SkeletonBox width={20} height={20} className="mr-4 rounded" />
                                <View className="flex-1 mr-3">
                                    <SkeletonBox width="90%" height={16} className="mb-1" />
                                    <SkeletonBox width="70%" height={14} />
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <SkeletonBox width={50} height={24} className="rounded-full" />
                                    <SkeletonBox width={32} height={32} className="rounded-full" />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return null;
};

export default SkeletonLoader;