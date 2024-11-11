import { useState } from "react";
import { Button, Image, View, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import { encode } from "base64-arraybuffer";

const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_BASE_URL || "http://192.168.1.64:8000";

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [bwImage, setBwImage] = useState<string | null>(null);

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
      const response = await axios.post(`${SERVER_URL}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "arraybuffer",
      });

      const base64String = `data:image/jpeg;base64,${encode(response.data)}`;
      setBwImage(base64String);
    } catch (error) {
      Alert.alert("Upload failed!");
    }
  };

  const saveImage = async () => {
    if (!bwImage) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access media library is required!");
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}bw_image_${getCurrentDateTime()}.jpg`;

    // Save the image to the media library
    try {

      await FileSystem.writeAsStringAsync(fileUri, bwImage.split(",")[1], {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(fileUri);
      alert("Image saved to gallery!");
    } catch (error) {
      // console.error("Error saving image to gallery:", error);
      Alert.alert("Error saving image to gallery!");
    }
  };

  // const saveImage = async () => {
  //   // this way saves the image in a specific album
  //   if (!bwImage) return;

  //   const { status } = await MediaLibrary.requestPermissionsAsync();
  //   if (status !== "granted") {
  //     Alert.alert("Permission to access media library is required!");
  //     return;
  //   }

  //   const albumName = "BlackAndWhite";
  //   const fileUri = `${FileSystem.cacheDirectory}bw_image_${getCurrentDateTime()}.jpg`;

  //   // Save the image to the media library
  //   try {
  //     await FileSystem.writeAsStringAsync(fileUri, bwImage.split(",")[1], {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });

  //     const asset = await MediaLibrary.createAssetAsync(fileUri);

  //     let album = await MediaLibrary.getAlbumAsync(albumName);
  //     if (!album) {
  //       album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
  //     } else {
  //       // Add the asset to the existing album
  //       await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  //     }

  //     Alert.alert("Image saved to gallery!");
  //   } catch (error) {
  //     console.error("Error saving image to gallery:", error);
  //     Alert.alert("Error saving image to gallery!");
  //   }
  // };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
  },
});
