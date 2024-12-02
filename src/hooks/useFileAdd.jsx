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
    if (selected == null) return;
    // 확장자 검사
    const filtered = selected.filter((file) =>
      [
        "mp4",
        "mkv",
        "mov",
        "ts",
        "avi",
        "webm",
        "flv",
        "wmv",
        "m4v",
        "mpg",
        "mpeg",
        "m4a",
        "flac",
        "mp3",
        "wav",
        "aac",
        "opus",
      ].includes(file.split(".").pop())
    );

    // status가 false인 경우 검사
    const pathNames = path.map((item) => item.path);
    const exist = filtered.filter((file) => pathNames.includes(file))?.[0];
    if (exist && !path.find((p) => p.path === exist).status) {
      path.find((p) => p.path === exist).status = true;
    }
    console.log(filtered);
    console.log(path);
    const unique = filtered.filter((file) => !pathNames.includes(file));

    const newPath = unique.map((p) => ({ path: p, status: true, isAudio: audioCheck(p) }));

    setListIndex(path.length);
    const paths = [...path, ...newPath];
    setPath(paths);
  };

  return { addFile, listIndex };
};

const audioCheck = (path) => {
  return ["mp3", "wav", "aac", "m4a", "flac", "opus"].includes(path.split(".").pop());
};
