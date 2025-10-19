import { View, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, Image, Alert } from 'react-native'
import { useState } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import api from '../services/api';

import BackButton from '../components/BackButton';
import Title from '../components/Title';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import MessageModal from '../components/MessageModal';

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

                    <Title>Let's Sign Up</Title>

                    <TextInput
                        label="First Name"
                        returnKeyType="next"
                        value={firstName.value}
                        onChangeText={text => setFirstName({ value: text, error: '' })}
                        error={!!firstName.error}
                        errorText={firstName.error}
                        disabled={loading}
                        required
                    />

                    <TextInput
                        label="Last Name"
                        returnKeyType="next"
                        value={lastName.value}
                        onChangeText={text => setLastName({ value: text, error: '' })}
                        error={!!lastName.error}
                        errorText={lastName.error}
                        disabled={loading}
                        required
                    />

                    <TextInput
                        label="Email Address"
                        returnKeyType="next"
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

                    <Button
                        className="mt-8"
                        mode="contained"
                        onPress={_onSignUpPressed}
                        loading={loading}
                        disabled={loading}
                    >
                        Sign Up
                    </Button>

                    <MessageModal
                        isVisible={successModalVisible} // Control visibility via state if needed
                        imgSource={require('../assets/auth/email-sent.png')}
                        title="Check Your Email"
                        description="We've sent you a verification link. Please confirm your email to continue."
                        onClose={closeSuccessModal}
                        buttonText="Continue to Login"
                    />
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default RegisterScreen;