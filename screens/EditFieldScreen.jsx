import { View, Text, TouchableOpacity, StatusBar, KeyboardAvoidingView, Alert, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updatePassword, updateUserField } from '../services/api';

import FormInputField from '../components/FormInputField';
import MessageModal from '../components/MessageModal';

const EditFieldScreen = ({ navigation, route }) => {
    const { field, currentValue, title } = route.params;

    // Regular field states
    const [editValue, setEditValue] = useState(currentValue || '');

    // Password states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const [isNormalFieldsModalVisible, setIsNormalFieldsModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

    const isPasswordField = field === 'password';

    const onUpdatedSuccessfully = () => {
        navigation.goBack();
    }

    const validatePasswords = () => {
        setPasswordError('');

        if (!newPassword || !confirmPassword) {
            setPasswordError('Both password fields are required');
            return false;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (isPasswordField) {
            await handlePasswordUpdate();
        } else {
            handleRegularFieldUpdate();
        }
    };

    const handlePasswordUpdate = async () => {
        if (!validatePasswords()) {
            return;
        }

        setIsUpdating(true);

        try {
            await updatePassword(newPassword);

            setIsPasswordModalVisible(true);
        } catch (error) {
            console.error('Error updating password:', error);
            const errorMessage = error.message || 'Failed to update password. Please try again.';
            setPasswordError(errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRegularFieldUpdate = async () => {
        if (!editValue.trim()) {
            Alert.alert('Error', 'Please enter a valid value');
            return;
        }

        setIsUpdating(true);

        try {
            await updateUserField(field, editValue.trim());

            setIsNormalFieldsModalVisible(true);
        } catch (error) {
            console.error('Error updating field:', error);
            const errorMessage = error.message || `Failed to update ${title.toLowerCase()}. Please try again.`;
            Alert.alert('Error', errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    const getPlaceholderText = () => {
        if (isPasswordField) return '';

        const placeholders = {
            first_name: 'Enter your first name',
            last_name: 'Enter your last name',
            email: 'Enter your email address'
        };

        return placeholders[field] || `Enter ${title.toLowerCase()}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View className="px-4 py-3 w-full">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="size-10 mr-4 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 pt-2 pb-6">
                    <Text className="text-gray-900 text-2xl font-bold mb-2">{isPasswordField ? 'Update Password' : `Update Your ${title}`}</Text>
                </View>

                {/* Content */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <View className="px-3">
                        {isPasswordField ? (
                            // Password update form
                            <>
                                <View className="mb-4">
                                    <FormInputField
                                        label="New Password"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Enter new password"
                                        secureTextEntry
                                        autoFocus
                                    />
                                </View>

                                <View className="mb-1">
                                    <FormInputField
                                        label="Confirm New Password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Confirm new password"
                                        secureTextEntry
                                    />
                                </View>

                                {passwordError ? (
                                    <Text className="text-red-500 text-sm mb-4 px-1">
                                        {passwordError}
                                    </Text>
                                ) : null}

                                <Text className="text-xs text-gray-500 px-4">
                                    Password must be at least 8 characters long
                                </Text>
                            </>
                        ) : (
                            // Regular field edit form
                            <>
                                <View className="mb-4">
                                    <FormInputField
                                        label={title}
                                        value={editValue}
                                        onChangeText={setEditValue}
                                        placeholder={getPlaceholderText()}
                                        autoFocus
                                        keyboardType={field === 'email' ? 'email-address' : 'default'}
                                        autoCapitalize={field === 'email' ? 'none' : 'words'}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View className="px-6 pb-6">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isUpdating}
                        className={`py-4 px-6 rounded-xl items-center ${isUpdating ? 'bg-gray-300' : 'bg-blue-600'
                            }`}
                    >
                        <Text className={`text-lg font-semibold ${isUpdating ? 'text-gray-500' : 'text-white'
                            }`}>
                            {isUpdating ? 'Updating...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <MessageModal
                isVisible={isNormalFieldsModalVisible}
                imgSource={require('../assets/components/success.png')}
                title="Success"
                description={`${title} updated successfully!`}
                buttonText="Okay"
                onClose={onUpdatedSuccessfully}
            />

            <MessageModal
                isVisible={isPasswordModalVisible}
                imgSource={require('../assets/components/success.png')}
                title="Success"
                description="Password updated successfully!"
                buttonText="Okay"
                onClose={() => navigation.goBack()}
            />
        </SafeAreaView>
    );
};

export default EditFieldScreen;