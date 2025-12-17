import { aStarAlgorithm } from "./aStar";
import { bfsAlgorithm } from "./bfs";
import { dfsAlgorithm } from "./dfs";
import { dijkstraAlgorithm } from "./dijkstra";
import { greedyBestFirstAlgorithm } from "./greedyBestFirst";
import { bidirectionalDijkstraAlgorithm } from "./bidirectionalDijkstra";
import { bidirectionalAStarAlgorithm } from "./bidirectionalAStar";
import { bidirectionalDFSAlgorithm } from "./bidirectionalDFS";
import { bidirectionalGreedyBestFirstAlgorithm } from "./bidirectionalGreedyBestFirst";
import { AlgorithmKey, PathfindingAlgorithm } from "./types";

export const algorithms: Record<AlgorithmKey, PathfindingAlgorithm> = {
  dijkstra: dijkstraAlgorithm,
  astar: aStarAlgorithm,
  bfs: bfsAlgorithm,
  dfs: dfsAlgorithm,
  greedy: greedyBestFirstAlgorithm,
  "bidi-dijkstra": bidirectionalDijkstraAlgorithm,
  "bidi-astar": bidirectionalAStarAlgorithm,
  "bidi-dfs": bidirectionalDFSAlgorithm,
  "bidi-greedy": bidirectionalGreedyBestFirstAlgorithm,
  typical: {
    key: "typical",
    label: "Typical routing (typical search)",
    run: () => {
      throw new Error("Typical routing is handled via external service.");
    }
  }
};

export const algorithmList: PathfindingAlgorithm[] = [
  ...Object.values(algorithms)
];
