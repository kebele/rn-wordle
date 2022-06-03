// ScrollView eğer row sayısı artarsa ekranın dışına çıkarsa
// klavyeye basma
// sonucu paylaşmak için expo install expo-clipboard lazım, serverı durdur once
// oyunu kapatıp açtık diyelim baştan başlamasın, asyncStorage kullanacağız, localStorage gibi, expo install @react-native-async-storage/async-storage expo docs içerisinden, burada bir çok bilgiyi tutmalıyız, mesela tablomuzun (rows ların) o anki durumunu (ki tekrar açtığızda gelsin, hile vb şeylere izin vermesin), bizim o sırada hangi row,col da olduğmuz bilgisi ve oyun durumu, win/lost/playing den hangisi en son geçerli,
// oyunun her gün sıfırdan başlaması, kelime seçmesi ve önceki gün/günlere ait istatistiksel şeyleri kayıt etmesi
// win-loss ekranları
// istatistik ve tahmin dahmin dağılımları
// animasyon expo install react-native-reanimated sonrasında babel.config.js yi modifiye
//   presets: ['babel-preset-expo'],
// plugins: ["react-native-reanimated/plugin"]
// server ı npm start -- --clear şeklinde başlat
// https://docs.swmansion.com/react-native-reanimated/docs/api/LayoutAnimations/entryAnimations#slide mesela
// !!letter gösterimi boolean'ı string yapar
// publish için assets deki iconları aynı ölçü ve isimlerde mesela canva da istediğimize göre düzenleyip buradakilerle değiştiebiliriz,
// app.json'da burada da istediğimiz değişiklikleri yap, buradaki slug sanki app ın id'si gibi unique olmalı,
//
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { colors, CLEAR, ENTER } from "../../constants";
import Keyboard from "../Keyboard";
import { useEffect, useState } from "react";
import words from "../../words";
import styles from "./Game.styles";
import { copyArray, getDayOfTheYear, getDayKey } from "../../utils/index";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EndScreen from "../EndScreen";
import Animated, {
  SlideInDown,
  SlideInLeft,
  ZoomIn,
  FlipInEasyY,
} from "react-native-reanimated";

// * DENEME SAYISI yada ROW sayısı
const NUMBER_OF_TRIES = 6;

const dayOfTheYear = getDayOfTheYear();
// const dayKey = `day-${dayOfTheYear}`;
const dayKey = getDayKey();
// her güne ait kayıtlarda kullanmak için

// yeni gün yeni oyun ve önceki günlere ait kayıtlar, aşağıdaki gibi bir yapı lazım, bunu persistState içinde yaabiliriz,
// const game = {
//     day_15: {
//         rows: [[],[]],
//         curRow: 4,
//         curCol: 2,
//         gameState:"won"
//     },
//     day_16: {
//         rows: [[],[]],
//         curRow: 4,
//         curCol: 3,
//         gameState:"lost"
//     },
//     day_17: {
//         rows: [[],[]],
//         curRow: 2,
//         curCol: 4,
//         gameState:"won"
//     },
// }

//! OYUNUN BAŞLANGICI

