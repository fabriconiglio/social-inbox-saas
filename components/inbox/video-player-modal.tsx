"use client"

import React, { useState, useRef } from "react"
import { VideoPlayer } from "@/components/ui/video-player"
import { useVideoPlayer } from "@/hooks/use-video-player"

interface VideoPlayerModalProps {
  videos: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    poster?: string
    metadata?: {
      width: number
      height: number
      format: string
      fileSize: string
      duration: number
      bitrate: number
      frameRate: number
      codec: string
      createdAt?: string
    }
  }>
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
  onDownload?: (videoId: string) => void
  onShare?: (videoId: string) => void
  onFavorite?: (videoId: string) => void
  onBookmark?: (videoId: string) => void
}

export function VideoPlayerModal({
  videos,
  isOpen,
  onClose,
  initialIndex = 0,
  onDownload,
  onShare,
  onFavorite,
  onBookmark
}: VideoPlayerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentVideo = videos[currentIndex]

  const {
    state,
    metadata,
    play,
    pause,
    togglePlayPause,
    seek,
    skipBack,
    skipForward,
    setVolume,
    mute,
    unmute,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    setQuality,
    setSubtitle,
    toggleVolumeSlider,
    toggleSettings,
    toggleQualityMenu,
    toggleSubtitleMenu,
    togglePlaybackSpeedMenu,
    handleProgressClick,
    handleProgressHover,
    handleProgressLeave,
    formatTime,
    formatFileSize,
    resetPlayer
  } = useVideoPlayer(
    videoRef as React.RefObject<HTMLVideoElement>,
    containerRef as React.RefObject<HTMLDivElement>,
    currentVideo?.src || '',
    [], // qualities
    [] // subtitles
  )

  const handleDownload = (videoId: string) => {
    if (onDownload) {
      onDownload(videoId)
    } else {
      const video = videos.find(v => v.id === videoId)
      if (video) {
        const link = document.createElement('a')
        link.href = video.src
        link.download = video.name
        link.click()
      }
    }
  }

  const handleShare = (videoId: string) => {
    if (onShare) {
      onShare(videoId)
    } else {
      const video = videos.find(v => v.id === videoId)
      if (video && navigator.share) {
        navigator.share({
          title: video.name,
          url: video.src
        })
      }
    }
  }

  const handleFavorite = (videoId: string) => {
    if (onFavorite) {
      onFavorite(videoId)
    }
  }

  const handleBookmark = (videoId: string) => {
    if (onBookmark) {
      onBookmark(videoId)
    }
  }

  if (!isOpen || !currentVideo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl max-h-4xl mx-4">
        <VideoPlayer
          src={currentVideo.src}
          name={currentVideo.name}
          size={currentVideo.size}
          type={currentVideo.type}
          poster={currentVideo.poster}
          onClose={onClose}
          onDownload={() => handleDownload(currentVideo.id)}
          onShare={() => handleShare(currentVideo.id)}
          onFavorite={() => handleFavorite(currentVideo.id)}
          onBookmark={() => handleBookmark(currentVideo.id)}
          showMetadata={true}
          showControls={true}
          allowFullscreen={true}
          allowDownload={true}
          allowShare={true}
          allowFavorites={true}
          allowBookmarks={true}
          autoPlay={false}
          muted={true}
          loop={false}
          subtitles={[]}
          qualities={[]}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

// Componente wrapper para usar desde MessageComposer
interface VideoPlayerTriggerProps {
  videos: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    poster?: string
  }>
  onDownload?: (videoId: string) => void
  onShare?: (videoId: string) => void
  onFavorite?: (videoId: string) => void
  onBookmark?: (videoId: string) => void
  className?: string
}

export function VideoPlayerTrigger({
  videos,
  onDownload,
  onShare,
  onFavorite,
  onBookmark,
  className
}: VideoPlayerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleVideoClick = (index: number) => {
    setSelectedIndex(index)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (videos.length === 0) return null

  return (
    <>
      {/* Trigger buttons */}
      <div className={className}>
        {videos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => handleVideoClick(index)}
            className="relative group cursor-pointer"
          >
            <div className="w-full h-20 bg-muted rounded border overflow-hidden">
              {video.poster ? (
                <img
                  src={video.poster}
                  alt={video.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-2">
                    <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Video info */}
              <div className="absolute bottom-1 left-1 right-1">
                <div className="bg-black/80 text-white text-xs p-1 rounded">
                  <div className="truncate">{video.name}</div>
                  <div className="text-white/70">
                    {Math.round(video.size / 1024 / 1024)} MB
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Video player modal */}
      <VideoPlayerModal
        videos={videos}
        isOpen={isOpen}
        onClose={handleClose}
        initialIndex={selectedIndex}
        onDownload={onDownload}
        onShare={onShare}
        onFavorite={onFavorite}
        onBookmark={onBookmark}
      />
    </>
  )
}
