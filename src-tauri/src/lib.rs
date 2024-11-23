use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_fs::FsExt;

// State 구조체를 Arc<Mutex>를 사용하도록 변경
struct State {
    ffmpeg_process: Mutex<Option<CommandChild>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = State {
        ffmpeg_process: Mutex::new(None),
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
        .invoke_handler(tauri::generate_handler![encode_video, abort_encoding, get_video_info])
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
async fn encode_video(
    window: tauri::Window,
    app: tauri::AppHandle,
    state: tauri::State<'_, State>,
    data: Video
) -> Result<String, String> {
    let video_crf_string = data.video_crf.to_string();

    let mut medium = vec![
        "-y",
        "-i",
        &data.input_path,
        "-c:v",
        &data.video_encoder,
        "-preset",
        &data.video_preset,
        "-crf",
        &video_crf_string,
        "-c:a",
        &data.audio_encoder,
        "-b:a",
        &data.audio_bitrate
    ];
    if !data.video_params_tag.is_empty() {
        medium.push(&data.video_params_tag);
        medium.push(&data.video_params);
    }

    medium.push(&data.output_path);

    use tauri_plugin_shell::process::CommandEvent;
    use tauri_plugin_shell::ShellExt;
    let cmd = app.shell().command("ffmpeg").args(&medium);
    let (mut rx, child) = cmd.spawn().expect("Failed to spawn ffmpeg command");

    // 프로세스를 상태에 저장
    *state.ffmpeg_process.lock().unwrap() = Some(child);

    // 이벤트 처리는 별도로 수행
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stderr(line_bytes) = event {
                let line = String::from_utf8_lossy(&line_bytes).replace('\r', "");
                println!("{:?}", line);
                use tauri::Emitter;
                window
                    .emit("encoding-progress", Some(format!("{}", line)))
                    .expect("failed to emit event");
            }
        }
    });
    Ok("".to_string())
}

#[tauri::command]
async fn abort_encoding(state: tauri::State<'_, State>) -> Result<String, String> {
    if let Some(process) = state.ffmpeg_process.lock().unwrap().take() {
        // SIGTERM 시그널 보내기
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
