import { StyleSheet } from "react-native";
import { colors } from "../../constants";

export default StyleSheet.create({
  map: {
    // backgroundColor: "red",
    alignSelf: "stretch",
    // height: 100,
    marginVertical: 20,
  },
  row: {
    // backgroundColor: "blue",
    flexDirection: "row",
    alignSelf: "stretch",
    // height: 50,
    justifyContent: "center",
  },
  cell: {
    // backgroundColor: "green",
    borderWidth: 3,
    borderColor: colors.darkgrey,
    // width: 30,
    // height: 30,
    flex: 1,
    aspectRatio: 1 / 1,
    margin: 3,
    maxWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    color: colors.lightgrey,
    fontWeight: "bold",
    fontSize: 28,
  },
});
