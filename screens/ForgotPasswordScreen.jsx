import { View, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Image, Alert, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';

import BackButton from '../components/BackButton';
import TextInput from '../components/TextInput';

import api from '../services/api';

const ForgotPasswordScreen = () => {
    const route = useRoute();
    const { setIsSentModalVisible } = route.params || {};
    const [email, setEmail] = useState({ value: '', error: '' });
    const [loading, setLoading] = useState(false);

    const navigation = useNavigation();

    const _onSendResetLinkPressed = async () => {
        setLoading(true);
        setEmail({ ...email, error: '' });

        if (!email.value) {
            setEmail({ ...email, error: 'Email cannot be empty' });
            setLoading(false);
            return;
        }

        // Send password reset link
        try {
            await api.post('/forgot-password', { email: email.value });
            setIsSentModalVisible(true);
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error sending password reset link:', error);
            Alert.alert('Error', `Failed to send password reset link ${error.response?.data?.message || error.message}`);
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
                        <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                            Reset Password
                        </Text>
                        <Text className="text-base text-gray-500 text-center">
                            Enter your email to receive a password reset link
                        </Text>
                    </View>

                    <View className="px-2">
                        <TextInput
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
                        <Text className="text-white text-center text-lg font-semibold">
                            {loading ? 'Sending instructions...' : 'Send Reset Instructions Email'}
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default ForgotPasswordScreen;