import React from "react";
import { Modal, StyleSheet, View, TouchableOpacity } from "react-native";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Ionicons from '@expo/vector-icons/Ionicons';

type ImageModalProps = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
};

const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panOffsetX = useSharedValue(0);
  const panOffsetY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      // Capture the initial zoom level
      baseScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, baseScale.value * event.scale);
    })
    .onEnd(() => {
      // Persist the zoom level
      baseScale.value = scale.value;
    });

  // Pan Gesture Handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Translate the image while respecting the current zoom level
      panOffsetX.value = event.translationX / scale.value;
      panOffsetY.value = event.translationY / scale.value;
    })
    .onEnd(() => {
      // Persist the pan offsets
      translateX.value += panOffsetX.value;
      translateY.value += panOffsetY.value;
      panOffsetX.value = 0;
      panOffsetY.value = 0;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      baseScale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value + panOffsetX.value },
      { translateY: translateY.value + panOffsetY.value },
    ],
  }));

  const handleClose = () => {
    scale.value = withTiming(1);
    baseScale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.75}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.modalBackground}>
          <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, composedGesture)}>
            <Animated.Image
              source={{ uri: imageUri }}
              style={[styles.image, animatedStyle]}
              resizeMode="contain"
            />
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 10,
  },
  modalBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImageModal;
