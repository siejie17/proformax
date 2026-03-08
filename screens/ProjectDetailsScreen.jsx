import { View, Text, ScrollView } from 'react-native';
import DisplayField from '../components/DisplayField';

const ProjectDetailsScreen = ({ selectedProject }) => {
    const certifiedScaleRange = {
        'Platinum': [85, 100],
        'Gold': [75, 84],
        'Silver': [65, 74],
        'Certified': [55, 64],
        'Not Certified': [0, 54]
    };

    return (
        <View className="flex-1 bg-gray-100">
            <View className="px-5 pt-2 pb-6 border-b border-slate-100">
                <Text className="text-slate-800 font-bold text-lg mb-1">Project Details</Text>
                <Text className="text-slate-800 text-xs">
                    Details from your submitted GBI assessment.
                </Text>
            </View>

            <ScrollView
                className="flex-1 px-3"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                bounces={true}
            >
                <DisplayField
                    label="Project Name"
                    value={selectedProject?.name}
                />

                <DisplayField
                    label="Building Type"
                    value={selectedProject?.building_type_name}
                />

                <DisplayField
                    label="Building Category"
                    value={selectedProject?.category}
                />

                <DisplayField
                    label="Project/Building Size (m²)"
                    value={
                        parseFloat(selectedProject?.size).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })
                    }
                />

                <DisplayField
                    label="Project Budget"
                    value={selectedProject?.budget ? `RM ` +
                        parseFloat(selectedProject?.budget).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }) : 'Not Available'
                    }
                />

                <DisplayField
                    label="Location"
                    value={selectedProject?.location}
                />

                <DisplayField
                    label="Year of Proposed Project/Building"
                    value={selectedProject?.year}
                />

                <DisplayField
                    label="Structure"
                    value={selectedProject?.structure}
                />

                <DisplayField
                    label="Targeted Certification Scale"
                    value={selectedProject?.target_certification}
                />

                <DisplayField
                    label="Certified Rating"
                    value={selectedProject?.rating}
                    certifiedScaleRange={certifiedScaleRange}
                />
            </ScrollView>
        </View>
    )
}

export default ProjectDetailsScreen;