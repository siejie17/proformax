import { View, StyleSheet, Text } from 'react-native';
import { TextInput as Input } from 'react-native-paper';
import { memo, useState } from 'react';

import { theme } from '../core/theme';

const TextInput = ({ errorText, description, right, required, label, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label ? (
                <Text style={[styles.label, isFocused && styles.labelFocused]}>
                    {label}
                    {required ? <Text style={styles.asterisk}> *</Text> : null}
                </Text>
            ) : null}
            <Input
                style={styles.input}
                selectionColor={theme.colors.primary}
                placeholderTextColor="#bdbdbd"
                underlineColor="transparent"
                mode="outlined"
                theme={{
                    roundness: 12,
                    colors: {
                        primary: theme.colors.primary,
                        background: styles.input.backgroundColor,
                    },
                }}
                outlineStyle={styles.outline}
                contentStyle={styles.contentStyle}
                right={right}
                label={undefined}
                placeholder={`Enter ${label?.toLowerCase()}`}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        </View>
    );
};

export default memo(TextInput);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 6,
    },
    input: {
        backgroundColor: '#fafafa',
        elevation: 0,
        height: 44
    },
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    contentStyle: {
        paddingHorizontal: 16,
        paddingVertical: 2,
        fontSize: 13,
    },
    description: {
        fontSize: 10,
        color: theme.colors.placeholder || '#999',
        paddingHorizontal: 12,
        paddingTop: 6,
        opacity: 0.8,
    },
    error: {
        fontSize: 14,
        color: theme.colors.error,
        paddingHorizontal: 12,
        paddingTop: 6,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
        marginLeft: 4,
    },
    labelFocused: {
        color: 'black',
    },
    asterisk: {
        color: 'red',
    },
});
