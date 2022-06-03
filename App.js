// Thanks to NotJustDev
//https://www.youtube.com/c/notjustdev

// ScrollView eğer row sayısı artarsa ekranın dışına çıkarsa
// klavyeye basma
// sonucu paylaşmak için expo install expo-clipboard lazım, serverı durdur once

import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { colors } from "./src/constants";
import Game from "./src/components/Game/Game";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>wordlish</Text>
      <Game />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    // justifyContent: "center",
  },
  title: {
    marginTop: 20,
    color: colors.lightgrey,
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 5,
  },
});
