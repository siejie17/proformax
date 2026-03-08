import { View, Text, Image, KeyboardAvoidingView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, StatusBar, ScrollView } from 'react-native';
import { useRef, useState, useContext } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';

import TextInput from '../components/TextInput';
import MessageModal from '../components/MessageModal';

import api from '../services/api';
import BackButton from '../components/BackButton';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [isNotVerifiedYetModalVisible, setIsNotVerifiedYetModalVisible] = useState(false);
    const [isSentModalVisible, setIsSentModalVisible] = useState(false);

    // Refs for the input fields
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    const navigation = useNavigation();

    const dismissEverything = () => {
        if (emailInputRef.current) {
            emailInputRef.current.blur();
        }

        if (passwordInputRef.current) {
            passwordInputRef.current.blur();
        }

        Keyboard.dismiss();
    };

    const _onLoginPressed = async () => {
        // Reset errors
        const emailError = email.value ? '' : 'Email cannot be empty';
        const passwordError = password.value ? '' : 'Password cannot be empty';

        if (emailError || passwordError) {
            setEmail({ ...email, error: emailError });
            setPassword({ ...password, error: passwordError });
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/login', {
                email: email.value,
                password: password.value
            });

            if (res.data.user.email_verified_at) {
                const token = res.data.token;
                await login(token, res.data.user);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                setIsNotVerifiedYetModalVisible(true);
            }
        } catch (err) {
            // Try to extract field errors from response
            const message = err.response?.data?.message || 'Network or server error';

            await api.post('/logout');
            delete api.defaults.headers.common['Authorization'];
            let emailFieldError = '';
            let passwordFieldError = '';

            // If API returns validation errors
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                if (errors.email) emailFieldError = errors.email.join(' ');
                if (errors.password) passwordFieldError = errors.password.join(' ');
            }

            // If error message mentions email
            if (message.toLowerCase().includes('email')) {
                emailFieldError = message;
            }
            // If error message mentions password
            if (message.toLowerCase().includes('password')) {
                passwordFieldError = message;
            }
            // If error is general, show on both fields
            if (!emailFieldError && !passwordFieldError) {
                emailFieldError = message;
                passwordFieldError = message;
            }

            setEmail({ ...email, error: emailFieldError });
            setPassword({ ...password, error: passwordFieldError });
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
                                Welcome Back
                            </Text>
                            <Text className="text-base text-gray-500 text-center">
                                Sign in to access your account
                            </Text>
                        </View>

                        <View className="px-2">
                            {/* Email Input */}
                            <TextInput
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
                                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword", { setIsSentModalVisible: setIsSentModalVisible })}>
                                    <Text className="text-emerald-500 text-sm font-medium">
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
                            <Text className="text-white text-center text-lg font-semibold">
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