import { create } from "zustand";
import type { Reservoir, AlertItem, Command } from "../types";
import { reservoirs } from "../data/reservoir";
import { alerts, commands } from "../data/command";

interface AppState {
  selectedReservoir: Reservoir | null;
  alerts: AlertItem[];
  commands: Command[];
  currentUser: {
    name: string;
    role: string;
  };
  setSelectedReservoir: (reservoir: Reservoir | null) => void;
  addAlert: (alert: AlertItem) => void;
  updateCommandStatus: (id: string, status: Command["status"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedReservoir: reservoirs[0],
  alerts: alerts,
  commands: commands,
  currentUser: {
    name: "张调度",
    role: "调度员",
  },
  setSelectedReservoir: (reservoir) => set({ selectedReservoir: reservoir }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),
  updateCommandStatus: (id, status) =>
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === id ? { ...cmd, status } : cmd
      ),
    })),
}));
