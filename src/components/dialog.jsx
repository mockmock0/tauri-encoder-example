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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import "../css/option.css";
const theme = createTheme({
  palette: {
    mode: "dark",
  },
});
import useStore from "../stores";

const AlertDialog = () => {
  const { longpress, setLongpress } = useStore();
  const { handleRemove } = useFileRemove();
  const handleClose = () => {
    setLongpress({
      state: false,
      target: longpress.target,
    });
  };
  const removeFile = () => {
    handleClose();
    handleRemove(longpress.target);
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
          <DialogActions
            sx={{ justifyContent: "center", minWidth: "25rem", padding: 0, margin: 0, gap: 0, flexWrap: "nowrap" }}
          >
            <Button onClick={handleClose} sx={{ width: "100%", padding: "10px 0", margin: 0, flexGrow: 1 }}>
              No
            </Button>
            <Button onClick={removeFile} sx={{ width: "100%", padding: "10px 0", margin: 0, flexGrow: 1 }}>
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    </ThemeProvider>
  );
};

const PresetDialog = () => {
  const { encOption, setEncOption, suffix, setSuffix } = useStore();
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
    if ([target] == "video_params") {
      switch (encOption.video_encoder) {
        case "libx264":
          setEncOption({
            ...encOption,
            video_params_tag: "-x264-params",
            video_params: e.target.value,
          });
          break;
        case "libx265":
          setEncOption({
            ...encOption,
            video_params_tag: "-x265-params",
            video_params: e.target.value,
          });
          break;
        case "libsvtav1":
          setEncOption({
            ...encOption,
            video_params_tag: "-svtav1-params",
            video_params: e.target.value,
          });
          break;
      }
    } else if ([target] == "video_encoder") {
      setEncOption({
        ...encOption,
        video_encoder: e.target.value,
        video_preset: e.target.value == "libx264" ? "medium" : e.target.value == "libx265" ? "veryfast" : "9",
      });
    } else if ([target] == "video_crf") {
      let copy = e.target.value;
      if (copy < 0 || copy > 51) copy = 23;
      setEncOption({
        ...encOption,
        [target]: copy,
      });
    } else {
      setEncOption({
        ...encOption,
        [target]: e.target.value,
      });
    }
    setJSON("encode_option", encOption);
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
              borderRadius: ".75rem", // 원하는 값으로 조정 가능
            },
          }}
        >
          <DialogTitle>Option</DialogTitle>
          <DialogContent id="option-content" sx={{ overflowY: "hidden" }}>
            <Box sx={{ minWidth: 120, p: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="encoder-select-label">Video Encoder</InputLabel>
                <Select
                  labelId="encoder-select-label"
                  id="encoder-select"
                  value={encOption.video_encoder}
                  label="Video Encoder"
                  onBlur={(e) => handleChange(e, "video_encoder")}
                  onChange={(e) => handleChange(e, "video_encoder")}
                >
                  <MenuItem className="option-item" value={"libx264"}>
                    x264
                  </MenuItem>
                  <MenuItem className="option-item" value={"libx265"}>
                    x265
                  </MenuItem>
                  <MenuItem className="option-item" value={"libsvtav1"}>
                    SVT-AV1
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 120, p: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="preset-select-label">Video Preset</InputLabel>
                <Select
                  key="preset-select"
                  defaultValue={
                    encOption.video_encoder == "libx264"
                      ? "medium"
                      : encOption.video_encoder == "libx265"
                      ? "veryfast"
                      : encOption.video_encoder == "libsvtav1"
                      ? "9"
                      : null
                  }
                  labelId="preset-select-label"
                  id="preset-select"
                  value={encOption.video_preset}
                  label="Video Preset"
                  onBlur={(e) => handleChange(e, "video_preset")}
                  onChange={(e) => handleChange(e, "video_preset")}
                >
                  {preset(encOption.video_encoder).map((item, index) => (
                    <MenuItem className="option-item" key={item + "-" + index} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 120, p: 1, width: "100%" }}>
              <TextField
                label="CRF"
                value={encOption.video_crf}
                max={51}
                min={0}
                sx={{ width: "100%" }}
                onBlur={(e) => handleChange(e, "video_crf")}
                onChange={(e) => handleChange(e, "video_crf")}
              />
            </Box>
            <Box sx={{ minWidth: 120, p: 1, width: "100%" }}>
              <TextField
                label="Video Params"
                value={encOption.video_params}
                sx={{ width: "100%" }}
                onBlur={(e) => handleChange(e, "video_params")}
                onChange={(e) => handleChange(e, "video_params")}
              />
            </Box>
            <Box sx={{ minWidth: 120, p: 1, width: "100%" }}>
              <TextField
                label="Suffix"
                value={suffix}
                sx={{ width: "100%" }}
                onBlur={(e) => setSuffix(e.target.value)}
                onChange={(e) => setSuffix(e.target.value)}
              />
            </Box>
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

const setJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getJSON = (key) => {
  return JSON.parse(localStorage.getItem(key));
};