const Game = () => {
  //   AsyncStorage.removeItem("@game");
  // oyuna dair storage'ı silmek için, bu geliştirmedeki denemelerde kullanmak için açılacak yoksa normalde kapalı olacak
  // const word = "hello";
  const word = words[dayOfTheYear];
  const letters = word.split(""); // ['h','e','l','l','o']
  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );

  //? bize içine ulaşabileceğimiz ve state olarak tutabileceğimiz satır sayısı kadar yani tahmin denemesi kadar array'ler lazım, eğer bir row'u map ile 6 sefer dönersek bunu state olarak tutamayız, şu anda deneme sayısı (6) row (satırdan-arraydan oluşan) büyük ve boş bir array'imiz var, bunu initial state olarak tutalım
  // const rows = new Array(NUMBER_OF_TRIES).fill(
  //   new Array(letters.length).fill("")
  // );

  //? şimdi bu array'i bastığımız key'e göre update edeceğiz, bunun için önce hangi hücrede olduğumuzu bilmemiz lazım, bunun içinde hangi row ve hangi col'dayız? Kısaca bulunduğumuz cell'in koordinatı lazım
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing"); // won/lost/playing
  //? burada oyunun playing/won/lost durumlarında ne yapacağını belirlemek için bir state noktası yaptık
  const [loaded, setLoaded] = useState(false);
  // burada asyncStorage doğru çalışsın diye bir state yaptık, oyun yüklendi mi yüklenmedi mi, false oyun daha yüklenmedi, yani persisState yani storage'a stateleri kaydedecek func çalışmasın, bu ne zaan true olmalı, storage'dan data lar okunduğunda true olmalı, süreç söyle data okundu, loaded true yap sonrasında state'lerin son durumunu/mevcut durumunu storage'a kaydet,
  const [show, setShow] = useState(false);

  //* WIN or LOOSE THE GAME
  //* her satır tamamlandığında yani enter yapıldığında (zaten enter satır tamamlandığında çalışıyor) win/loose kontrolu olmalı, yani useEffect ile curRow değiştiğinde bu kontrol yapılmalı, burada bize checkGameState(), checkIfWon() ve checkIfLost() lazım,

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  //? async storage da saklamak üzere neleri..., bu func statelerimizi asyncStorage'da saklayacak, ve bu saklamayı oyunda kullandığımız ve aşağıda useEffect'te saydığımız dependency'lerde bir değişiklik oldukça yapacak, yani Türkçesi biz oyunda harf yazma/ vb işlemler yaptıkça vya oyun win/lost/playing de bir değişiklik oldukça bunu yapacak, ayrıca birde bu asyncStorage'da tuttuğumuz data'nın okunması var

  // asyncStorage'a kayıt yapacak useEffect
  useEffect(() => {
    if (loaded) {
      persistState();
    }
  }, [rows, curRow, curCol, gameState]);

  // asyncStorage'dan okuma yapacak/getirecek useEffect
  useEffect(() => {
    readState();
  }, []);

  //   useEffect(() => {
  //     const timeout = setTimeout(() => {
  //       setShow(true);
  //     }, 3000);
  //     console.log("show true oldu");
  //     return () => clearTimeout(timeout);
  //   }, [gameState]);

  //   useEffect(() => {
  //     setTimeout(() => {
  //       setShow(true);
  //     }, 3000);
  //   }, [gameState]);

  //? state'leri tek bir objede toplama ve her günün kaydı için işlem yapma, istatistikler için,
  const persistState = async () => {
    // state'lerin son durumları konusu
    const dataForToday = {
      rows,
      curRow,
      curCol,
      gameState,
    };
    //? state'leri topladığımız persistState objectini AsyncStorage da '@game' olarak depola
    try {
      //* önceki günler verisi
      let existingStateString = await AsyncStorage.getItem("@game");
      const existingState = existingStateString
        ? JSON.parse(existingStateString)
        : {};

      existingState[dayKey] = dataForToday;
      //   const dataString = JSON.stringify(data);
      const dataString = JSON.stringify(existingState);
      //   console.log("kayıt edildi : ", dataString);
      await AsyncStorage.setItem("@game", dataString);
    } catch (error) {
      console.log("data'lar async Storage'a yazılamadı!");
    }
  };

  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    try {
      const data = JSON.parse(dataString);
      const day = data[dataKey];
      setRows(day.rows);
      setCurCol(day.curCol);
      setCurRow(day.curRow);
      setGameState(day.gameState);
    } catch (error) {
      console.log("state'i parse edemedim");
    }
    setLoaded(true);
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      //   Alert.alert("congrats", "you won!", [
      //     { text: "share", onPress: shareScore },
      //   ]);
      setGameState("won");
    } else if (checkIfLost() && gameState !== "lost") {
      //   Alert.alert("try again tomorrow!");
      setGameState("lost");
    }
  };

  const checkIfWon = () => {
    const row = rows[curRow - 1];

    return row.every((letter, i) => letter === letters[i]);
  };
  const checkIfLost = () => {
    return !checkIfWon() && curRow === rows.length;
  };

  // ********************* TUŞLAR
  const onKeyPressed = (key) => {
    //
    if (gameState !== "playing") {
      return; // bu yani win/lost durumlarında tuşlara basılamasın, devam etmesin
    }
    // console.warn(key);
    // copyArray'ı kullanacak, hücrenin koordinatı kopyalanmış array'a gösterecek ve o'na basılan key'i verecek ve Rows' state ini güncelleyecek
    const updatedRows = copyArray(rows);

    // * CLEAR
    // clear'ı import ile clear tuşunu getirelim, tuşa bastıkça sonraki sonraki cell'e geçiyor, clear'a basınca bir önceki cell'e gitsin ve değerini boşaltsın, ve current konumlarını da update etsin, ancak ilk hücreye geldiğinde dursun, yani current board'un dışında olmasın
    if (key === CLEAR) {
      const prevCol = curCol - 1;
      if (prevCol >= 0) {
        updatedRows[curRow][prevCol] = "";
        setRows(updatedRows);
        setCurCol(prevCol);
      }
      return; // dışarıda olmalı çünkü bir statement değil bir sonuç
    }
    // * ENTER
    // enter'a basıldığında kelime karşıleştırmasına başlasın, önce alt row'a geçsin
    if (key === ENTER) {
      if (curCol === rows[0].length) {
        setCurRow(curRow + 1);
        setCurCol(0);
      }
      return;
    }

    // row'daki hücrelerden fazla yazmasın
    if (curCol < rows[0].length) {
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      // harfi yazdı, sonraki colona geçsin
      setCurCol(curCol + 1);
    }
  };

  // ********************* ACTIVE CELL'i bulalım
  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  };

  // ********************* CELL BGCOLOR
  // burada eğer yazılan harf doğru yerde ise bg yeşil, yanlış yerde ise orange eğer kelimede yoksa black
  const getCellBGColor = (row, col) => {
    const letter = rows[row][col];
    if (row >= curRow) {
      return colors.black;
    }
    if (letter === letters[col]) {
      return colors.primary;
    }
    if (letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  };

  // * Keyboard'un BGCOLOR, keyboard'a hangi tuşların hangi renge BG olacağını prop olarak yolayacağız, yani bir array yollayacağız, greenCaps ve yellowCaps, greenCaps tanımlayalım, rows dolaş, ve i,j konumundaki hücrelerde color.primary olanları greenCaps olarak ata, şimdi burada bize boş array'ler ve her satırdaki yeşilleri ayrı ayrı veren array ler gelir bizim burada greenCaps olan arrayleri merge etmeliyiz, bunun için map yerine flatMap metodu var, bu direk birleşitren bir method, başarılı, bunu Keyboard.js'e yollayalım

  // const greenCaps = rows.map((row, i) =>
  //   row.filter((cell, j) => getCellBGColor(i, j) === colors.primary)
  // );
  // const greenCaps = rows.flatMap((row, i) =>
  //   row.filter((cell, j) => getCellBGColor(i, j) === colors.primary)
  // );
  // console.log(greenCaps);
  // const yellowCaps = rows.flatMap((row, i) =>
  //   row.filter((cell, j) => getCellBGColor(i, j) === colors.secondary)
  // );

  // ? bunu daha şık yapalım
  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, i) =>
      row.filter((cell, j) => getCellBGColor(i, j) === color)
    );
  };

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  // animated i kullanabilmek için
  const getCellStyle = (i, j) => [
    styles.cell,
    {
      borderColor: isCellActive(i, j) ? colors.grey : colors.darkgrey,
      backgroundColor: getCellBGColor(i, j),
    },
  ];

  //* oyunun yüklenmesine bir indicator koyalım ve asyncStorage çalışıp çalışmadığını kontrol
  if (!loaded) {
    return <ActivityIndicator />;
  }

  // win - loss ekranları

  if (gameState !== "playing") {
    return (
      <EndScreen
        won={gameState === "won"}
        rows={rows}
        getCellBGColor={getCellBGColor}
      />
    );
  }

  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <Animated.View
            entering={SlideInLeft.delay(i * 50)}
            key={`row-${i}`}
            style={styles.row}
          >
            {row.map((letter, j) => (
              <>
                {i < curRow && (
                  <Animated.View
                    entering={FlipInEasyY.delay(j * 100)}
                    key={`cell-color-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {i === curRow && !!letter && (
                  <Animated.View
                    entering={ZoomIn}
                    key={`cell-active-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {!letter && (
                  <View key={`cell-${i}-${j}`} style={getCellStyle(i, j)}>
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </View>
                )}
              </>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps}
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </>
  );
};

export default Game;
