import { create } from "zustand";
import type { Connector, Expert, Skill } from "../models/workspace";

interface WorkspaceState {
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

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  experts: [],
  skills: [],
  connectors: [],
  setExperts: (experts) => set({ experts }),
  upsertExpert: (expert) => set((state) => ({ experts: [...state.experts.filter((item) => item.id !== expert.id), expert] })),
  setSkills: (skills) => set({ skills }),
  upsertSkill: (skill) => set((state) => ({ skills: [...state.skills.filter((item) => item.id !== skill.id), skill] })),
  setConnectors: (connectors) => set({ connectors }),
  upsertConnector: (connector) => set((state) => ({ connectors: [...state.connectors.filter((item) => item.id !== connector.id), connector] })),
}));

export const workspaceStore = useWorkspaceStore.getState;
