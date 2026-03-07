import { FlatList } from "react-native";
import { Weight } from "../../api/weight.api";
import WeightItem from "./WeightItem";

type Props = {
  weights: Weight[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
};

export default function WeightList({
  weights,
  loading,
  onRefresh,
  onDelete,
}: Props) {
  return (
    <FlatList
      data={weights}
      refreshing={loading}
      onRefresh={onRefresh}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <WeightItem
          item={item}
          onDelete={onDelete}
        />
      )}
    />
  );
}