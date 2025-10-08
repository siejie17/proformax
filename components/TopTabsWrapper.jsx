import { View, Text, StatusBar } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from './TabBar';

const TopBar = createMaterialTopTabNavigator();

const TopTabsWrapper = ({ title, tabs, params, ...props }) => {
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <View className="px-6 pt-6 pb-2">
                <Text className="text-gray-900 text-2xl font-bold mb-2">{title}</Text>
            </View>

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
                                {...screenProps}
                                {...params}
                                {...props}
                            />
                        )}
                    </TopBar.Screen>
                ))}
            </TopBar.Navigator>
        </SafeAreaView>
    )
}

export default TopTabsWrapper;