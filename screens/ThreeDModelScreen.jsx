import { ActivityIndicator, InteractionManager, Text, TouchableOpacity, View } from 'react-native';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';

import Model from '../src/components/Model';
import { MaterialIcons } from '@expo/vector-icons';
import ThreeDItemsModal from '../components/ThreeDItemsModal';
import { useFocusEffect } from '@react-navigation/native';

const ThreeDModelScreen = ({ user3DVisibility, objectsConfig, visibleObjects, setVisibleObjects }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldLoad, setShouldLoad] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const task = InteractionManager.runAfterInteractions(() => {
                setShouldLoad(true);
            });

            return () => {
                task.cancel();
                setShouldLoad(false);
            };
        }, [])
    );

    return (
        <View style={{ flex: 1 }}>
            {shouldLoad && (
                <Canvas style={{ flex: 1 }} camera={{ position: [0, 2, 6], fov: 50 }}>
                    <Suspense fallback={null}>
                        <ambientLight intensity={1.2} />
                        <directionalLight position={[5, 5, 5]} intensity={1.5} />
                        <Model
                            objectsConfig={objectsConfig}
                            visibleObjects={visibleObjects}
                            setVisibleObjects={setVisibleObjects}
                            onLoaded={() => setIsLoading(false)}
                        />
                        <OrbitControls enablePan enableZoom enableRotate />
                    </Suspense>
                </Canvas>
            )}

            {isLoading && shouldLoad && (
                <View className="absolute top-0 left-0 bottom-0 right-0 items-center justify-center px-6">
                    {/* Loading Spinner */}
                    <View className="mb-6">
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>

                    {/* Loading Text */}
                    <Text className="text-gray-600 text-base font-medium">
                        Loading...
                    </Text>
                </View>
            )}
            <TouchableOpacity
                className="absolute bottom-5 right-5 bg-green-600 rounded-3xl p-3 flex-row items-center gap-2.5"
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <View className="relative">
                    <MaterialIcons name="remove-red-eye" size={18} color="white" />
                </View>
                <Text className="text-white font-bold text-sm tracking-wide">Show Items</Text>
            </TouchableOpacity>
            <ThreeDItemsModal
                user3DVisibility={user3DVisibility}
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </View>
    )
}

export default ThreeDModelScreen