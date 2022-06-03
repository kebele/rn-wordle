import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { colors, colorsToEmoji } from "../../constants";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { SlideInLeft } from "react-native-reanimated";

//? buraya başka bir component yapar gibi
//? statisticdeki sayılar kısmı
const Number = ({ number, label }) => (
  <View style={{ alignItems: "center", margin: 10 }}>
    <Text style={{ color: colors.lightgrey, fontSize: 30, fontWeight: "bold" }}>
      {number}
    </Text>
    <Text style={{ color: colors.lightgrey, fontSize: 16 }}>{label}</Text>
  </View>
);
//? tahmin dağılımı için, mesela 4. denemede kaç sefr kelimeyi buldun gibisine
const GuessDistributionLine = ({ position, amount, percentage }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Text style={{ color: colors.lightgrey }}>{position}</Text>
      <View
        style={{
          alignSelf: "stretch",
          width: "85%",
          backgroundColor: colors.grey,
          margin: 5,
          padding: 5,
          width: `${percentage}%`,
          minWidth: 20,
        }}
      >
        <Text style={{ color: colors.lightgrey }}>{amount}</Text>
      </View>
    </View>
  );
};

const GuessDistribution = ({ distribution }) => {
  // eğer bir distribtion yoksa ull dönecek
  if (!distribution) return null;
  const sum = distribution.reduce((total, dist) => dist + total, 0);
  return (
    <>
      <Text style={styles.subtitle}>guess distribution</Text>
      <View style={{ width: "100%", padding: 20 }}>
        {distribution.map((dist, index) => (
          <GuessDistributionLine
            key={index}
            position={index + 1}
            amount={dist}
            percentage={(100 * dist) / sum}
          />
        ))}
        {/* <GuessDistributionLine position={3} amount={2} percentage={70} />
        <GuessDistributionLine position={0} amount={2} percentage={50} /> */}
      </View>
    </>
  );
};

