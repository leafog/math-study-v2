import { create } from "zustand";
import { combine } from "zustand/middleware";

import { createSelectors } from "./create-selectors";

export type CachedTopic = {
  id: string;
  name: string;
  subject: string;
};

export type CachedEdge = {
  prerequisite_id: string;
  topic_id: string;
  strength: "hard" | "soft";
};

type KgTopicsState = {
  topics: CachedTopic[];
  edges: CachedEdge[];
};

type KgTopicsActions = {
  setTopics: (topics: CachedTopic[]) => void;
  setEdges: (edges: CachedEdge[]) => void;
};

const kgTopicsStore = create(
  combine<KgTopicsState, KgTopicsActions>({ topics: [], edges: [] }, (set) => ({
    setTopics: (topics) => set({ topics }),
    setEdges: (edges) => set({ edges }),
  })),
);

const useKgTopicsStore = createSelectors(kgTopicsStore);
export { useKgTopicsStore, kgTopicsStore };
