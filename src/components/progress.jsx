import useStore from "../stores";
import { useEffect, useState } from "react";
import "../css/progress.css";
import { Button } from "@mui/material";
import { motion } from "framer-motion";
import { open } from "@tauri-apps/plugin-dialog";
import { red, blue, grey } from "@mui/material/colors";
import { useLongPress } from "../hooks/useLongPress";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const Progress = () => {
  const {
    path,
    setPath,
    isEncoding,
    setIsEncoding,
    setLongpress,
    videoInfo,
    setVideoInfo,
    processMsg,
    setProcessMsg,
    encOption,
    suffix,
    setEncOption,
  } = useStore();

  const [listIndex, setListIndex] = useState(0);
  const [percent, setPercent] = useState(0);
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
        file.endsWith(".mpeg")
    );

    // 중복 검사
    const unique = filtered.filter((file) => !path.includes(file));

    setListIndex(path.length);
    const paths = [...path, ...unique];
    setPath(paths);
    console.log(paths);
  };

  const openOption = async () => {
    setEncOption({
      ...encOption,
      state: true,
    });
  };

  const handleRemove = (target) => {
    let copy = [...path];
    copy = copy.filter((p) => p !== target);
    setPath(copy);
  };

  const longPressHandlers = useLongPress((e) => {
    if (localStorage.getItem("dont-show-again") !== "true") {
      setLongpress({
        target: e.target.dataset.path,
        state: true,
      });
    } else {
      handleRemove(e.target.dataset.path);
    }
  }, 500);

  const handleStart = async () => {
    setIsEncoding(true);
    let copy = [];
    let pathcopy = [...path];
    for (let item of pathcopy) {
      const info = await invoke("get_video_info", { path: item });
      copy = [...copy, { path: item, frame: info.frame, fps: info.fps, isEncoded: false }];
      await setJSON("videoInfo", copy);
    }
    const info = await getJSON("videoInfo");
    setVideoInfo(info);
    // encode 옵션 store에서 가져오기
    const { video_encoder, video_preset, video_crf, video_params_tag, video_params } = encOption;

    const data = {
      input_path: info[0].path,
      output_path: info[0].path.slice(0, -info[0].path.split(".").pop().length) + suffix + ".mp4",
      video_encoder: video_encoder,
      video_preset: video_preset,
      video_crf: Number(video_crf),
      audio_encoder: "libopus",
      audio_bitrate: "128k",
      video_params_tag: video_params_tag,
      video_params: video_params,
    };
    await invoke("encode_video", { data: data });
  };

  const handleStop = async () => {
    setIsEncoding(false);
    await invoke("abort_encoding");
  };

  useEffect(() => {
    let unsubscribe = listen("encoding-progress", async (e) => {
      const cmd = e.payload;
      // 인코딩 내용 파싱
      const currentFrame = cmd.split("frame=")?.[1]?.split("fps=")?.[0]?.trim();
      const currentFPS = cmd.split("fps=")?.[1]?.split("q=")?.[0]?.trim();
      const size = cmd.split("size=")?.[1]?.split("time=")?.[0]?.trim();
      const remainedTime = cmd.split("time=")?.[1]?.split("bitrate=")?.[0]?.trim();
      const bitrate = cmd.split("bitrate=")?.[1]?.split("speed=")?.[0]?.trim();
      const speed = cmd.split("speed=")?.[1]?.trim();
      const msg = {
        currentFrame: currentFrame ?? "",
        currentFPS: currentFPS ?? "",
        size: size ?? "",
        remainedTime: remainedTime ?? "",
        bitrate: bitrate ?? "",
        speed: speed ?? "",
      };
      setProcessMsg(msg);

      // 인코딩 중간 과정 파악
      if (processMsg.currentFrame && processMsg.currentFrame !== "") {
        const current = videoInfo.find((item) => !item.isEncoded);
        const totalFrame = current?.frame ?? 0;
        const progress = (processMsg.currentFrame / totalFrame) * 100;
        setPercent(Math.round(progress, 2));
        console.log(processMsg.currentFrame, totalFrame, progress);
        if (!isFinite(percent) || percent >= 100) {
          setPercent(0);
          setProcessMsg({ ...processMsg, currentFrame: "0" });
        }
      }

      // 인코딩 끝 지점 파악
      const current = videoInfo.find((item) => !item.isEncoded);
      const totalFrame = current?.frame ?? 0;

      if (Number(currentFrame) === Number(totalFrame) && Number(currentFrame) !== 0 && Number(totalFrame) !== 0) {
        current.isEncoded = true;
        console.log(videoInfo);
        setVideoInfo(videoInfo);
        setJSON("videoInfo", videoInfo);

        // 리스트의 모든 파일이 인코딩되었는지 확인
        const updatedInfo = await getJSON("videoInfo");
        if (!updatedInfo.some((item) => !item.isEncoded)) {
          console.log("end of list");
          if (isEncoding) setIsEncoding(false);
        } else {
          const next = updatedInfo.find((item) => !item.isEncoded);
          console.log("call: ", next.path);
          const { video_encoder, video_preset, video_crf, video_params_tag, video_params } = encOption;

          const data = {
            input_path: next.path,
            output_path: next.path.slice(0, -next.path.split(".").pop().length) + suffix + ".mp4",
            video_encoder: video_encoder,
            video_preset: video_preset,
            video_crf: video_crf,
            audio_encoder: "libopus",
            audio_bitrate: "128k",
            video_params_tag: video_params_tag,
            video_params: video_params,
          };
          await invoke("encode_video", { data: data });
        }
      }
    });

    return () => {
      unsubscribe.then((f) => f());
    };
  }, [isEncoding, setIsEncoding, videoInfo, setVideoInfo, setProcessMsg, processMsg]);

  return (
    <>
      <div className="progress-container">
        {path.length > 0 &&
          path.map((p, index) => {
            return (
              <>
                <motion.div
                  key={p}
                  className="progress-element"
                  style={{
                    width: "100%",
                    maxWidth: "35rem",
                  }}
                  sx={{}}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + (index - listIndex - 1) * 0.1,
                    ease: [0, 0.71, 0.2, 1.01],
                  }}
                >
                  <div
                    id="progress-bar"
                    style={{
                      position: "absolute",
                      display: "flex",
                      width:
                        videoInfo.find((item) => !item.isEncoded)?.path === p && isFinite(percent)
                          ? `calc(${percent}% - 2rem)`
                          : videoInfo?.[index]?.isEncoded
                          ? "calc(100% - 2rem)"
                          : 0,
                      maxWidth: "35rem",
                      height: "4rem",
                      background: isEncoding
                        ? `linear-gradient(90deg, rgba(161, 140, 209, 0.4) 0%, rgba(251, 194, 235, 1) 100%)`
                        : "rgba(255, 255, 255, 0)",
                      borderRadius: "1rem",
                      zIndex: 100000,
                      pointerEvents: "none",
                      transition: "all 0.3s ease",
                      textAlign: "left",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      fontSize: "1.125rem",
                      fontFamily: "Roboto, Helvetica, Arial, sans-serif",
                      letterSpacing: "0.02857em",
                      overflow: "visible",
                      whiteSpace: "nowrap",
                      color: isEncoding ? (videoInfo?.[index]?.isEncoded ? "black" : "white") : "transparent",
                    }}
                  >
                    &nbsp;&nbsp;&nbsp;&nbsp;{p.split("\\").pop().toUpperCase()}
                  </div>
                  <Button
                    key={p}
                    data-path={p}
                    disabled={isEncoding == true}
                    variant="contained"
                    style={{
                      width: "100%",
                      height: "4rem",
                      position: "relative",
                      paddingLeft: "0",
                      fontSize: "1.125rem",
                    }}
                    sx={{
                      transition: "all 0.3s ease",
                      borderRadius: "1rem",
                      textAlign: "left",
                      justifyContent: "flex-start",
                      backgroundColor: blue[400], // 기본 배경색
                      "&:hover": {
                        backgroundColor: red[400], // 호버 시 배경색
                      },
                      "&:disabled": {
                        transition: "background 0.3s ease",
                        color: isEncoding ? "transparent" : "black",
                        background: videoInfo?.[index]?.isEncoded ? blue[300] : grey[800], // 비활성화 시 배경색
                      },
                      fontWeight: "400",
                      fontSize: "1.125rem",
                      height: "4rem",
                      "& .MuiButton-label": {
                        position: "relative",
                        zIndex: 10000011,
                      },
                    }}
                    onMouseDown={() => {
                      setLongpress({
                        target: p,
                        state: false,
                      });
                    }}
                    {...longPressHandlers}
                  >
                    &nbsp;&nbsp;&nbsp;&nbsp;{p.split("\\").pop()}
                  </Button>
                </motion.div>
              </>
            );
          })}
        <motion.div
          key="start-button"
          className="progress-element"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            position: "fixed",
            bottom: "2rem",
            width: "fit-content",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          {" "}
          {path.length > 0 && !isEncoding ? (
            <>
              <Button variant="contained" sx={{ width: "10rem" }} onClick={openOption}>
                Option
              </Button>
              <Button variant="contained" sx={{ width: "10rem" }} onClick={handleStart}>
                Start
              </Button>
            </>
          ) : isEncoding ? (
            <Button variant="contained" sx={{ width: "10rem" }} color="error" onClick={handleStop}>
              Abort
            </Button>
          ) : null}
        </motion.div>
      </div>
    </>
  );
};

export { Progress };

const getJSON = async (data) => {
  return JSON.parse(localStorage.getItem(data));
};

const setJSON = async (target, value) => {
  localStorage.setItem(target, JSON.stringify(value));
};
