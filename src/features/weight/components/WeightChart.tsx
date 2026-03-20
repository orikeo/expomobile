import { View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Weight } from "../api/weight.api";

type Props = {
  weights: Weight[];
};

export default function WeightChart({ weights }: Props) {

  // берём последние 10 записей
  const lastWeights = weights.slice(-10);

  const labels = lastWeights.map((w) =>
    new Date(w.entryDate).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    })
  );

  const data = lastWeights.map((w) => w.weight);

  /**
   * определяем рост или падение веса
   */
  let lineColor = "#1e90ff";

  if (data.length >= 2) {
    const first = data[0];
    const last = data[data.length - 1];

    if (last > first) {
      lineColor = "#ff3b30"; // вес растёт
    }

    if (last < first) {
      lineColor = "#2ecc71"; // вес падает
    }
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        color: () => lineColor,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View>
      <LineChart
        data={chartData}
        width={Dimensions.get("window").width - 20}
        height={220}
        yAxisSuffix="kg"
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",

          decimalPlaces: 1,

          color: () => lineColor,

          labelColor: () => "#444",

          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: lineColor,
          },
        }}
        style={{
          marginVertical: 20,
          borderRadius: 10,
        }}
      />
    </View>
  );
}