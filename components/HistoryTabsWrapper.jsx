import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import TabBar from './TabBar';
import AIButton from './AIButton';
import { useState } from 'react';
import AIAssistantWrapper from './AIAssistantWrapper';

const TopBar = createMaterialTopTabNavigator();

const HistoryTabsWrapper = ({ title, tabs, params, navigation, ...props }) => {
    const [aiModalVisible, setAIModalVisible] = useState(false);
    
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            {/* Header */}
            <View className="px-4 py-2 w-full flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="size-10 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View className="px-5 pt-1.5">
                        <Text className="text-gray-900 text-2xl font-bold mb-2">{title}</Text>
                    </View>
                </View>

                <View>
                    <AIButton onPress={() => setAIModalVisible(true)} />
                </View>
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

            <AIAssistantWrapper isVisible={aiModalVisible} onClose={() => setAIModalVisible(false)} />
        </SafeAreaView>
    )
}

export default HistoryTabsWrapper;