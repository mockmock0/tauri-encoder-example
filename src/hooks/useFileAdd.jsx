import { open } from "@tauri-apps/plugin-dialog";
import useStore from "../stores";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const useFileAdd = () => {
  const { path, setPath } = useStore();
  const [listIndex, setListIndex] = useState(0);

  const addFile = async () => {
    const selected = await open({
      multiple: true,
    });

    // 확장자 검사
    const filtered = selected.filter(
      (file) =>
        file.endsWith(".mp4") ||
        file.endsWith(".mkv") ||
        file.endsWith(".mov") ||
        file.endsWith(".avi") ||
        file.endsWith(".webm") ||
        file.endsWith(".flv") ||
        file.endsWith(".wmv") ||
        file.endsWith(".m4v") ||
        file.endsWith(".mpg") ||
        file.endsWith(".mpeg") ||
        file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".m4a") ||
        file.endsWith(".opus")
    );

    // 중복 검사
    const unique = filtered.filter((file) => !path.includes(file));

    setListIndex(path.length);
    const paths = [...path, ...unique];
    setPath(paths);
    console.log(paths);
  };

  return { addFile, listIndex };
};
