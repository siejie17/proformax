import { View, Text } from 'react-native';
import React, { Suspense } from 'react';
import Model from '../src/components/Model';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';

const ThreeDModelScreen = () => {
    const [OrbitControls, events] = useControls();

    return (
        <View className="flex-1" {...events}>
            <Canvas camera={{ position: [0, 0, 5], zoom: 0.8 }}>
                <OrbitControls enablePan={false} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
                <directionalLight position={[-5, 5, 5]} intensity={0.5} color="#ffffff" />
                <directionalLight position={[0, -5, 0]} intensity={0.3} color="#ffffff" />
                <pointLight position={[10, 10, 10]} intensity={0.4} />
                <Suspense fallback={null}>
                    <Model />
                </Suspense>
            </Canvas>
        </View>
    )
}

export default ThreeDModelScreen