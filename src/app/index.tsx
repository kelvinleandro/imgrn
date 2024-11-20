import { useState } from "react";
import {
  Button,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { encode } from "base64-arraybuffer";
import RNFS from "react-native-fs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import ImageModal from "@/components/ImageModal";
import axiosInstance from "@/api/instance";
import { getCurrentDateTime } from "@/utils";

export default function App() {
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const opacity = useSharedValue(1);

  const currentImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setDisplayImage(result.assets[0].uri);
    }
  };

  const switchImage = (uri: string) => {
    opacity.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(setDisplayImage)(uri);
      opacity.value = withTiming(1, { duration: 250 });
    });
  };

  const uploadImage = async () => {
    if (!pickedImage) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", {
      uri: pickedImage,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await axiosInstance.post("/upload/", formData);

      const base64String = `data:image/jpeg;base64,${encode(response.data)}`;
      switchImage(base64String);
    } catch (error) {
      Alert.alert("Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  const saveImage = async () => {
    if (!displayImage) return;

    const albumPath = `${RNFS.PicturesDirectoryPath}/BlackAndWhite`;
    const fileName = `bw_image_${getCurrentDateTime()}.jpg`;
    const filePath = `${albumPath}/${fileName}`;

    // Save the image to the media library
    try {
      if (!(await RNFS.exists(albumPath))) {
        await RNFS.mkdir(albumPath);
      }

      await RNFS.writeFile(filePath, displayImage.split(",")[1], "base64");

      if (Platform.OS == "android") {
        await RNFS.scanFile(filePath);
      }

      Alert.alert("Imagem salva!");
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      Alert.alert("Erro ao salvar imagem!");
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Button title="Selecionar imagem" onPress={pickImage} />

      {displayImage && (
        <>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsModalOpen(true)}
          >
            <Animated.Image
              source={{ uri: displayImage }}
              style={[styles.image, currentImageStyle]}
            />
          </TouchableOpacity>
          {isUploading ? (
            <ActivityIndicator size="large" />
          ) : pickedImage === displayImage ? (
            <Button title="Enviar" onPress={uploadImage} />
          ) : (
            <Button title="Salvar imagem" onPress={saveImage} />
          )}
        </>
      )}

      <ImageModal
        visible={isModalOpen}
        imageUri={displayImage as string}
        onClose={() => setIsModalOpen(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  image: {
    width: 200,
    height: 200,
  },
});
