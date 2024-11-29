import { create } from "zustand";

const useStore = create((set) => ({
  path: [],
  setPath: (path) => set({ path }),
  videoInfo: [], // { path: "", frame: "", fps: "", isEncoded: false }
  addVideoInfo: (info) => set((state) => ({ videoInfo: [...state.videoInfo, info] })),
  setVideoInfo: (info) => set({ videoInfo: info }),
  processMsg: {
    currentFrame: "",
    currentFPS: "",
    size: "",
    remainedTime: "",
    bitrate: "",
    speed: "",
  },
  setProcessMsg: (msg) => set({ processMsg: msg }),
  isEncoding: false,
  setIsEncoding: (isEncoding) => set({ isEncoding }),
  longpress: { state: false, target: null },
  setLongpress: (longpress) => set({ longpress }),
  encOption: {
    state: false,
    video_encoder: "libx264",
    video_preset: "ultrafast",
    video_crf: 23,
    audio_encoder: "libopus",
    audio_bitrate: 128,
    video_params_tag: "",
    video_params: "",
  },
  setEncOption: (option) => set({ encOption: option }),
  suffix: "_new",
  setSuffix: (suffix) => set({ suffix }),
  init: false,
  setInit: (init) => set({ init }),
}));

export default useStore;
