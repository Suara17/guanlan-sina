import { ArrowLeft, Maximize, Minimize, Play } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VideoPlayer: React.FC = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isVertical, setIsVertical] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [canPlay, setCanPlay] = useState(false)

  // 处理全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 同步背景视频
  useEffect(() => {
    if (bgVideoRef.current && videoRef.current) {
      if (isPlaying) {
        bgVideoRef.current.play().catch(() => {})
      } else {
        bgVideoRef.current.pause()
      }
    }
  }, [isPlaying])

  // 同步播放时间
  useEffect(() => {
    if (bgVideoRef.current && videoRef.current && isPlaying) {
      const syncTime = () => {
        if (bgVideoRef.current && videoRef.current) {
          bgVideoRef.current.currentTime = videoRef.current.currentTime
        }
      }
      const interval = setInterval(syncTime, 1000)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const handlePlay = async () => {
    console.log('handlePlay called, isPlaying:', isPlaying, 'canPlay:', canPlay)
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pause()
        } else {
          setHasStarted(true)
          console.log('Attempting to play video...')
          if (videoRef.current.readyState < 2) {
            console.log('Video not ready, waiting...')
            await new Promise((resolve) => {
              const handler = () => {
                videoRef.current?.removeEventListener('canplay', handler)
                resolve(undefined)
              }
              videoRef.current?.addEventListener('canplay', handler)
              setTimeout(resolve, 3000)
            })
          }
          await videoRef.current.play()
          console.log('Video playing started')
        }
        setIsPlaying(!isPlaying)
      } catch (error) {
        console.error('播放失败:', error)
      }
    } else {
      console.error('videoRef.current is null')
    }
  }

  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    navigate('/')
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await containerRef.current.requestFullscreen()
    }
  }

  // 自动隐藏控制栏
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isPlaying && isFullscreen) {
      timeout = setTimeout(() => setShowControls(false), 3000)
    } else {
      setShowControls(true)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying, isFullscreen])

  // 检测视频是否为竖版
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current
      setIsVertical(videoHeight > videoWidth)
      setVideoLoaded(true)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black flex flex-col relative"
      onMouseMove={handleMouseMove}
    >
      {/* 顶部导航 - 全屏时可隐藏 */}
      <nav
        className={`flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">返回首页</span>
        </button>
        <h1 className="text-lg font-bold text-white">弈控经纬 · 产品宣传片</h1>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          <span className="hidden sm:inline font-medium">{isFullscreen ? '退出全屏' : '全屏'}</span>
        </button>
      </nav>

      {/* 视频播放区域 - 几乎全屏 */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* 竖版视频的模糊背景 */}
        {isVertical && videoLoaded && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              ref={bgVideoRef}
              className="w-full h-full object-cover blur-3xl scale-110"
              muted
              loop
              playsInline
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              <source src="/demo-video.webm" type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        <video
          ref={videoRef}
          className={`relative z-10 ${isVertical ? 'max-h-[85vh] max-w-[90vw] w-auto h-auto' : 'w-full h-full object-contain'}`}
          controls={hasStarted || isPlaying}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={handleVideoLoaded}
          onCanPlay={() => {
            console.log('Video can play')
            setCanPlay(true)
          }}
        >
          <source src="/demo-video.mp4" type="video/mp4" />
          <source src="/demo-video.webm" type="video/webm" />
          您的浏览器不支持视频播放
        </video>

        {/* 自定义播放按钮覆盖层 */}
        {!isPlaying && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all hover:bg-black/40 z-20"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:scale-110 transition-transform">
              <Play size={50} className="text-white ml-1" fill="currentColor" />
            </div>
          </button>
        )}
      </div>

      {/* 底部信息 - 全屏时可隐藏 */}
      <div
        className={`px-6 py-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <p className="text-center text-white/60 text-sm">弈控经纬 — 新一代工业数字孪生操作系统</p>
      </div>
    </div>
  )
}

export default VideoPlayer
