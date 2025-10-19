import { View, Text, Image, KeyboardAvoidingView, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useRef, useState, useContext } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthContext } from '../contexts/AuthContext';

import TextInput from '../components/TextInput';
import Title from '../components/Title';
import Button from '../components/Button';
import MessageModal from '../components/MessageModal';

import api from '../services/api';

const LoginScreen = () => {
    const { setIsLoggedIn } = useContext(AuthContext);

    const [email, setEmail] = useState({ value: '', error: '' });
    const [password, setPassword] = useState({ value: '', error: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [isNotVerifiedYetModalVisible, setIsNotVerifiedYetModalVisible] = useState(false);

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

        // Proceed with login
        setLoading(true);

        try {
            const res = await api.post('/login', {
                email: email.value,
                password: password.value
            });

            if (res.data.user.email_verified_at) {
                const token = res.data.token;

                // save token securely (AsyncStorage used here for example)
                await AsyncStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // optional: store user
                await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
                console.log(res.data.user);

                setIsLoggedIn(true);
            } else {
                setIsNotVerifiedYetModalVisible(true);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Network or server error';
            Alert.alert('Login failed', message);
            console.error(err.response?.data ?? err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={dismissEverything}>
            <View className="flex-1 w-full bg-white">
                <KeyboardAvoidingView
                    className="flex-1 p-4 w-full max-w-[340px] self-center items-center justify-center"
                    behavior="padding"
                >
                    <Image
                        source={require('../assets/logo/proformax-logo.png')}
                        className="w-48 h-48"
                    />

                    <Title>Sign In to ProFormaX</Title>

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
                    <View className="w-full items-end mb-6">
                        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                            <Text className="text-secondary text-sm">Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login button */}
                    <Button
                        mode="contained"
                        onPress={_onLoginPressed}
                        loading={loading}
                        disabled={loading}
                    >
                        Login
                    </Button>

                    {/* Sign up link */}
                    <View className="flex-row mt-1">
                        <Text className="text-secondary">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                            <Text className="font-bold text-primary">Sign up</Text>
                        </TouchableOpacity>
                    </View>

                    <MessageModal
                        isVisible={isNotVerifiedYetModalVisible}
                        imgSource={require('../assets/auth/unverified.png')}
                        title="Email Verification Required"
                        description="Your email isn't verified yet. Please check your inbox to continue."
                        onClose={() => setIsNotVerifiedYetModalVisible(false)}
                        buttonText="Got it"
                    />
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default LoginScreen;