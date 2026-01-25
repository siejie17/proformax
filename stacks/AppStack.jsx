import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabStack from './TabStack';
import HistoryScreen from '../screens/HistoryScreen';
import GBSCalculatorScreen from '../screens/GBSCalculatorScreen';
import AboutScreen from '../screens/AboutScreen';
import TeamScreen from '../screens/TeamScreen';
import ResultsTopTabs from '../components/ResultsTopTabs';
import AccountScreen from '../screens/AccountScreen';
import EditFieldScreen from '../screens/EditFieldScreen';
import HistoryTopTabs from '../components/HistoryTopTabs';

const AppStack = () => {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator initialRouteName="Tabs">
            <Stack.Screen name="Tabs" component={TabStack} options={{ headerShown: false }} />
            <Stack.Screen name="GBSCalculator" component={GBSCalculatorScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Results" component={ResultsTopTabs} options={{ headerShown: false }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HistoryDetail" component={HistoryTopTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditFieldScreen" component={EditFieldScreen} options={{ headerShown: false }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Team" component={TeamScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    )
}

export default AppStack;