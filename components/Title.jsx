import { StyleSheet, Text } from 'react-native';
import { memo } from 'react';

import { theme } from '../core/theme';

const Title = ({ children }) => (
    <Text style={styles.title}>{children}</Text>
);

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        color: theme.colors.secondary,
        fontWeight: 'bold',
        paddingVertical: 12,
        textAlign: 'center',
        marginBottom: 6,
    },
});

export default memo(Title);