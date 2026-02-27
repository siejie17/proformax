import { useGLTF } from '@react-three/drei/native';
import { useEffect, useRef } from 'react';
import { DRACOLoader } from 'three-stdlib';

export default function Model({ objectsConfig, visibleObjects, setVisibleObjects, onLoaded, ...props }) {
  const group = useRef(null);
  const { scene } = useGLTF(
    require('../assets/Proformax.glb'),
    true,
    true,
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      loader.setDRACOLoader(dracoLoader);
    }
  );

  useEffect(() => {
    if (onLoaded) onLoaded();
  }, []);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
        if (child.isMesh) {
          child.visible = visibleObjects[child.name] !== undefined ? visibleObjects[child.name] : true;
        }
    });
  }, [visibleObjects, scene]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} scale={0.01} />
    </group>
  );
}

// useGLTF.preload(require('../assets/Proformax.glb'));
