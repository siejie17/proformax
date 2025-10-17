import { View, Text, TouchableOpacity, StatusBar, ScrollView, Image, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api, { setAuthToken } from '../services/api';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthContext } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';
import MessageModal from '../components/MessageModal';

const AccountScreen = ({ navigation, route }) => {
    const { updateUser } = useContext(AuthContext);
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const snapPoints = useMemo(() => ['10%'], []);
    const bottomSheetRef = useRef(null);

    const handleProfilePicSheet = () => {
        setIsBottomSheetOpen(true);
        bottomSheetRef.current?.expand();
    }

    const handleSheetClose = (index) => {
        setIsBottomSheetOpen(index > 0);
    }

    const handleClosePress = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const imagePicking = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images!');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImageBase64 = result.assets[0].base64;

            // Close bottom sheet first
            handleClosePress();

            // Show loading overlay
            setIsUploading(true);

            try {
                // Set auth token before making API call
                await setAuthToken();

                // Make the API call with await
                const response = await api.put(`/user/update-profile-pic`, {
                    profile_pic: selectedImageBase64
                });

                if (response.data && response.data.user) {
                    // Extract updated user object from Laravel response
                    const updatedUser = response.data.user;

                    // Update AsyncStorage with new user data
                    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

                    // Update local state
                    setUserData(updatedUser);
                    updateUser(updatedUser);

                    setIsSuccessModalVisible(true);
                } else {
                    setIsErrorModalVisible(true);
                }
            } catch (error) {
                console.error('Error updating profile picture:', error);
                setIsErrorModalVisible(true);
            } finally {
                // Hide loading overlay
                setIsUploading(false);
            }
        } else {
            handleClosePress();
        }
    }

    const navigateToEditField = (field, currentValue, title) => {
        navigation.navigate('EditFieldScreen', {
            field: field,
            currentValue: currentValue,
            title: title
        });
    };

    const getProfilePicSource = (profilePic) => {
        if (profilePic) {
            return { uri: `data:image/jpeg;base64,${profilePic}` };
        }
        return require("../assets/defaultProfilePic.png");
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                await AsyncStorage.getItem('user').then((user) => {
                    if (user) {
                        setUserData(JSON.parse(user));
                    }
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Handle updates from EditFieldScreen
    useEffect(() => {
        if (route.params?.updatedField && route.params?.updatedValue) {
            const { updatedField, updatedValue } = route.params;
            const updatedUserData = {
                ...userData,
                [updatedField]: updatedValue
            };

            setUserData(updatedUserData);

            // Update AsyncStorage with the new data
            AsyncStorage.setItem('user', JSON.stringify(updatedUserData))
                .catch(error => console.error('Error saving user data to AsyncStorage:', error));

            // Clear the params to prevent re-triggering
            navigation.setParams({
                updatedField: undefined,
                updatedValue: undefined
            });
        }
    }, [route.params, userData]);

    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <GestureHandlerRootView className="flex-1">
                {/* Header */}
                <View className={`flex-row items-center justify-between px-4 ${Platform.OS === 'ios' ? 'pt-12' : 'pt-2'} pb-4`}>
                    <TouchableOpacity className="p-1" onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-[17px] font-semibold text-black">Account</Text>
                    <View className="pl-8" />
                </View>

                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Profile Picture */}
                    <View className="items-center py-5 mb-3">
                        <View className="relative">
                            <TouchableOpacity onPress={handleProfilePicSheet}>
                                <Image
                                    source={getProfilePicSource(userData.profile_pic)}
                                    className="w-28 h-28 rounded-full"
                                />
                                <View className="absolute right-0 bottom-0 w-7 h-7 rounded-full bg-gray-500 items-center justify-center border-2 border-white">
                                    <Ionicons name="camera" size={16} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View className="pb-3">
                        <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">Personal Information</Text>

                        <View className="rounded-xl shadow shadow-gray-500 mt-1">
                            <View className="pl-2 bg-white border-t border-[#F0F0F0] rounded-t-[12px]">
                                <TouchableOpacity
                                    className="flex-row items-center justify-between py-3 px-4 min-h-[44px]"
                                    onPress={() => navigateToEditField('first_name', userData.first_name, 'First Name')}
                                >
                                    <Text className="text-[16px] font-semibold text-black tracking-wide">First Name</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-[14px] text-gray-500">{userData.first_name}</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View className="pl-2 bg-white border-t border-[#F0F0F0] rounded-b-[12px]">
                                <TouchableOpacity
                                    className="flex-row items-center justify-between py-3 px-4 min-h-[44px]"
                                    onPress={() => navigateToEditField('last_name', userData.last_name, 'Last Name')}
                                >
                                    <Text className="text-[16px] font-semibold text-black tracking-wide">Last Name</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-[14px] text-gray-500">{userData.last_name}</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View className="pb-3">
                        <Text className="m-2 ml-3 text-[13px] font-medium uppercase text-[#A69F9F]">Login Information</Text>

                        <View className="rounded-xl shadow shadow-gray-500 mt-1">
                            <View className="pl-2 bg-white border-t border-[#F0F0F0] rounded-t-[12px]">
                                <View
                                    className="flex-row items-center justify-between py-3 px-4 min-h-[44px]"
                                >
                                    <Text className="text-[16px] font-semibold text-black tracking-wide">Email Address</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-[14px] text-gray-500">{userData.email}</Text>
                                        <MaterialIcons name="verified" size={20} color="green" />
                                    </View>
                                </View>
                            </View>

                            <View className="pl-2 bg-white border-t border-[#F0F0F0] rounded-b-[12px]">
                                <TouchableOpacity
                                    className="flex-row items-center justify-between py-3 px-4 min-h-[44px]"
                                    onPress={() => navigateToEditField('password', '', 'Password')}
                                >
                                    <Text className="text-[16px] font-semibold text-black tracking-wide">Update Password</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={isBottomSheetOpen ? 1 : -1}
                    enablePanDownToClose
                    snapPoints={snapPoints}
                    onChange={handleSheetClose}
                    handleIndicatorStyle={{ width: 40, height: 4, backgroundColor: '#E5E7EB', marginTop: 8 }}
                    handleStyle={{ paddingTop: 12, paddingBottom: 8, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                    style={{ flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 20 }}
                    backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 0 }}
                    enableHandlePanningGesture
                    enableOverDrag={false}
                >
                    <BottomSheetView className="flex-1 items-center px-6 pb-6">
                        <Text className="text-lg font-semibold text-[#000000] mb-6 mt-2 text-center">Profile Picture</Text>

                        <View className="items-center mb-8">
                            <Image
                                source={getProfilePicSource(userData.profile_pic)}
                                className="w-28 h-28 rounded-full mb-2 border border-gray-200"
                            />
                        </View>

                        <TouchableOpacity className="w-full bg-[#007AFF] rounded-xl p-4 items-center shadow-black shadow-md" onPress={imagePicking}>
                            <Text className="text-white font-semibold text-base">Choose New Photo</Text>
                        </TouchableOpacity>
                    </BottomSheetView>
                </BottomSheet>

                {/* Upload Loading Overlay */}
                {isUploading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
                        <View className="bg-white rounded-2xl p-6 mx-4 items-center shadow-lg">
                            <ActivityIndicator size="large" color="#007AFF" className="mb-4" />
                            <Text className="text-gray-800 text-base font-medium text-center">
                                Uploading Image...
                            </Text>
                            <Text className="text-gray-500 text-sm text-center mt-2">
                                Please wait while we update your profile picture
                            </Text>
                        </View>
                    </View>
                )}

                <MessageModal
                    isVisible={isSuccessModalVisible}
                    imgSource={require('../assets/components/success.png')}
                    onClose={() => setIsSuccessModalVisible(false)}
                    title="Success"
                    description="Profile picture updated successfully!"
                    buttonText={"Back"}
                />

                <MessageModal
                    isVisible={isErrorModalVisible}
                    imgSource={require('../assets/components/error.png')}
                    onClose={() => setIsErrorModalVisible(false)}
                    title="Error"
                    description="Failed to update profile picture. Please try again later."
                    buttonText={"Understand"}
                />
            </GestureHandlerRootView>
        </SafeAreaView>
    )
}

export default AccountScreen