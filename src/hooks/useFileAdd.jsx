import { open } from "@tauri-apps/plugin-dialog";
import useStore from "../stores";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const useFileAdd = () => {
  const { path, setPath } = useStore();
  const [listIndex, setListIndex] = useState(0);

  const addFile = async (type, e) => {
    let selected = [];
    if (type !== "drag-drop") {
      selected = await open({
        multiple: true,
      });
    } else {
      selected = e.payload.paths;
    }
    // 확장자 검사
    const filtered = selected.filter(
      (file) =>
        file.endsWith(".mp4") ||
        file.endsWith(".mkv") ||
        file.endsWith(".mov") ||
        file.endsWith(".ts") ||
        file.endsWith(".avi") ||
        file.endsWith(".webm") ||
        file.endsWith(".flv") ||
        file.endsWith(".wmv") ||
        file.endsWith(".m4v") ||
        file.endsWith(".mpg") ||
        file.endsWith(".mpeg") ||
        file.endsWith(".m4a") ||
        file.endsWith(".flac") ||
        file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".aac") ||
        file.endsWith(".opus")
    );


    // 중복 검사
    const pathNames = path.map((item) => item.path);
    const unique = filtered.filter((file) => !pathNames.includes(file));

    const newPath = unique.map((p) => ({ path: p, status: true, isAudio: audioCheck(p) }));

    setListIndex(path.length);
    const paths = [...path, ...newPath];
    setPath(paths);
  };

  return { addFile, listIndex };
};

const audioCheck = (path) => {
  return (
    path.split(".").pop().includes("mp3") ||
    path.split(".").pop().includes("wav") ||
    path.split(".").pop().includes("aac") ||
    path.split(".").pop().includes("m4a") ||
    path.split(".").pop().includes("flac") ||
    path.split(".").pop().includes("opus")
  );
};
