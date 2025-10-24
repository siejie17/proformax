import { View, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, Image, Alert, StatusBar, ScrollView, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import api from '../services/api';

import TextInput from '../components/TextInput';
import MessageModal from '../components/MessageModal';
import BackButton from '../components/BackButton';

const RegisterScreen = () => {
    const [firstName, setFirstName] = useState({ value: '', error: '' });
    const [lastName, setLastName] = useState({ value: '', error: '' });
    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const navigation = useNavigation();

    const validateFields = () => {
        let valid = true;

        if (!firstName.value.trim()) {
            setFirstName({ ...firstName, error: 'First name is required' });
            valid = false;
        }

        if (!lastName.value.trim()) {
            setLastName({ ...lastName, error: 'Last name is required' });
            valid = false;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!email.value.trim()) {
            setEmail({ ...email, error: 'Email is required' });
            valid = false;
        } else if (!emailRegex.test(email.value)) {
            setEmail({ ...email, error: 'Invalid email format' });
            valid = false;
        }

        if (!password.value) {
            setPassword({ ...password, error: 'Password is required' });
            valid = false;
        } else if (password.value.length < 6) {
            setPassword({ ...password, error: 'Password must be at least 6 characters' });
            valid = false;
        }

        if (!confirmPassword.value) {
            setConfirmPassword({ ...confirmPassword, error: 'Confirm password is required' });
            valid = false;
        } else if (confirmPassword.value !== password.value) {
            setConfirmPassword({ ...confirmPassword, error: 'Passwords do not match' });
            valid = false;
        }

        return valid;
    };

    const _onSignUpPressed = async () => {
        if (!validateFields()) return;

        setLoading(true);

        try {
            const response = await api.post('/register', {
                first_name: firstName.value,
                last_name: lastName.value,
                email: email.value,
                password: password.value,
                password_confirmation: confirmPassword.value, // Laravel requires "_confirmation"
            });

            const { message, token, user } = response.data;

            // ✅ Store token & user globally
            await AsyncStorage.setItem("token", token);
            await AsyncStorage.setItem("user", JSON.stringify(user));

            setSuccessModalVisible(true);
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;

                if (errors?.first_name) setFirstName({ ...firstName, error: errors.first_name[0] });
                if (errors?.last_name) setLastName({ ...lastName, error: errors.last_name[0] });
                if (errors?.email) setEmail({ ...email, error: errors.email[0] });
                if (errors?.password) setPassword({ ...password, error: errors.password[0] });

                Alert.alert('Error', error.response.data.message || 'Validation failed');
            } else {
                Alert.alert('Error', 'Network error, please try again');
            }
        } finally {
            setLoading(false);
        }
    }

    const closeSuccessModal = () => {
        setSuccessModalVisible(false);
        navigation.replace("Login");
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <BackButton goBack={() => navigation.goBack()} />
                    <KeyboardAvoidingView
                        className="flex-1 justify-center px-8 py-12"
                        behavior="padding"
                    >
                        {/* Logo */}
                        <View className="items-center mb-8">
                            <Image
                                source={require('../assets/logo/proformax-logo.png')}
                                className="w-40 h-40"
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title */}
                        <View className="items-center mb-8">
                            <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                                Let's Sign Up
                            </Text>
                            <Text className="text-base text-gray-500 text-center">
                                Create your account to get started
                            </Text>
                        </View>

                        <View className="px-2">
                            <TextInput
                                label="First Name"
                                returnKeyType="next"
                                value={firstName.value}
                                onChangeText={text => setFirstName({ value: text, error: '' })}
                                errorText={firstName.error}
                                disabled={loading}
                                required
                            />

                            <TextInput
                                label="Last Name"
                                returnKeyType="next"
                                value={lastName.value}
                                onChangeText={text => setLastName({ value: text, error: '' })}
                                errorText={lastName.error}
                                disabled={loading}
                                required
                            />

                            <TextInput
                                label="Email Address"
                                returnKeyType="next"
                                value={email.value}
                                onChangeText={text => setEmail({ value: text, error: '' })}
                                errorText={email.error}
                                autoCapitalize="none"
                                autoCompleteType="email"
                                textContentType="emailAddress"
                                keyboardType="email-address"
                                disabled={loading}
                                required
                            />

                            <TextInput
                                label="Password"
                                returnKeyType="done"
                                value={password.value}
                                onChangeText={text => setPassword({ value: text, error: '' })}
                                errorText={password.error}
                                secureTextEntry={!showPassword}
                                right={
                                    <PaperTextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                disabled={loading}
                                required
                            />

                            <TextInput
                                label="Confirm Password"
                                returnKeyType="done"
                                value={confirmPassword.value}
                                onChangeText={text => setConfirmPassword({ value: text, error: '' })}
                                errorText={confirmPassword.error}
                                secureTextEntry={!showConfirmPassword}
                                right={
                                    <PaperTextInput.Icon
                                        icon={showConfirmPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                }
                                disabled={loading}
                                required
                            />
                        </View>

                        {/* Sign Up button */}
                        <TouchableOpacity
                            className="bg-emerald-500 rounded-2xl py-4 px-6 shadow-sm active:bg-emerald-600 mt-6 mb-4"
                            activeOpacity={0.8}
                            onPress={_onSignUpPressed}
                            disabled={loading}
                        >
                            <Text className="text-white text-center text-lg font-semibold">
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <MessageModal
                            isVisible={successModalVisible}
                            imgSource={require('../assets/auth/email-sent.png')}
                            title="Check Your Email"
                            description="We've sent you a verification link. Please confirm your email to continue."
                            onClose={closeSuccessModal}
                            buttonText="Continue to Login"
                        />
                    </KeyboardAvoidingView>
                </ScrollView>
            </TouchableWithoutFeedback>
        </View>
    )
}

export default RegisterScreen;