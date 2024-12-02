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
import LoadPage from "./loadPage";
import { useFileAdd } from "../hooks/useFileAdd";
import useFileRemove from "../hooks/fileRemove";
import VideocamIcon from "@mui/icons-material/Videocam";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import AddIcon from "@mui/icons-material/Add";

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
    init,
    setInit,
  } = useStore();

  const [listIndex, setListIndex] = useState(0);
  const [percent, setPercent] = useState(0);

  const { addFile } = useFileAdd();
  const { handleFileRemove } = useFileRemove();

  const openOption = async () => {
    setEncOption({
      ...encOption,
      state: true,
    });
    console.log(await invoke("get_gpu_info"));
  };

  const handleRemove = (target) => {
    handleFileRemove(target);
  };

  const longPressHandlers = useLongPress((e) => {
    console.log(e.target.dataset.path);
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
    setInit(true);
    setVideoInfo([]);
    setPercent(0);
    setIsEncoding(true);
    let pathCopy = [...path];
    setPath(pathCopy.filter((item) => item.status));
    let copy = [];
    for (let item of pathCopy) {
      const info = await invoke("get_video_info", { path: item.path });
      copy.push({ path: item.path, frame: info.frame, fps: info.fps, isEncoded: false });
      await setJSON("videoInfo", [...copy]);
    }
    const info = await getJSON("videoInfo");
    setVideoInfo(info);
    // encode 옵션 store에서 가져오기
    const { video_encoder, video_preset, video_crf, video_params_tag, video_params } = encOption;

    const data = [];
    for (let item of info) {
      data.push({
        input_path: item.path,
        output_path: item.path.slice(0, -item.path.split(".").pop().length) + suffix + ".mp4",
        video_encoder: video_encoder,
        video_preset: video_preset,
        video_crf: Number(video_crf),
        audio_encoder: "libopus",
        audio_bitrate: "128k",
        video_params_tag: video_params_tag,
        video_params: video_params,
      });
    }
    console.log(data);
    await invoke("batch_video_encode", { data: data });
  };

  const handleStop = async () => {
    setIsEncoding(false);
    setVideoInfo([]);
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

      // 인코딩 시작 지점 파악
      if (cmd.includes("ffmpeg version")) {
        setInit(false);
        processMsg.currentFrame = "0";
        processMsg.currentFPS = "0";
        setPercent(0);
      }

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
        }
      }
    });

    return () => {
      unsubscribe.then((f) => f());
    };
  }, [isEncoding, videoInfo, processMsg]);

  useEffect(() => {
    // 드래그 앤 드롭 이벤트 처리
    let unlisten = listen("tauri://drag-drop", (e) => {
      if (!isEncoding) {
        addFile("drag-drop", e);
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [path]);

  useEffect(() => {
    let unlisten = listen("encoding-finished", (e) => {
      if (e.payload === "All encodings finished") {
        setIsEncoding(false);
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [path]);
  return (
    <>
      {init && <LoadPage msg="Initializing..." />}
      <div className="progress-container">
        {path.length > 0 &&
          path.map((p, index) => {
            return (
              <>
                <motion.div
                  key={p.path + "-" + index + "-motion"}
                  className="progress-element"
                  style={{
                    width: "100%",
                    maxWidth: "35rem",
                  }}
                  sx={{}}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={
                    p.status
                      ? { opacity: 1, scale: 1, height: "auto", marginBottom: "1.125rem" }
                      : { opacity: 0, scale: 0.5, height: "0", marginBottom: "0" }
                  }
                  transition={{
                    duration: 0.4,
                    delay: 0,
                    ease: [0, 0.71, 0.2, 1.01],
                  }}
                >
                  <Button
                    key={p.path + "-" + index + "-button"}
                    data-path={p.path}
                    disabled={isEncoding == true}
                    variant="contained"
                    style={{
                      width: "calc(100% - 2rem)",
                      margin: "0 1rem",
                      height: "4rem",
                      position: "relative",
                      padding: "0 3rem 0 1rem",
                      fontSize: "1.125rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    sx={{
                      transition: "all 0.3s ease",
                      borderRadius: "20px",
                      textAlign: "left",
                      backgroundColor: blue[400], // 기본 배경색
                      "&:hover": {
                        backgroundColor: red[400], // 호버 시 배경색
                      },
                      "&:disabled": {
                        transition: "background 0.3s ease",
                        color: isEncoding ? "white" : "black",
                        background: videoInfo?.[index]?.isEncoded ? blue[300] : grey[800], // 비활성화 시 배경색
                      },
                      "& .MuiButton-label": {
                        position: "relative",
                        zIndex: 10000011,
                      },
                    }}
                    // onMouseDown={() => {
                    //   setLongpress({
                    //     target: p,
                    //     state: false,
                    //   });
                    // }}
                    // {...longPressHandlers}
                    onClick={() => {
                      if (localStorage.getItem("dont-show-again") !== "true") {
                        setLongpress({
                          target: p.path,
                          state: true,
                        });
                        console.log(p.path);
                      } else {
                        handleFileRemove({ path: p.path });
                      }
                    }}
                  >
                    <div
                      data-path={p.path}
                      style={{
                        fontWeight: "400",
                        fontSize: "1.125rem",
                        textAlign: "left",
                        lineHeight: "4rem",
                        whiteSpace: "nowrap",
                        overflow: "visible",
                        justifyContent: "flex-start",
                        boxShadow:
                          videoInfo.find((item) => !item.isEncoded)?.path === p.path && isFinite(percent)
                            ? "0 0 10px 5px rgba(251, 194, 235, 1), 0 0 14px 7px rgba(251, 194, 235, 1)"
                            : "none",
                        width:
                          videoInfo.find((item) => !item.isEncoded)?.path === p.path && isFinite(percent)
                            ? `calc(calc(100% * ${percent}) / 100 )`
                            : !videoInfo?.[index]?.isEncoded
                            ? 0
                            : isEncoding
                            ? "100%"
                            : 0,
                        position: "absolute",
                        left: "0",
                        height: "100%",
                        background: "linear-gradient(90deg, rgba(161, 140, 209, 0.4) 0%, rgba(251, 194, 235, 1) 100%)",
                        mixBlendMode: "normal ",
                        transition: "all 0.3s ease",
                        backdropFilter: "blur(100px)",
                      }}
                    ></div>
                    <span style={{ width: "100%", padding: "0 0 0 .5rem", zIndex: 2 }}>
                      {p.isAudio ? (
                        <AudiotrackIcon
                          style={{
                            fontSize: "1.5rem",
                            verticalAlign: "middle",
                            marginRight: "0.5rem",
                            marginBottom: ".2rem",
                          }}
                        />
                      ) : (
                        <VideocamIcon
                          style={{
                            fontSize: "1.5rem",
                            verticalAlign: "middle",
                            marginRight: "0.5rem",
                            marginBottom: ".2rem",
                          }}
                        />
                      )}
                      {p.path.split("\\").pop()}
                    </span>
                  </Button>
                </motion.div>
              </>
            );
          })}
        <motion.div
          key="file-add"
          className="progress-element"
          style={{
            display: "flex",
            justifyContent: "center",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={path.some((item) => item.status) ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{
            duration: 0.4,
            delay: 0,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          <Button
            id="file-add"
            variant="contained"
            onClick={addFile}
            sx={{
              width: "calc(100vw - 2rem)",

              maxWidth: "33rem",
              margin: "0 1rem",
              height: "4rem",
              borderRadius: "20px",
              border: "1px solid #414141",
              backgroundColor: "#121212",
              "&:hover": {
                backgroundColor: "#191919",
                border: "1px solid #191919",
              },
            }}
          >
            <AddIcon sx={{ color: "#828282" }} />
          </Button>
        </motion.div>
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
