import { useSyncExternalStore } from "react";
import type { Connector, Expert, Skill } from "../models/workspace";

export interface WorkspaceState {
  experts: Expert[];
  skills: Skill[];
  connectors: Connector[];
  setExperts: (items: Expert[]) => void;
  upsertExpert: (item: Expert) => void;
  setSkills: (items: Skill[]) => void;
  upsertSkill: (item: Skill) => void;
  setConnectors: (items: Connector[]) => void;
  upsertConnector: (item: Connector) => void;
}

type Snapshot = Pick<WorkspaceState, "experts" | "skills" | "connectors">;
let snapshot: Snapshot = { experts: [], skills: [], connectors: [] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const update = (patch: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...patch };
  emit();
};

export const workspaceStore: WorkspaceState = {
  get experts() { return snapshot.experts; },
  get skills() { return snapshot.skills; },
  get connectors() { return snapshot.connectors; },
  setExperts: (experts) => update({ experts }),
  upsertExpert: (expert) => update({ experts: [...snapshot.experts.filter((item) => item.id !== expert.id), expert] }),
  setSkills: (skills) => update({ skills }),
  upsertSkill: (skill) => update({ skills: [...snapshot.skills.filter((item) => item.id !== skill.id), skill] }),
  setConnectors: (connectors) => update({ connectors }),
  upsertConnector: (connector) => update({ connectors: [...snapshot.connectors.filter((item) => item.id !== connector.id), connector] }),
};

export function useWorkspaceStore<T>(selector: (state: WorkspaceState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(workspaceStore), () => selector(workspaceStore));
}
