import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Image, Alert } from 'react-native';
import { useContext, useCallback, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';

import { AuthContext } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';

const ProfileScreen = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [settings, setSettings] = useState({
        emailNotifications: false,
        pushNotifications: false,
    });
    const navigation = useNavigation();

    const { user, loading, logout } = useContext(AuthContext);

    useFocusEffect(
        useCallback(() => {

            const fetchUserProfile = async () => {
                try {
                    setIsLoading(true);
                    const userId = user.id;
                    
                    // Fetch user profile
                    const response = await api.get(`/users/${userId}`);
                    const apiData = response.data.user;
                    setCurrentUser(apiData);

                    // Fetch preferences
                    const preferencesResponse = await api.get(`/users/${userId}/preferences`);
                    const preferencesData = preferencesResponse.data.preferences;
  
                    setSettings({
                        emailNotifications: Boolean(preferencesData.email_notifications),
                        pushNotifications: Boolean(preferencesData.push_notifications),
                    });
                } catch (error) {
                    console.error('Error fetching user profile or preferences:', error);
                    console.error('Error details:', error.response?.data);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUserProfile();
        }, [user])
    );

    const getProfilePicSource = (profilePic) => {
        if (profilePic) {
            return { uri: `data:image/jpeg;base64,${profilePic}` };
        }
        return require("../assets/defaultProfilePic.png");
    };

    /**
     * Handle preference switch changes
     * Updates both local state and database
     */
    const handlePreferenceChange = async (preferenceKey, value) => {
        // Update local state immediately for better UX
        setSettings({ ...settings, [preferenceKey]: value });
        setIsUpdating(true);

        try {
            // Map preference keys to API field names
            const fieldMapping = {
                emailNotifications: 'email_notifications',
                pushNotifications: 'push_notifications'
            };

            const fieldName = fieldMapping[preferenceKey];

            if (!fieldName) {
                console.error('Unknown preference key:', preferenceKey);
                return;
            }

            // Ensure auth token is set
            const token = await AsyncStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            const userId = user.id;

            // Update preference in database
            await api.patch(`/users/${userId}/preferences`, {
                [fieldName]: value
            });
        } catch (error) {
            console.error('Error updating preference:', error);
            
            // Revert the state change on error
            setSettings({ ...settings, [preferenceKey]: !value });
            
            Alert.alert(
                'Error',
                'Failed to update preference. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsUpdating(false);
        }
    };

    const _onLogoutPressed = async () => {
        setIsLoading(true);

        try {
            await api.post('/logout');

            delete api.defaults.headers.common['Authorization'];
        } catch (err) {
            console.error(err);
        } finally {
            logout();
            setIsLoading(false);
        }
    }

    if (loading || isLoading || !currentUser || !settings) {
        return (
            <LoadingIndicator />
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100 px-1">
            <View className="items-center py-4">
                <Text numberOfLines={1} className="text-[19px] font-semibold">
                    Profile
                </Text>
            </View>

            <ScrollView className="flex-1 px-4">
                <View className="pb-3">
                    <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">Account</Text>

                    <View className="rounded-xl shadow shadow-gray-500">
                        <View className="p-3 bg-white rounded-xl">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Account', { userId: currentUser?.id })}
                                className="items-center justify-start flex-row"
                            >
                                <Image
                                    alt="Profile Picture"
                                    source={getProfilePicSource(currentUser?.profile_pic || null)}
                                    className="size-16 rounded-full mr-4 border border-gray-300"
                                    style={{ resizeMode: "cover" }}
                                />

                                <View className="mr-auto">
                                    <Text className="text-[16px] font-semibold text-[#292929]">{currentUser?.first_name} {currentUser?.last_name}</Text>
                                    <Text className="text-[14px] mt-1 text-[#858585] font-normal">{currentUser?.email}</Text>
                                </View>

                                <Ionicons name="chevron-forward" size={22} color="#BCBCBC" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="py-3 pt-2">
                    <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">Navigation</Text>

                    <View className="pl-4 bg-white border border-[#F0F0F0] rounded-xl shadow shadow-gray-500">
                        <TouchableOpacity
                            onPress={() => navigation.navigate('History')}
                            style={styles.row}
                        >
                            <Text className="text-[16px] font-semibold text-black">History</Text>

                            <View className="flex-grow flex-shrink basis-0" />

                            <Ionicons name="chevron-forward" size={19} color="#BCBCBC" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="py-3 pt-2">
                    <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">Preferences</Text>

                    <View className="rounded-xl shadow shadow-gray-500">
                        {/* <View className="pl-4 bg-white border-t border-[#F0F0F0] rounded-t-[12px]">
                            <View className="height-[44px] w-full flex-row justify-start items-center pr-3">
                                <Text className="text-[16px] font-semibold text-black tracking-wide">Dark Mode</Text>

                                <View className="flex-grow flex-shrink basis-0" />

                                <Switch
                                    value={settings.darkMode}
                                    onValueChange={(value) => setSettings({ ...settings, darkMode: value })}
                                    style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                                />
                            </View>
                        </View> */}

                        <View className="pl-4 bg-white border-t border-[#F0F0F0] rounded-t-[12px]">
                            <View className="h-[44px] w-full flex-row justify-start items-center pr-3">
                                <Text className="text-[16px] font-semibold text-black tracking-wide">Push Notifications</Text>

                                <View className="flex-grow flex-shrink basis-0" />

                                <Switch
                                    value={settings.pushNotifications}
                                    onValueChange={(value) => handlePreferenceChange('pushNotifications', value)}
                                    disabled={isUpdating}
                                    style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                                    thumbColor={settings.pushNotifications ? "#f5dd4b" : "#f4f3f4"}
                                    ios_backgroundColor="#3e3e3e"
                                />
                            </View>
                        </View>

                        <View className="pl-4 bg-white border-t border-[#F0F0F0] rounded-b-[12px]">
                            <View className="h-[44px] w-full flex-row justify-start items-center pr-3">
                                <Text className="text-[16px] font-semibold text-black tracking-wide">Email Notifications</Text>

                                <View className="flex-grow flex-shrink basis-0" />

                                <Switch
                                    value={settings.emailNotifications}
                                    onValueChange={(value) => handlePreferenceChange('emailNotifications', value)}
                                    disabled={isUpdating}
                                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                                    thumbColor={settings.emailNotifications ? "#f5dd4b" : "#f4f3f4"}
                                    ios_backgroundColor="#3e3e3e"
                                    style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                <View className="py-3 pt-2">
                    <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">More</Text>

                    <View className="rounded-[12px] shadow shadow-gray-500">
                        <View className="pl-4 bg-white border-t border-[#F0F0F0] rounded-t-[12px]">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('About')}
                                style={styles.row}
                            >
                                <Text className="text-[16px] font-semibold text-black">About Us</Text>

                                <View className="flex-grow flex-shrink basis-0" />

                                <Ionicons name="chevron-forward" size={19} color="#BCBCBC" />
                            </TouchableOpacity>
                        </View>

                        <View className="pl-4 bg-white border-t border-[#F0F0F0] rounded-b-[12px]">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Team')}
                                style={styles.row}
                            >
                                <Text className="text-[16px] font-semibold text-black">Our Team</Text>

                                <View className="flex-grow flex-shrink basis-0" />

                                <Ionicons name="chevron-forward" size={19} color="#BCBCBC" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="py-3 mt-4">
                    <View className="rounded-xl shadow shadow-gray-500 bg-white">
                        <View className="py-4 bg-white border-t border-[#F0F0F0] rounded-[12px] items-center">
                            <TouchableOpacity
                                onPress={_onLogoutPressed}
                                disabled={isLoading}
                                className="h-[20px] w-full items-center justify-start pr-3 flex-row"
                            >
                                <Text className="text-[16px] font-semibold text-[#DC2626] tracking-wide text-center w-full">Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Text className="mt-6 text-[13px] text-center font-medium text-[#A69F9F]">Developed by FCSIT & FBE UNIMAS</Text>
            </ScrollView>
        </SafeAreaView>
    )
}

export default ProfileScreen;

const styles = StyleSheet.create({
    row: {
        height: 44,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingRight: 12,
    }
});