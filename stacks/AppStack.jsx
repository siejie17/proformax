import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabStack from './TabStack';
import HistoryScreen from '../screens/HistoryScreen';
import GBSCalculatorScreen from '../screens/GBSCalculatorScreen';

const AppStack = () => {
    const Stack = createNativeStackNavigator();
    
    return (
        <Stack.Navigator initialRouteName="Tabs">
            <Stack.Screen name="Tabs" component={TabStack} options={{ headerShown: false }} />
            <Stack.Screen name="GBSCalculator" component={GBSCalculatorScreen} options={{ headerShown: false }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    )
}

export default AppStack;