import { useState } from "react";
import { Button, Image, View, StyleSheet, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { encode } from "base64-arraybuffer";
import RNFS from "react-native-fs";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ImageModal from "@/components/ImageModal";
import axiosInstance from "@/api/instance";
import { getCurrentDateTime } from "@/utils";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [bwImage, setBwImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    // Prepare the form data
    const formData = new FormData();
    formData.append("image", {
      uri: image,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await axiosInstance.post("/upload/", formData);
      
      const base64String = `data:image/jpeg;base64,${encode(response.data)}`;
      setBwImage(base64String);
    } catch (error) {
      Alert.alert("Upload failed!");
    }
  };

  const saveImage = async () => {
    if (!bwImage) return;

    const albumPath = `${RNFS.PicturesDirectoryPath}/BlackAndWhite`;
    const fileName = `bw_image_${getCurrentDateTime()}.jpg`;
    const filePath = `${albumPath}/${fileName}`;

    // Save the image to the media library
    try {
      if (!(await RNFS.exists(albumPath))) {
        await RNFS.mkdir(albumPath);
      }

      await RNFS.writeFile(filePath, bwImage.split(",")[1], "base64");

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
    <GestureHandlerRootView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Selecionar imagem" onPress={pickImage} />
      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Enviar" onPress={uploadImage} />
        </>
      )}
      {bwImage && (
        <>
          <Image
            source={{ uri: bwImage }}
            style={{ width: 200, height: 200, marginTop: 10 }}
          />
          <Button title="Salvar imagem" onPress={saveImage} />
        </>
      )}

      <ImageModal
        visible={isModalOpen}
        imageUri={image as string}
        onClose={() => setIsModalOpen(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
  },
});
