import { View, Text, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const TeamScreen = ({ navigation }) => {
    const teamMembers = [
        {
            id: 1,
            name: 'AP. Sr. Ts. Dr. Afzan Ahmad Zaini',
            role: 'Leader & Quantity Surveyor Consultant',
            image: require('../assets/components/team_member_1.png'),
        },
        {
            id: 2,
            name: 'Prof. Sr. Dr Padzil @ Fadzil Hassan',
            role: 'Quantity Surveyor Consultant',
            image: require('../assets/components/team_member_2.png'),
        },
        {
            id: 3,
            name: 'AP. Dr Norhuzaimin Julai',
            role: 'Engineering Consultant',
            image: require('../assets/components/team_member_3.png'),
        },
        {
            id: 4,
            name: 'Ts. Nurfauza Jali',
            role: 'IT Consultant',
            image: require('../assets/components/team_member_4.png'),
        },
        {
            id: 5,
            name: 'Nur Khairina Khairul Hisham',
            role: 'Quantity Surveyor',
            image: require('../assets/components/team_member_5.png'),
        },
        {
            id: 6,
            name: 'Ling Sie Jie',
            role: 'Programmer',
            image: require('../assets/components/team_member_6.png'),
        },
    ];

    const TeamMemberCard = ({ member }) => (
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-start">
                {/* Profile Image */}
                <View className="mr-4">
                    <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                        <Image
                            source={member.image}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/* Member Info */}
                <View className="flex-1">
                    <Text className="text-gray-900 text-base font-semibold leading-6 mb-2">
                        {member.name}
                    </Text>
                    <View className="bg-green-50 rounded-lg px-3 py-1.5 self-start">
                        <Text className="text-green-700 text-xs font-medium">
                            {member.role}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            {/* Header */}
            <View className="w-full border-b border-gray-200">
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="size-10 mr-4 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-semibold ml-2">Our Team</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 4 }}
            >
                {/* Header Section */}
                <View className="px-5 pt-6 pb-4">
                    <View className="bg-white rounded-3xl p-6 shadow-sm items-center">
                        <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-3">
                            <FontAwesome5 name="users" size={28} color="#15803D" />
                        </View>
                        <Text className="text-gray-900 text-xl font-bold mb-2">Meet Our Team</Text>
                        <Text className="text-gray-600 text-center text-sm leading-6">
                            Dedicated professionals bringing expertise in construction, sustainability, and technology to make green building affordable.
                        </Text>
                    </View>
                </View>

                {/* Team Members Section */}
                <View className="px-5">
                    <View className="mb-3">
                        <Text className="text-gray-900 text-lg font-bold">Team Members</Text>
                        <Text className="text-gray-500 text-sm mt-1">
                            {teamMembers.length} expert{teamMembers.length !== 1 ? 's' : ''} working together
                        </Text>
                    </View>

                    {teamMembers.map((member) => (
                        <TeamMemberCard key={member.id} member={member} />
                    ))}
                </View>

                {/* Footer Note */}
                <View className="px-5 pt-1">
                    <View className="bg-green-50 rounded-2xl px-4 py-3">
                        <Text className="text-green-900 text-sm font-medium text-center leading-6">
                            Together, we're building a sustainable future.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TeamScreen;