import { View, Text, TouchableOpacity, StatusBar, Image, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const OnboardingScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 justify-between px-8 pt-16 pb-12">

                    {/* Illustration Area */}
                    <View className="items-center py-12">
                        <View className="relative w-72 h-72 items-center justify-center">

                            {/* Background decorative icons */}
                            <View className="absolute top-8 left-4 bg-emerald-100 rounded-full p-4">
                                <MaterialCommunityIcons name="office-building" size={32} color="#10b981" />
                            </View>

                            <View className="absolute top-4 right-8 bg-yellow-100 rounded-full p-3">
                                <Ionicons name="bulb" size={28} color="#f59e0b" />
                            </View>

                            <View className="absolute top-12 right-2 bg-gray-100 rounded-full p-3">
                                <Ionicons name="settings-outline" size={28} color="#6b7280" />
                            </View>

                            <View className="absolute top-24 right-0 bg-gray-200 rounded-full p-2">
                                <Ionicons name="settings-outline" size={20} color="#9ca3af" />
                            </View>

                            {/* Central illustration */}
                            <View className="bg-gray-100 rounded-full p-8 items-center justify-center w-48 h-48">
                                <Image
                                    source={require('../assets/logo/proformax-logo.png')}
                                    className="w-32 h-32"
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Bottom decorative icons */}
                            <View className="absolute bottom-12 left-2 bg-emerald-100 rounded-lg p-2">
                                <MaterialCommunityIcons name="leaf" size={24} color="#10b981" />
                            </View>

                            <View className="absolute bottom-16 left-12 bg-yellow-100 rounded-full w-8 h-8" />

                            <View className="absolute bottom-8 right-8 bg-amber-100 rounded-lg p-2">
                                <MaterialCommunityIcons name="calculator" size={24} color="#f59e0b" />
                            </View>

                            <View className="absolute bottom-4 right-16 bg-emerald-200 rounded-lg p-2">
                                <Ionicons name="trending-up" size={20} color="#059669" />
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View className="items-center mb-8">
                        <Text allowFontScaling={false} className="text-4xl font-bold text-gray-900 text-center mb-3">
                            Assess Building
                        </Text>
                        <Text allowFontScaling={false} className="text-4xl font-bold text-gray-900 text-center mb-4">
                            Sustainability
                        </Text>
                        <Text allowFontScaling={false} className="text-base text-gray-500 text-center px-4">
                            Evaluate green building compliance and optimize costs in just few minutes.
                        </Text>
                    </View>

                    {/* Buttons Section */}
                    <View className="space-y-4">
                        <TouchableOpacity
                            className="bg-emerald-500 rounded-2xl py-4 px-6 shadow-sm active:bg-emerald-600"
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text allowFontScaling={false} className="text-white text-center text-lg font-semibold">
                                Let's sign you up
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white border-2 border-emerald-500 rounded-2xl py-4 px-6 active:bg-emerald-50 mt-4"
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text allowFontScaling={false} className="text-emerald-500 text-center text-lg font-semibold">
                                I already have an account
                            </Text>
                        </TouchableOpacity>

                        {/* Footer Text */}
                        <View className="pt-4">
                            <Text allowFontScaling={false} className="text-xs text-gray-400 text-center">
                                By continuing, you agree to our{' '}
                                <Text allowFontScaling={false} className="text-gray-500 underline">Terms & Conditions</Text>
                                {' '}and{' '}
                                <Text allowFontScaling={false} className="text-gray-500 underline" onPress={() => Linking.openURL("https://myproformax.com/privacy-policy")}>Privacy Policy</Text>
                            </Text>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default OnboardingScreen;