import React, { useEffect, useContext, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { height: screenHeight } = Dimensions.get('window');

const HomeScreen = () => {
    const { user, loading } = useContext(AuthContext);
    const heroHeight = screenHeight * 0.46; // Reduced to make room for content
    const navigation = useNavigation();

    const [notifications] = useState([
        { id: 1, title: 'Assessment Complete', message: 'Your green building score is ready', time: '2h ago', read: false },
        { id: 2, title: 'New Feature', message: 'Cost breakdown analysis now available', time: '1d ago', read: false },
        { id: 3, title: 'Reminder', message: 'Complete your pending assessment', time: '3d ago', read: true }
    ]);

    // Animation values
    const cardAnimation = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.stagger(100, [
            Animated.timing(cardAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Extract username from user object, with fallback
    const getDisplayName = () => {
        if (loading) return "Loading...";
        if (user?.first_name) return user.first_name;
        return "User";
    };

    const getProfilePicSource = (profilePic = null) => {
        if (profilePic) {
            return { uri: `data:image/jpeg;base64,${profilePic}` };
        }
        return require("../assets/defaultProfilePic.png");
    };

    // Enhanced navigation functions with haptic feedback
    const navigateWithHaptic = (screenName) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate(screenName);
    };

    const handleNotificationPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Notifications');
    };

    const QuickActionButton = ({ icon, title, description, onPress, gradient = false }) => (
        <Animated.View
            style={{
                opacity: cardAnimation,
                transform: [{
                    translateY: cardAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                    })
                }]
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                className={`rounded-2xl p-5 shadow-lg mb-3 ${gradient ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-white border-2 border-gray-200'
                    }`}
            >
                <View className="flex-row items-center">
                    <View
                        className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${gradient ? 'bg-white/20' : 'bg-green-50'
                            }`}
                    >
                        <Ionicons
                            name={icon}
                            size={24}
                            color={gradient ? "white" : "#52B788"}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className={`text-lg font-semibold mb-1 ${gradient ? 'text-white' : 'text-gray-900'
                            }`}>
                            {title}
                        </Text>
                        <Text className={`text-sm ${gradient ? 'text-green-100' : 'text-gray-600'
                            }`}>
                            {description}
                        </Text>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={gradient ? "white" : "#9CA3AF"}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Hero Section with Image */}
            <View
                className="relative"
                style={{ height: heroHeight }}
            >
                {/* Background Image */}
                <Image
                    source={require('../assets/home.jpg')}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                />

                {/* Enhanced Gradient Overlay for better text readability */}
                <View className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

                {/* Header Content Overlay */}
                <View className="absolute top-0 left-0 right-0 pt-6 px-6">
                    <View className="flex-row items-center justify-between">
                        {/* Profile Section */}
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                className="w-12 h-12 rounded-full mr-3 overflow-hidden border-2 border-white/30 shadow-lg"
                                onPress={() => navigateWithHaptic('Profile')}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={getProfilePicSource(user?.profile_pic)}
                                    className="w-full h-full"
                                    style={{ resizeMode: "cover" }}
                                />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-white text-lg font-semibold drop-shadow-lg">
                                    Hello, {getDisplayName()}!
                                </Text>
                                <Text className="text-white/80 text-sm">
                                    Ready to assess your project?
                                </Text>
                            </View>
                        </View>

                        {/* Enhanced Notification Bell */}
                        <TouchableOpacity
                            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center shadow-lg"
                            onPress={handleNotificationPress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="notifications" size={22} color="white" />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <Animated.View
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center border-2 border-white"
                                    style={{
                                        transform: [{
                                            scale: cardAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 1]
                                            })
                                        }]
                                    }}
                                >
                                    <Text className="text-white text-xs font-bold">
                                        {notifications.filter(n => !n.read).length}
                                    </Text>
                                </Animated.View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Curved Bottom Corners */}
                <View className="absolute bottom-0 left-0 right-0">
                    <View
                        className="bg-gray-100 h-8"
                        style={{
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                        }}
                    />
                </View>
            </View>

            {/* Enhanced Content Section with ScrollView */}
            <ScrollView
                className="flex-1 bg-gray-100"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Welcome Message */}
                <Animated.View
                    className="px-6 pb-6"
                    style={{
                        opacity: cardAnimation,
                        transform: [{
                            translateY: cardAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }]
                    }}
                >
                    <View className="rounded-2xl px-1">
                        <Text className="text-gray-900 text-2xl font-bold mb-3">
                            Welcome to ProFormaX
                        </Text>
                        <Text className="text-gray-700 text-sm leading-5 text-justify">
                            Implementation of sustainable, green building practices can reduce your carbon footprint, lower operational costs, and create a healthier environment for everyone.
                            Self assess your new building for its green building and cost optimisation compliance now.
                        </Text>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <View className="px-6 pb-4">
                    <Text className="text-gray-900 text-lg font-bold mb-4">📍 Quick Actions</Text>

                    <QuickActionButton
                        icon="leaf"
                        title="New Assessment"
                        description="Start green building score calculator"
                        onPress={() => navigateWithHaptic('GBSCalculator')}
                    // gradient={true}
                    />

                    <QuickActionButton
                        icon="analytics"
                        title="View History"
                        description="Browse past assessments and results"
                        onPress={() => navigateWithHaptic('History')}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;