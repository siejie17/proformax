import { View, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, Image, StatusBar, ScrollView, Text, TouchableOpacity, Platform } from 'react-native'
import { useState, useContext } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../contexts/AuthContext';

import api from '../services/api';

import TextInput from '../components/TextInput';
import MessageModal from '../components/MessageModal';
import BackButton from '../components/BackButton';

const RegisterScreen = () => {
    const { login } = useContext(AuthContext);

    const [firstName, setFirstName] = useState({ value: '', error: '' });
    const [lastName, setLastName] = useState({ value: '', error: '' });
    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const navigation = useNavigation();
    const hasMinLength = password.value.length >= 6;
    const hasMixedCase = /[a-z]/.test(password.value) && /[A-Z]/.test(password.value);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password.value);

    const validateFields = () => {
        let valid = true;

        if (!firstName.value.trim()) {
            setFirstName(f => ({ ...f, error: 'First name is required' }));
            valid = false;
        }

        if (!lastName.value.trim()) {
            setLastName(l => ({ ...l, error: 'Last name is required' }));
            valid = false;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!email.value.trim()) {
            setEmail(e => ({ ...e, error: 'Email is required' }));
            valid = false;
        } else if (!emailRegex.test(email.value)) {
            setEmail(e => ({ ...e, error: 'Invalid email format' }));
            valid = false;
        }

        if (!password.value) {
            setPassword(p => ({ ...p, error: 'Password is required' }));
            valid = false;
        } else if (password.value.length < 6) {
            setPassword(p => ({ ...p, error: 'Password must be at least 6 characters' }));
            valid = false;
        }

        if (!confirmPassword.value) {
            setConfirmPassword(c => ({ ...c, error: 'Confirm password is required' }));
            valid = false;
        } else if (confirmPassword.value !== password.value) {
            setConfirmPassword(c => ({ ...c, error: 'Passwords do not match' }));
            valid = false;
        }

        return valid;
    };

    const clearErrors = () => {
        setFirstName(f => ({ ...f, error: '' }));
        setLastName(l => ({ ...l, error: '' }));
        setEmail(e => ({ ...e, error: '' }));
        setPassword(p => ({ ...p, error: '' }));
        setConfirmPassword(c => ({ ...c, error: '' }));
        setGeneralError('');
    };

    const applyFieldErrors = (errors = {}) => {
        let matched = false;
        if (errors.first_name) { setFirstName(f => ({ ...f, error: errors.first_name[0] })); matched = true; }
        if (errors.last_name) { setLastName(l => ({ ...l, error: errors.last_name[0] })); matched = true; }
        if (errors.email) { setEmail(e => ({ ...e, error: errors.email[0] })); matched = true; }
        if (errors.password) { setPassword(p => ({ ...p, error: errors.password[0] })); matched = true; }
        return matched;
    };

    const _onSignUpPressed = async () => {
        clearErrors();
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

            const { token, user } = response.data;

            // Route through the same auth flow as LoginScreen so app-wide
            // auth state (not just AsyncStorage) knows the user is signed in.
            await login(token, user);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setSuccessModalVisible(true);
        } catch (error) {
            // Clear passwords on any failure.
            setPassword(p => ({ ...p, value: '' }));
            setConfirmPassword(c => ({ ...c, value: '' }));

            if (!error.response) {
                setGeneralError('Unable to connect. Please check your internet connection and try again.');
                return;
            }

            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 422: {
                    const hadFieldErrors = applyFieldErrors(data?.errors);
                    if (!hadFieldErrors) {
                        setGeneralError(data?.message || 'Please check your details and try again.');
                    }
                    break;
                }
                case 429:
                    setGeneralError('Too many attempts. Please wait a moment and try again.');
                    break;
                default:
                    if (status >= 500) {
                        setGeneralError('Something went wrong on our end. Please try again shortly.');
                    } else {
                        setGeneralError(data?.message || 'Something went wrong. Please try again.');
                    }
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
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                    alwaysBounceVertical={false}
                >
                    <BackButton goBack={() => navigation.goBack()} />
                    <KeyboardAvoidingView
                        className="flex-1 justify-center px-8 py-12"
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {/* Logo */}
                        <View className="items-center mb-6">
                            <Image
                                source={require('../assets/logo/proformax-logo.png')}
                                className="w-36 h-36"
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title */}
                        <View className="items-center mb-6">
                            <Text allowFontScaling={false} className="text-3xl font-bold text-gray-900 text-center mb-2">
                                Let's Sign Up
                            </Text>
                            <Text allowFontScaling={false} className="text-base text-gray-500 text-center">
                                Create your account to get started
                            </Text>
                        </View>

                        <View className="px-2">
                            {/* Form-level error banner */}
                            {generalError ? (
                                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                                    <Text allowFontScaling={false} className="text-red-600 text-sm text-center">
                                        {generalError}
                                    </Text>
                                </View>
                            ) : null}

                            <TextInput
                                allowFontScaling={false}
                                label="First Name"
                                returnKeyType="next"
                                value={firstName.value}
                                onChangeText={text => setFirstName({ value: text, error: '' })}
                                errorText={firstName.error}
                                disabled={loading}
                                required
                            />

                            <TextInput
                                allowFontScaling={false}
                                label="Last Name"
                                returnKeyType="next"
                                value={lastName.value}
                                onChangeText={text => setLastName({ value: text, error: '' })}
                                errorText={lastName.error}
                                disabled={loading}
                                required
                            />

                            <TextInput
                                allowFontScaling={false}
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
                                allowFontScaling={false}
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

                            <View className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 mb-4">
                                <Text allowFontScaling={false} className="text-slate-600 font-semibold text-[10px] mb-1">
                                    Password guide
                                </Text>
                                <View className="flex-row items-center mb-1">
                                    <Ionicons
                                        name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={14}
                                        color={hasMinLength ? '#059669' : '#94A3B8'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text allowFontScaling={false} className={`text-[10px] ${hasMinLength ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        Min 6 chars
                                    </Text>
                                </View>
                                <View className="flex-row items-center mb-1">
                                    <Ionicons
                                        name={hasMixedCase ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={14}
                                        color={hasMixedCase ? '#059669' : '#94A3B8'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text allowFontScaling={false} className={`text-[10px] ${hasMixedCase ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        Recommended: upper + lower case
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons
                                        name={hasSpecialCharacter ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={14}
                                        color={hasSpecialCharacter ? '#059669' : '#94A3B8'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text allowFontScaling={false} className={`text-[10px] ${hasSpecialCharacter ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        Recommended: special character
                                    </Text>
                                </View>
                            </View>

                            <TextInput
                                allowFontScaling={false}
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
                            <Text allowFontScaling={false} className="text-white text-center text-lg font-semibold">
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