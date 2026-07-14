import { View, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Image, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native';

import api from '../services/api';

import BackButton from '../components/BackButton';
import TextInput from '../components/TextInput';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState({ value: '', error: '' });
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const navigation = useNavigation();

    const _onSendResetLinkPressed = async () => {
        setGeneralError('');
        setEmail(e => ({ ...e, error: '' }));

        if (!email.value.trim()) {
            setEmail(e => ({ ...e, error: 'Email cannot be empty' }));
            return;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email.value)) {
            setEmail(e => ({ ...e, error: 'Invalid email format' }));
            return;
        }

        setLoading(true);

        try {
            await api.post('/forgot-password', { email: email.value });
            navigation.navigate('Login', { passwordResetEmailSent: true });
        } catch (error) {
            if (!error.response) {
                setGeneralError('Unable to connect. Please check your internet connection and try again.');
                return;
            }

            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 422: {
                    const fieldMessage = data?.errors?.email?.[0];
                    if (fieldMessage) {
                        setEmail(e => ({ ...e, error: fieldMessage }));
                    } else {
                        setGeneralError(data?.message || 'Please enter a valid email address.');
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
                        setGeneralError('Failed to send password reset link. Please try again.');
                    }
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 w-full bg-white">
                <BackButton goBack={() => navigation.goBack()} />
                <KeyboardAvoidingView
                    className="flex-1 justify-center px-8 py-12"
                    behavior="padding"
                >
                    <View className="items-center mb-8">
                        <Image
                            source={require('../assets/logo/proformax-logo.png')}
                            className="w-40 h-40"
                            resizeMode="contain"
                        />
                    </View>

                    <View className="items-center mb-4">
                        <Text allowFontScaling={false} className="text-3xl font-bold text-gray-900 text-center mb-2">
                            Reset Password
                        </Text>
                        <Text allowFontScaling={false} className="text-base text-gray-500 text-center">
                            Enter your email to receive a password reset link
                        </Text>
                    </View>

                    <View className="px-2">
                        {generalError ? (
                            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                                <Text allowFontScaling={false} className="text-red-600 text-sm text-center">
                                    {generalError}
                                </Text>
                            </View>
                        ) : null}

                        <TextInput
                            allowFontScaling={false}
                            label="Email address"
                            returnKeyType="done"
                            value={email.value}
                            onChangeText={text => setEmail({ value: text, error: '' })}
                            error={!!email.error}
                            errorText={email.error}
                            autoCapitalize="none"
                            autoCompleteType="email"
                            textContentType="emailAddress"
                            keyboardType="email-address"
                            disabled={loading}
                            required
                        />
                    </View>

                    <View className="mt-4" />
                    <TouchableOpacity
                        className="bg-emerald-500 rounded-2xl py-4 px-6 shadow-sm active:bg-emerald-600 mb-4"
                        activeOpacity={0.8}
                        onPress={_onSendResetLinkPressed}
                        disabled={loading}
                    >
                        <Text allowFontScaling={false} className="text-white text-center text-lg font-semibold">
                            {loading ? 'Sending instructions...' : 'Send Reset Instructions Email'}
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default ForgotPasswordScreen;