import { useState } from "react";
import { Button, Image, View, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { encode } from "base64-arraybuffer"; // Import the encoding function

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL || "http://192.168.1.64:8000";

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [bwImageUri, setBwImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    // Open the image picker
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

      const response = await axios.post(`${SERVER_URL}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "arraybuffer",
      });
      
      const base64String = `data:image/jpeg;base64,${encode(response.data)}`;
      setBwImageUri(base64String);
    } catch (error) {
      // console.error("Upload failed", error);
      Alert.alert("Upload failed!");
    }
  };

  const saveImage = async () => {
    if (!bwImageUri) return;

    try {
      const fileUri = FileSystem.documentDirectory + `image_${getCurrentDateTime()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, bwImageUri.split(",")[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
      Alert.alert("Image saved successfully!", `Saved to ${fileUri}`);
    } catch (error) {
      // console.error("Save failed", error);
      Alert.alert("Save failed!");
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Selecionar imagem" onPress={pickImage} />
      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Enviar" onPress={uploadImage} />
        </>
      )}
      {bwImageUri && (
        <>
          <Image source={{ uri: bwImageUri }} style={{ width: 200, height: 200, marginTop: 10 }} />
          <Button title="Salvar imagem" onPress={saveImage} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
  }
});
