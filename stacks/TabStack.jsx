import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';

import { theme } from '../core/theme';

const Tab = createBottomTabNavigator();

const TabStack = () => {
    return (
        <View className="flex-1 bg-gray-100">
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        switch (route.name) {
                            case 'Home':
                                iconName = focused ? 'home' : 'home-outline';
                                break;
                            case 'Profile':
                                iconName = focused ? 'person' : 'person-outline';
                                break;
                        }

                        return (
                            <View style={styles.iconContainer}>
                                <Ionicons name={iconName} size={size} color={color} />
                                {focused && <View style={styles.indicator} />}
                            </View>
                        );
                    },
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.gray,
                    tabBarShowLabel: true,
                    tabBarStyle: styles.tabBar,
                    tabBarItemStyle: styles.tabBarItem,
                    tabBarLabelStyle: styles.tabBarLabel,
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Home'
                    }}
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarLabel: 'Profile'
                    }}
                />
            </Tab.Navigator>
        </View>
    )
}

export default TabStack;

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(179, 185, 196, 0.5)',
        elevation: 10,
        height: 75,
        left: 24,
        paddingBottom: 8,
        paddingHorizontal: 8,
        right: 24,
        shadowColor: 'rgba(59, 111, 201, 0.15)',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        borderBottomWidth: 0,
    },
    tabBarItem: {
        height: 52,
        marginHorizontal: 4,
        top: 5,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 4,
        marginTop: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        bottom: -15,
        width: 18,
        height: 2,
        borderRadius: 1,
        backgroundColor: theme.colors.primary,
        alignSelf: 'center',
    },
});