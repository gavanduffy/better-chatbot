"use client";
import { DBWorkflow } from "app-types/workflow";
import { generateUUID } from "lib/utils";
import { create } from "zustand";
import { Edge } from "@xyflow/react";
import { UINode } from "lib/ai/workflow/workflow.interface";

export interface WorkflowState {
  workflow?: DBWorkflow;
  processIds: string[];
  hasEditAccess?: boolean;
  generatedWorkflow?: {
    nodes: UINode[];
    edges: Edge[];
    metadata: {
      name: string;
      description?: string;
    };
  };
}

export interface WorkflowDispatch {
  init: (workflow?: DBWorkflow, hasEditAccess?: boolean) => void;
  addProcess: () => () => void;
  setGeneratedWorkflow: (workflow: {
    nodes: UINode[];
    edges: Edge[];
    metadata: {
      name: string;
      description?: string;
    };
  }) => void;
  clearGeneratedWorkflow: () => void;
}

const initialState: WorkflowState = {
  processIds: [],
};

export const useWorkflowStore = create<WorkflowState & WorkflowDispatch>(
  (set) => ({
    ...initialState,
    init: (workflow, hasEditAccess) =>
      set({ ...initialState, workflow, hasEditAccess }),
    addProcess: () => {
      const processId = generateUUID();
      set((state) => ({
        processIds: [...state.processIds, processId],
      }));
      return () => {
        set((state) => ({
          processIds: state.processIds.filter((id) => id !== processId),
        }));
      };
    },
    setGeneratedWorkflow: (generatedWorkflow) => set({ generatedWorkflow }),
    clearGeneratedWorkflow: () => set({ generatedWorkflow: undefined }),
  }),
);
