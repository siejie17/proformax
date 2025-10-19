import { View, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Image, Alert } from 'react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native';

import BackButton from '../components/BackButton';
import Title from '../components/Title';
import TextInput from '../components/TextInput';
import Button from '../components/Button';

import api from '../services/api';

const ForgotPasswordScreen = () => {
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
            Alert.alert('Success', 'Password reset link sent to your email');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error sending password reset link:', error);
            Alert.alert('Error', 'Failed to send password reset link');
        } finally {
            setLoading(false);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 w-full bg-white">
                <BackButton goBack={() => navigation.navigate("Login")} />
                <KeyboardAvoidingView
                    className="flex-1 p-4 w-full max-w-[340px] self-center items-center justify-center"
                    behavior="padding"
                >
                    <Image
                        source={require('../assets/logo/proformax-logo.png')}
                        className="w-48 h-48"
                    />

                    <Title>Reset Password</Title>

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

                    <View className="mt-4" />
                    <Button
                        mode="contained"
                        onPress={_onSendResetLinkPressed}
                        loading={loading}
                        disabled={loading}
                    >
                        Send Reset Instructions Email
                    </Button>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default ForgotPasswordScreen;