## tauri-encoder-example
<img src="https://github.com/user-attachments/assets/b1d59e31-24ad-4463-bb59-52be8c5bfd53" width="500">
<br>


<br><br>
Tauri 2.0와 FFmpeg 바이너리를 활용해 데스크톱 인코더 앱 만들기<br>
이 프로그램은 제작자 본인의 Rust 언어 학습 목적으로 제작되었습니다.
<br>
<br>

## 라이브러리

- 프론트엔드 프레임워크 : React + Tauri
- 백엔드 : Rust + Tauri
- 리액트 상태관리 : Zustand
- 컴포넌트 디자인 : Material UI
- 애니메이션 관련 : Framer Motion
<br>

## 빌드 시 유의사항
github의 업로드 용량 제한으로 인해 FFmpeg 바이너리가 빠져있습니다.<br>
FFmpeg는 아래 링크에서 다운로드 할 수 있습니다.
<br>
<h3>FFmpeg 다운로드</h3>
https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z
<br><br><br>
압축 해제 후 바이너리의 이름을 변경한 뒤 아래 프로젝트의 경로에 넣습니다.

```
./src-tauri/bin/ffmpeg-x86_64-pc-windows-msvc.exe
./src-tauri/bin/ffprobe-x86_64-pc-windows-msvc.exe
```

## TO-DO
- 파일 멀티플 옵션 활성화하기
- yt-dlp 바이너리 통합
