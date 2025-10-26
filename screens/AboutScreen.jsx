import { View, Text, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native'
import { Ionicons, Feather, Octicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutScreen = ({ navigation }) => {
    const features = [
        {
            id: 1,
            title: 'Predictive Cost Modelling',
            description: 'Identifies high-cost building elements and suggests cost-optimised alternatives.',
        },
        {
            id: 2,
            title: 'Framework-Driven Guidance',
            description: 'Uses the Cost Reduction via Client Satisfaction Framework to align decisions with cost efficiency and stakeholder needs.',
        },
        {
            id: 3,
            title: 'Green Compliance',
            description: 'Maps construction strategies to GBI and other sustainability rating systems.',
        },
        {
            id: 4,
            title: 'Decision Support Tools',
            description: 'Scenario analysis for budgeting, materials, and lifecycle savings.',
        },
    ];

    const whyMatters = [
        {
            id: 5,
            img: require('../assets/components/developer.png'),
            title: 'For Developers',
            description: 'Minimise upfront cost risk while maintaining long-term green building certification.',
        },
        {
            id: 6,
            img: require('../assets/components/contractor.png'),
            title: 'For Contractors & Consultants',
            description: 'Gain clarity in cost distribution, material choices, and design strategies.',
        },
        {
            id: 7,
            img: require('../assets/components/policymaker.png'),
            title: 'For Policy Makers',
            description: 'Support data-backed incentives and sustainable construction policies.',
        },
        {
            id: 8,
            img: require('../assets/components/community.png'),
            title: 'For Communities',
            description: 'Encourage greener buildings that are economically viable, socially inclusive, and environmentally responsible.',
        },
    ];

    const SectionCard = ({ imageURL, title, description }) => (
        <View className="bg-white rounded-3xl p-6 shadow-sm items-center mb-3">
            <Image
                source={imageURL}
                className="w-10 h-10 mb-4"
                style={{ resizeMode: 'contain' }}
            />
            <Text className="text-gray-900 text-xl font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm text-justify leading-6">{description}</Text>
        </View>
    );

    const FeatureItem = ({ number, title, description }) => (
        <View className="mb-4">
            <View className="flex-row items-start">
                <View className="w-6 h-6 rounded-full bg-green-700 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">{number}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 text-base font-semibold mb-1">{title}</Text>
                    <Text className="text-gray-600 text-sm leading-6">{description}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <View className="w-full border-b border-gray-200">
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="size-10 mr-4 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-semibold ml-2">About</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                {/* App Title & Tagline */}
                <View className="px-5 pt-6 pb-4">
                    <View className="bg-white rounded-3xl p-6 shadow-sm items-center">
                        <Image
                            source={require('../assets/logo/proformax-logo.png')}
                            className="w-20 h-20 mb-4"
                            style={{ resizeMode: 'contain' }}
                        />
                        <Text className="text-gray-900 text-2xl font-bold mb-2">ProFormaX</Text>
                        <Text className="text-gray-600 text-center text-sm leading-6">
                            An innovative cost-saving application designed to transform projects to achieve standards at minimum cost.
                        </Text>
                    </View>
                </View>

                {/* Our Purpose */}
                <View className="px-6 pt-3 mb-6">
                    <View className="bg-green-700 rounded-t-2xl self-start flex-row items-center px-3 py-2 mb-0">
                        <Feather name="target" size={20} color="#FAF9F6" />
                        <Text className="text-[#FAF9F6] text-lg font-bold ml-2">Our Purpose</Text>
                    </View>
                    <View className="bg-white rounded-2xl p-5 shadow-sm">
                        <Text className="text-gray-700 text-sm leading-6">
                            To bridge the gap between green construction practices and economic feasibility. By integrating advanced modelling and validated frameworks, the platform empowers stakeholders to make smarter financial and technical decisions that reduce risk, improve cost transparency, and enhance client satisfaction.
                        </Text>
                    </View>
                </View>

                {/* Our Vision */}
                <View className="px-6 mb-6">
                    <View className="bg-green-700 rounded-t-2xl self-start flex-row items-center px-3 py-2 mb-0">
                        <Feather name="eye" size={20} color="#FAF9F6" />
                        <Text className="text-[#FAF9F6] text-lg font-bold ml-2">Our Vision</Text>
                    </View>
                    <View className="bg-white rounded-2xl rounded-tl-none p-5 shadow-sm">
                        <Text className="text-gray-700 text-sm leading-6">
                            To become the leading digital platform that empowers stakeholders to understand and manage green construction costs with clarity, while driving the acceleration of sustainable development in Malaysia and beyond, where sustainability and affordability go hand in hand.
                        </Text>
                    </View>
                </View>

                {/* Key Features */}
                <View className="px-6 mb-6">
                    <View className="bg-green-700 rounded-t-2xl self-start flex-row items-center px-3 py-2 mb-0">
                        <Octicons name="sparkles-fill" size={20} color="#FAF9F6" />
                        <Text className="text-[#FAF9F6] text-lg font-bold ml-2">Key Features</Text>
                    </View>
                    <View className="bg-white rounded-2xl rounded-tl-none p-5 shadow-sm">
                        {features.map((feature, index) => (
                            <FeatureItem
                                key={feature.id}
                                number={feature.id}
                                title={feature.title}
                                description={feature.description}
                            />
                        ))}
                    </View>
                </View>

                {/* Why ProFormaX Matters */}
                <View className="px-6">
                    <Text className="text-gray-900 text-lg font-bold mb-3">Why ProFormaX Matters</Text>
                    {whyMatters.map((item) => (
                        <SectionCard
                            key={item.id}
                            imageURL={item.img}
                            title={item.title}
                            description={item.description}
                        />
                    ))}
                </View>

                {/* Footer Info */}
                <View className="px-5 pt-2">
                    <View className="rounded-2xl pt-3 items-center">
                        <Text className="text-black text-xs font-medium">Version 1.0.0</Text>
                        <Text className="text-gray-700 text-xs mt-1">© 2025 ProFormaX. All rights reserved.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default AboutScreen