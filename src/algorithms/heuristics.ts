import { haversineDistance } from "../utils/geo";
import { HeuristicFn } from "./types";

export const geoHeuristic: HeuristicFn = (id, goalId, nodes) => {
  const current = nodes.get(id);
  const goal = nodes.get(goalId);
  if (!current || !goal) return 0;
  return haversineDistance([current.lat, current.lng], [goal.lat, goal.lng]);
};
