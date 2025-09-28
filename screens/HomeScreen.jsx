import React, { useEffect, useContext } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { height: screenHeight } = Dimensions.get('window');

const HomeScreen = () => {
    const { user, loading } = useContext(AuthContext);
    const heroHeight = screenHeight * 0.59;
    const buttonSectionHeight = screenHeight * 0.41;
    const navigation = useNavigation();

    // Extract username from user object, with fallback
    const getDisplayName = () => {
        if (loading) return "Loading...";
        if (user?.first_name) return user.first_name;
        return "User";
    };

    const getProfilePicSource = (profilePic) => {
        if (profilePic) {
            return { uri: `data:image/jpeg;base64,${profilePic}` };
        }
        return require("../assets/defaultProfilePic.png");
    };


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
                <View className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

                {/* Header Content Overlay */}
                <View className="absolute top-0 left-0 right-0 pt-6 px-6">
                    <View className="flex-row items-center justify-between">
                        {/* Profile Section */}
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full mr-3 overflow-hidden border-2 border-white/30"
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={getProfilePicSource(user.profile_pic)}
                                    className="w-full h-full"
                                    style={{ resizeMode: "cover" }}
                                />
                            </TouchableOpacity>
                            <Text className="text-white text-xl font-semibold drop-shadow-lg">
                                Hello, {getDisplayName()}!
                            </Text>
                        </View>

                        {/* Notification Bell */}
                        <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center">
                            <Ionicons name="notifications" size={20} color="white" />
                            {/* Notification Badge */}
                            <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                                <Text className="text-white text-xs font-bold">3</Text>
                            </View>
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

            {/* Bottom Section with Text Content and Buttons */}
            <View
                className="bg-gray-100 px-6"
                style={{ height: buttonSectionHeight }}
            >
                {/* Welcome Text Content */}
                <View className="mb-5 px-1">
                    <Text className="text-gray-900 text-2xl font-bold mb-3">
                        Welcome to ProFormaX
                    </Text>
                    <Text className="text-gray-700 text-sm leading-5 text-justify">
                        Implementation of sustainable, green building practices can reduce your carbon footprint, lower operational costs, and create a healthier environment for everyone.
                        Self assess your new building for its green building and cost optimisation compliance now.
                    </Text>
                </View>

                {/* Predict Button */}
                <TouchableOpacity
                    className="bg-green-600 rounded-2xl py-4 items-center shadow-lg mb-2"
                    onPress={() => navigation.navigate('GBSCalculator')}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-lg font-semibold">
                        🍃 Green Building Score Calculator
                    </Text>
                </TouchableOpacity>

                {/* History Button */}
                <TouchableOpacity
                    className="bg-white border-2 border-gray-200 rounded-2xl py-4 items-center shadow-sm"
                    onPress={() => navigation.navigate('History')}
                    activeOpacity={0.8}
                >
                    <Text className="text-gray-700 text-lg font-semibold">
                        📊 View History
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;