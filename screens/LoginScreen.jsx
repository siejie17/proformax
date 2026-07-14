import { View, Text, Image, KeyboardAvoidingView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, StatusBar, ScrollView } from 'react-native';
import { useRef, useState, useContext, useEffect } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';

import api from '../services/api';

import TextInput from '../components/TextInput';
import MessageModal from '../components/MessageModal';
import BackButton from '../components/BackButton';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form-level error (network issues, server errors, invalid credentials)
    // Kept separate from field-level errors so we don't imply we know
    // *which* field is wrong when we don't (or shouldn't say).
    const [generalError, setGeneralError] = useState('');

    const [isNotVerifiedYetModalVisible, setIsNotVerifiedYetModalVisible] = useState(false);
    const [isSentModalVisible, setIsSentModalVisible] = useState(false);

    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        if (route.params?.passwordResetEmailSent) {
            setIsSentModalVisible(true);
            navigation.setParams({ passwordResetEmailSent: false });
        }
    }, [navigation, route.params?.passwordResetEmailSent]);

    const dismissEverything = () => {
        if (emailInputRef.current) emailInputRef.current.blur();
        if (passwordInputRef.current) passwordInputRef.current.blur();
        Keyboard.dismiss();
    };

    const clearErrors = () => {
        setEmail(e => ({ ...e, error: '' }));
        setPassword(p => ({ ...p, error: '' }));
        setGeneralError('');
    };

    const applyFieldErrors = (errors) => {
        // Laravel-style { email: [...], password: [...] } validation errors
        let matched = false;
        if (errors.email) {
            setEmail(e => ({ ...e, error: errors.email.join(' ') }));
            matched = true;
        }
        if (errors.password) {
            setPassword(p => ({ ...p, error: errors.password.join(' ') }));
            matched = true;
        }
        return matched;
    };

    const _onLoginPressed = async () => {
        clearErrors();

        const emailError = email.value ? '' : 'Email cannot be empty';
        const passwordError = password.value ? '' : 'Password cannot be empty';

        if (emailError || passwordError) {
            setEmail(e => ({ ...e, error: emailError }));
            setPassword(p => ({ ...p, error: passwordError }));
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/login', {
                email: email.value,
                password: password.value,
            });

            if (res.data.user.email_verified_at) {
                const token = res.data.token;
                await login(token, res.data.user);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                setIsNotVerifiedYetModalVisible(true);
            }
        } catch (err) {
            // Clear password on any failure — don't make the user retype email too.
            setPassword(p => ({ ...p, value: '' }));

            // No response at all => network/connectivity issue, not a field problem.
            if (!err.response) {
                setGeneralError('Unable to connect. Please check your internet connection and try again.');
                return;
            }

            const status = err.response.status;
            const data = err.response.data;

            switch (status) {
                case 422: {
                    // Structured validation errors from the API.
                    const hadFieldErrors = data?.errors ? applyFieldErrors(data.errors) : false;
                    if (!hadFieldErrors) {
                        setGeneralError(data?.message || 'Please check your details and try again.');
                    }
                    break;
                }
                case 401:
                case 403:
                    // Deliberately generic — don't reveal whether the email or
                    // password specifically was wrong.
                    setGeneralError(data?.message || 'Incorrect email or password.');
                    break;
                case 429:
                    setGeneralError('Too many login attempts. Please wait a moment and try again.');
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
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <TouchableWithoutFeedback onPress={dismissEverything}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <BackButton goBack={() => navigation.replace("Onboarding")} />
                    <KeyboardAvoidingView
                        className="flex-1 justify-center px-8 py-12"
                        behavior="padding"
                    >
                        {/* Logo */}
                        <View className="items-center mb-8">
                            <Image
                                source={require('../assets/logo/proformax-logo.png')}
                                className="w-36 h-36"
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title */}
                        <View className="items-center mb-8">
                            <Text allowFontScaling={false} className="text-3xl font-bold text-gray-900 text-center mb-2">
                                Welcome Back
                            </Text>
                            <Text allowFontScaling={false} className="text-base text-gray-500 text-center">
                                Sign in to access your account
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

                            {/* Email Input */}
                            <TextInput
                                allowFontScaling={false}
                                label="Email Address"
                                returnKeyType="next"
                                value={email.value}
                                onChangeText={text => setEmail({ value: text, error: "" })}
                                errorText={email.error}
                                autoCapitalize="none"
                                autoCompleteType="email"
                                textContentType="emailAddress"
                                keyboardType="email-address"
                                disabled={loading}
                                onRef={(ref) => (emailInputRef.current = ref)}
                                required
                            />

                            {/* Password Input */}
                            <TextInput
                                allowFontScaling={false}
                                label="Password"
                                returnKeyType="done"
                                value={password.value}
                                onChangeText={text => setPassword({ value: text, error: "" })}
                                errorText={password.error}
                                secureTextEntry={!showPassword}
                                disabled={loading}
                                onRef={(ref) => (passwordInputRef.current = ref)}
                                right={
                                    <PaperTextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                required
                            />

                            {/* Forgot password */}
                            <View className="w-full items-end mb-8">
                                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                                    <Text allowFontScaling={false} className="text-emerald-500 text-sm font-medium">
                                        Forgot your password?
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login button */}
                        <TouchableOpacity
                            className="bg-emerald-500 rounded-2xl py-4 px-6 shadow-sm active:bg-emerald-600 mb-4"
                            activeOpacity={0.8}
                            onPress={_onLoginPressed}
                            disabled={loading}
                        >
                            <Text allowFontScaling={false} className="text-white text-center text-lg font-semibold">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        <MessageModal
                            isVisible={isNotVerifiedYetModalVisible}
                            imgSource={require('../assets/auth/unverified.png')}
                            title="Email Verification Required"
                            description="Your email isn't verified yet. Please check your inbox to continue."
                            onClose={() => setIsNotVerifiedYetModalVisible(false)}
                            buttonText="Got it"
                        />

                        <MessageModal
                            isVisible={isSentModalVisible}
                            imgSource={require('../assets/auth/email-sent.png')}
                            title="Password Reset Email Sent"
                            description="Password reset instructions have been sent to your email."
                            onClose={() => setIsSentModalVisible(false)}
                            buttonText="Got it"
                        />
                    </KeyboardAvoidingView>
                </ScrollView>
            </TouchableWithoutFeedback>
        </View>
    )
}

export default LoginScreen;