const EndScreen = ({ won = false, rows, getCellBGColor }) => {
  // yeni wordle'a kalan zaman
  const [secondsTillTomorrow, setSecondsTillTomorrow] = useState(0);
  const [played, setPlayed] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [curStreak, setCurStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [distribution, setDistribution] = useState(null);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setShow(true);
  //   }, 3000);
  // }, []);

  // asyncStorage'dan okuma yapacak/getirecek useEffect
  useEffect(() => {
    readState();
  }, []);

  // share score
  const share = () => {
    // const textShare = rows
    const textMap = rows
      .map((row, i) =>
        // row.map((cell, j) => getCellBGColor(i, j))
        // row.map((cell, j) => colorsToEmoji[getCellBGColor(i, j)])
        // row.map((cell, j) => colorsToEmoji[getCellBGColor(i, j)]).join(", ")
        row.map((cell, j) => colorsToEmoji[getCellBGColor(i, j)]).join("")
      )
      .filter((row) => row)
      .join("\n");
    // expo clipboard import
    const textToShare = `wordlish \n${textMap}`;
    Clipboard.setString(textToShare);
    // console.log(textShare); // başarılı renk kodlarını aldık
    Alert.alert(
      "copied successfully!",
      "share your score on your social media"
    );
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      setSecondsTillTomorrow((tomorrow - now) / 1000);
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  //? READSTATE
  //? @game key'i ile asyncStorage'da depolanmış stateleri getirmek, ayrıca daha önceki günlere ait kayıtları da getirmek
  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    // console.log(dataString);
    // asyncStorage'dan datayı okudu, loaded'ı true yapıp persistState'i çalıştırsın, useEffect ile ve storage'daki son datayı getirsin, ayı zamanda storage'daki datayı parse etsin ve sonrasında bunu kullanarak board'a basalım, bunu da try-catch ile yapalım,
    let data;
    try {
      data = JSON.parse(dataString); // datayı getirdik şimdi de set edelim
      console.log(data);
    } catch (error) {
      console.log("state'leri parse edemedim!");
    }
    // data nesnesindeki key ve value ları array olarak çekelim, keys.length oynanan oyun sayısı, gameState değeri won olanları filtreleyip length'ini ölçüp oynana oyuna oranlayınca kazanma yüzdesi,
    const keys = Object.keys(data);
    const values = Object.values(data);
    setPlayed(keys.length);

    const numberOfWins = values.filter(
      (game) => game.gameState === "won"
    ).length;
    setWinRate(Math.floor((100 * numberOfWins) / keys.length));
    // peşpeşe kazanma sayısı, datadaki gameState[0] konumundaki yani son oyun won ise _curStreak=1 yapıyor diğer elemana geçiyor o da won ise _curStreak'ı 1 arttırıyor sonrakina geçiyor, lose u bulduğunda _curStreak'ı 0 yapıyor yani seri kesilmiş oluyor, bunu _cueStreak olarak yapmamızın sebebi state ile aynı olmaması için, aynı zamanda max streak'de yapalım, bunun için prevDaytanımlayacağız, başlangıçta 0, day tanımlayacağız, hazırda day'imiz day-126-2022 şeklinde biz burada day-122 kısmında 122'yi alacağız, şimdigameState'i won olacak ve prevDay + 1 i de yani bugün değerinide perev+1 e atayacak yani max'ı sayabilmek için bir day daha hazırladık kendimize, if den çıkınca da prevDay=day yapıyoruz, yarına hazırlıyoruz,
    let _curStreak = 0;
    let maxStreak = 0;
    let prevDay = 0;
    keys.forEach((key) => {
      const day = parseInt(key.split("-")[1]);
      console.log(day); // butun günleri console'da görelim,
      if (data[key].gameState === "won" && _curStreak === 0) {
        _curStreak += 1;
      } else if (data[key].gameState === "won" && prevDay + 1 === day) {
        _curStreak += 1;
      } else {
        // _curStreak = 0;
        if (_curStreak > maxStreak) {
          maxStreak = _curStreak;
        }
        _curStreak = data[key].gameState === "won" ? 1 : 0;
      }
      prevDay = day;
    });
    setCurStreak(_curStreak);
    setMaxStreak(maxStreak);

    // setLoaded(true);

    //* GUESS DISTRIBUTION
    //* burada tahmin dağılımını sadece won olan oyunlarda yapacak,ve row[0] yani bir satırın ilk harfi varsa o zaman orada tahmin yapılmış demek, bunları çekecek,

    const dist = [0, 0, 0, 0, 0, 0]; // 6 tane satır var yani deneme
    values.map((game) => {
      if (game.gameState === "won") {
        const tries = game.rows.filter((row) => row[0]).length;
        dist[tries] = dist[tries] + 1;
      }
    });
    setDistribution(dist);
  };

  const formatSeconds = () => {
    const hours = Math.floor(secondsTillTomorrow / (60 * 60));
    const minutes = Math.floor((secondsTillTomorrow % (60 * 60)) / 60);
    const seconds = Math.floor(secondsTillTomorrow % 60);
    return `${hours} : ${minutes} : ${seconds}`;
  };

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Animated.Text
        entering={SlideInLeft.springify().mass(0.7)}
        style={styles.title}
      >
        {won ? "congrats" : "try again tomorrow"}
      </Animated.Text>
      <Animated.View entering={SlideInLeft.delay(100).springify().mass(0.7)}>
        <Text style={styles.subtitle}>statistics</Text>
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <Number number={played} label={"played"} />
          <Number number={winRate} label={"win %"} />
          <Number number={curStreak} label={"cur streak"} />
          <Number number={maxStreak} label={"max streak"} />
        </View>
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.delay(200).springify().mass(0.7)}
        style={{ width: "100%" }}
      >
        <GuessDistribution distribution={distribution} />
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.delay(300).springify().mass(0.7)}
        style={{ flexDirection: "row", padding: 10 }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: colors.lightgrey }}>next wordle</Text>
          <Text
            style={{
              color: colors.lightgrey,
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {formatSeconds()}
          </Text>
        </View>
        <Pressable
          onPress={share}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.lightgrey, fontWeight: "bold" }}>
            share
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};
const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    color: "white",
    textAlign: "center",
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 20,
    color: colors.lightgrey,
    textAlign: "center",
    marginVertical: 15,
    fontWeight: "bold",
  },
});

export default EndScreen;
