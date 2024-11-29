use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_fs::FsExt;

// State 구조체를 Arc<Mutex>를 사용하도록 변경
struct State {
    ffmpeg_process: Mutex<Option<CommandChild>>,
    is_encoding: Mutex<bool>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = State {
        ffmpeg_process: Mutex::new(None),
        is_encoding: Mutex::new(false),
    };

    tauri::Builder
        ::default()
        .manage(state)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let scope = app.fs_scope();

            #[cfg(target_os = "windows")]
            {
                for drive in b'A'..=b'Z' {
                    let drive_path = format!("{}:\\", drive as char);
                    scope.allow_directory(&drive_path, true);
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
                scope.allow_directory("/*", false);
            }

            dbg!(scope.allowed());
            Ok(())
        })
        .on_window_event(move |event_app, event| {
            if let tauri::WindowEvent::Destroyed = event {
                println!("Window destroyed");
                if let Some(state) = event_app.try_state::<State>() {
                    if let Some(process) = state.ffmpeg_process.lock().unwrap().take() {
                        if let Err(e) = process.kill() {
                            eprintln!("FFmpeg 프로세스 종료 중 오류 발생: {}", e);
                        } else {
                            println!("FFmpeg 프로세스가 정상적으로 종료되었습니다.");
                        }
                    }
                }
            }
        })
        .invoke_handler(
            tauri::generate_handler![batch_video_encode, abort_encoding, get_video_info]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde::{ Deserialize, Serialize };
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize, Deserialize)]
struct VideoMetadata {
    frame: String,
    fps: f32,
    path: String,
}

#[tauri::command]
async fn get_video_info(app: tauri::AppHandle, path: String) -> Result<VideoMetadata, String> {
    let fps_output = app
        .shell()
        .command("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=r_frame_rate",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            &path,
        ])
        .output().await
        .map_err(|e| e.to_string())?;

    let frame_output = app
        .shell()
        .command("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-count_packets",
            "-show_entries",
            "stream=nb_read_packets",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            &path,
        ])
        .output().await
        .map_err(|e| e.to_string())?;
    let fps = String::from_utf8_lossy(&fps_output.stdout)
        .trim()
        .to_string()
        .split('/')
        .map(|x| x.parse::<f32>().unwrap())
        .collect::<Vec<f32>>();

    let fps = if fps.len() == 2 { fps[0] / fps[1] } else { fps[0] };

    let result = VideoMetadata {
        frame: String::from_utf8_lossy(&frame_output.stdout).trim().to_string(),
        fps,
        path,
    };

    Ok(result)
}

#[tauri::command]
async fn batch_video_encode(
    window: tauri::Window,
    app: tauri::AppHandle,
    state: tauri::State<'_, State>,
    data: Vec<Video>
) -> Result<String, String> {
    *state.is_encoding.lock().unwrap() = true;

    for (index, video) in data.iter().enumerate() {
        if !*state.is_encoding.lock().unwrap() {
            window
                .emit("encoding-aborted", "인코딩이 중단되었습니다.")
                .expect("failed to emit event");
            return Ok("인코딩이 중단되었습니다.".to_string());
        }

        let mut medium: Vec<String> = vec![];
        let video_crf_string = video.video_crf.to_string();

        medium.extend_from_slice(
            &[
                "-y".to_string(),
                "-i".to_string(),
                video.input_path.clone(),
                "-c:v".to_string(),
                video.video_encoder.clone(),
                "-preset".to_string(),
                video.video_preset.clone(),
                "-crf".to_string(),
                video_crf_string,
                "-c:a".to_string(),
                video.audio_encoder.clone(),
                "-b:a".to_string(),
                video.audio_bitrate.clone(),
            ]
        );

        if !video.video_params_tag.is_empty() {
            medium.push(video.video_params_tag.clone());
            medium.push(video.video_params.clone());
        }

        medium.push(video.output_path.clone());

        let cmd = app.shell().command("ffmpeg").args(&medium);
        println!("Processing video {}/{}: {:?}", index + 1, data.len(), cmd);

        let (mut rx, child) = cmd.spawn().expect("Failed to spawn ffmpeg command");
        *state.ffmpeg_process.lock().unwrap() = Some(child);

        // 각 비디오의 인코딩 진행 상황 처리
        while let Some(event) = rx.recv().await {
            use tauri_plugin_shell::process::CommandEvent;
            use tauri_plugin_shell::ShellExt;
            if let CommandEvent::Stderr(line_bytes) = event {
                let line = String::from_utf8_lossy(&line_bytes).replace('\r', "");
                println!("{:?}", line);
                use tauri::Emitter;
                window
                    .emit(
                        "encoding-progress",
                        Some(format!("Video {}/{}: {}", index + 1, data.len(), line))
                    )
                    .expect("failed to emit event");
            }
        }
    }

    use tauri::Emitter;
    window.emit("encoding-finished", "All encodings finished").expect("failed to emit event");

    *state.is_encoding.lock().unwrap() = false;
    Ok("".to_string())
}

#[derive(Debug, Serialize, Deserialize)]
struct Video {
    input_path: String,
    output_path: String,
    video_encoder: String,
    audio_encoder: String,
    video_preset: String,
    video_crf: u8,
    audio_bitrate: String,
    video_params_tag: String,
    video_params: String,
}

#[tauri::command]
async fn abort_encoding(state: tauri::State<'_, State>) -> Result<String, String> {
    *state.is_encoding.lock().unwrap() = false;

    if let Some(process) = state.ffmpeg_process.lock().unwrap().take() {
        match process.kill() {
            Ok(_) => {
                println!("FFmpeg process terminated successfully");
                Ok("인코딩이 중단되었습니다.".to_string())
            }
            Err(e) => Err(format!("프로세스 종료 중 오류 발생: {}", e)),
        }
    } else {
        Ok("실행 중인 인코딩 프로세스가 없습니다.".to_string())
    }
}
