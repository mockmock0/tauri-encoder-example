import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import useFileRemove from "../hooks/fileRemove";
import FlashOnIcon from "@mui/icons-material/FlashOn"; // GPU fast
import BoltIcon from "@mui/icons-material/Bolt"; // fast
import CompressIcon from "@mui/icons-material/Compress"; // quality
import ClearAllIcon from "@mui/icons-material/ClearAll"; // balance

import ToggleButton from "@mui/material/ToggleButton";
import "../css/dialog.css";

import "../css/option.css";
const theme = createTheme({
  palette: {
    mode: "dark",
  },
});
import useStore from "../stores";

const AlertDialog = () => {
  const { longpress, setLongpress } = useStore();
  const { handleFileRemove } = useFileRemove();
  const handleClose = () => {
    setLongpress({
      state: false,
      target: longpress.target,
    });
  };
  const removeFile = () => {
    handleClose();
    handleFileRemove({ path: longpress.target });
  };
  const handleDontShowAgain = (e) => {
    localStorage.setItem("dont-show-again", e.target.checked);
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <React.Fragment>
        <Dialog
          open={longpress.state}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            style: {
              borderRadius: ".75rem", // 원하는 값으로 조정 가능
            },
          }}
        >
          <DialogTitle>Remove</DialogTitle>
          <DialogContent>
            <div style={{ marginBottom: "2rem" }}>{longpress.target}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FormControlLabel
                control={<Checkbox />}
                inputProps={{ "aria-label": "Do not show this message again" }}
                label="Do not show this message again"
                onChange={handleDontShowAgain}
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", minWidth: "25rem", padding: 0 }}>
            <Button onClick={removeFile} sx={{ width: "100%", padding: "10px 0" }}>
              Yes
            </Button>{" "}
            <Button onClick={handleClose} sx={{ width: "100%", padding: "10px 0" }}>
              No
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    </ThemeProvider>
  );
};

const PresetDialog = () => {
  const { encOption, setEncOption, suffix, setSuffix } = useStore();

  const [option, setOption] = React.useState("fast");
  React.useEffect(() => {
    if (getJSON("encode_option")) {
      setEncOption({ ...getJSON("encode_option"), state: false });
    }
    if (getJSON("suffix")) {
      setSuffix(getJSON("suffix"));
    }
  }, []);
  const handleClose = () => {
    setEncOption({
      ...encOption,
      state: false,
    });
  };
  const handleChange = (e, target) => {
    setOption(target);
    if (target === "GPU ON") {
      setEncOption({
        state: true,
        video_encoder: "h264_nvenc",
        video_preset: "p1",
        video_crf: 27,
        audio_encoder: "libfdk_aac",
        audio_bitrate: 128,
        video_params_tag: "",
        video_params: "",
      });
    } else if (target === "fast") {
      setEncOption({
        state: true,
        video_encoder: "libx264",
        video_preset: "ultrafast",
        video_crf: 21,
        audio_encoder: "libfdk_aac",
        audio_bitrate: 256,
        video_params_tag: "",
        video_params: "",
      });
    } else if (target === "balance") {
      setEncOption({
        state: true,
        video_encoder: "libx265",
        video_preset: "medium",
        video_crf: 27,
        audio_encoder: "libfdk_aac",
        audio_bitrate: 196,
        video_params_tag: "",
        video_params: "",
      });
    } else if (target === "quality") {
      setEncOption({
        state: true,
        video_encoder: "libsvtav1",
        video_preset: "4",
        video_crf: 45,
        audio_encoder: "libopus",
        audio_bitrate: 96,
        video_params_tag: "-svtav1-params",
        video_params: "film-grain=0,enable-variance-boost=1,variance-boost-strength=1",
      });
    }
  };

  const toggleTheme = (target) => {
    return {
      width: "100%",
      textAlign: "left",
      justifyContent: "flex-start",
      marginBottom: "1rem",
      padding: "1.5rem 1rem 1.5rem 2.5rem",
      borderRadius: "20px",
      flexGrow: 1,
      transition: "all 0.3s ease",
      background:
        target === "GPU ON" && option === target
          ? "linear-gradient(130deg, #330867, #a6c0fe, #e0c3fc)"
          : target === "fast" && option === target
          ? "linear-gradient(130deg, #a1c4fd, #c2e9fb, #e0c3fc)"
          : target === "balance" && option === target
          ? "linear-gradient(130deg, #a8edea, #fef9d7, #e0c3fc)"
          : target === "quality" && option === target
          ? "linear-gradient(130deg, #96fbc4, #d1fdff, #fef9d7)"
          : "#828282",
      backgroundSize: "300% 300%",
      "-webkit-animation": target === option ? "gpu-animation 12s ease infinite" : null,
      animation: target === option ? "gpu-animation 12s ease infinite" : null,
      color: target === option ? "#121212" : "#FFFFFF",
    };
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <React.Fragment>
        <Dialog
          open={encOption.state}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            style: {
              borderRadius: ".75rem",
            },
          }}
        >
          <DialogTitle>Preset</DialogTitle>
          <DialogContent id="option-content" sx={{ overflowY: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
              <ToggleButton
                value="GPU ON"
                aria-label="GPU ON"
                sx={toggleTheme("GPU ON")}
                className="toggle-GPU"
                onClick={() => handleChange(null, "GPU ON")}
              >
                <FlashOnIcon />
                <span>Fastest</span>
              </ToggleButton>
              <ToggleButton
                value="fast"
                aria-label="fast"
                sx={toggleTheme("fast")}
                className="toggle-speed"
                onClick={() => handleChange(null, "fast")}
              >
                <BoltIcon />
                <span>Speed</span>
              </ToggleButton>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
              <ToggleButton
                value="balance"
                aria-label="balance"
                sx={toggleTheme("balance")}
                className="toggle-balance"
                onClick={() => handleChange(null, "balance")}
              >
                <ClearAllIcon />
                <span>Balance</span>
              </ToggleButton>
              <ToggleButton
                value="quality"
                aria-label="quality"
                sx={toggleTheme("quality")}
                className="toggle-quality"
                onClick={() => handleChange(null, "quality")}
              >
                <CompressIcon />
                <span>Quality</span>
              </ToggleButton>
            </div>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", minWidth: "25rem", padding: 0 }}>
            <Button onClick={handleClose} sx={{ width: "100%", padding: "10px 0" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    </ThemeProvider>
  );
};

export { AlertDialog, PresetDialog };

const preset = (encoder) => {
  if (encoder === "libx264") {
    return ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower"];
  }
  if (encoder === "libx265") {
    return ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow", "placebo"];
  }
  if (encoder === "libsvtav1") {
    return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
  }
};

const quality = (encoder) => {
  if (encoder === "libx264") {
    return [
      {
        value: 17,
        label: "Best Mode",
      },
      {
        value: 23,
        label: "Balanced Mode",
      },
      {
        value: 51,
        label: "Fastest Mode",
      },
    ];
  }
};

const setJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getJSON = (key) => {
  return JSON.parse(localStorage.getItem(key));
};
