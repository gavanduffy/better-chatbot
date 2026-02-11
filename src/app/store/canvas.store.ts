"use client";
import { create } from "zustand";

export interface CanvasArtifact {
  title: string;
  type: "react" | "html" | "presentation";
  content: any; // string for react/html, object for presentation
}

export interface CanvasState {
  isOpen: boolean;
  artifact: CanvasArtifact | null;
}

export interface CanvasDispatch {
  openCanvas: (artifact: CanvasArtifact) => void;
  closeCanvas: () => void;
  setArtifact: (artifact: CanvasArtifact) => void;
}

const initialState: CanvasState = {
  isOpen: false,
  artifact: null,
};

export const useCanvasStore = create<CanvasState & CanvasDispatch>((set) => ({
  ...initialState,
  openCanvas: (artifact) => set({ isOpen: true, artifact }),
  closeCanvas: () => set({ isOpen: false }),
  setArtifact: (artifact) => set({ artifact }),
}));
