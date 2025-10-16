"use client"

import React, { useState } from "react"
import { ImageGalleryViewer } from "@/components/ui/image-gallery-viewer"
import { useImageGallery } from "@/hooks/use-image-gallery"

interface ImageGalleryModalProps {
  images: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    thumbnail?: string
    metadata?: {
      width: number
      height: number
      format: string
      fileSize: string
      createdAt?: string
      camera?: {
        make?: string
        model?: string
        settings?: string
      }
    }
  }>
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
  onDownload?: (imageId: string) => void
  onShare?: (imageId: string) => void
  onFavorite?: (imageId: string) => void
  onBookmark?: (imageId: string) => void
}

export function ImageGalleryModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  onDownload,
  onShare,
  onFavorite,
  onBookmark
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const {
    state,
    currentImage,
    goToNext,
    goToPrevious,
    goToIndex,
    zoomIn,
    zoomOut,
    resetZoom,
    rotate,
    toggleFullscreen,
    toggleThumbnails,
    toggleMetadata,
    toggleFilters,
    setViewMode,
    toggleAutoPlay,
    toggleFavorite,
    toggleBookmark,
    isFavorite,
    isBookmarked,
    downloadImage,
    shareImage,
    resetView
  } = useImageGallery(images, initialIndex)

  const handleDownload = (imageId: string) => {
    if (onDownload) {
      onDownload(imageId)
    } else {
      downloadImage(imageId)
    }
  }

  const handleShare = (imageId: string) => {
    if (onShare) {
      onShare(imageId)
    } else {
      shareImage(imageId)
    }
  }

  const handleFavorite = (imageId: string) => {
    toggleFavorite(imageId)
    if (onFavorite) {
      onFavorite(imageId)
    }
  }

  const handleBookmark = (imageId: string) => {
    toggleBookmark(imageId)
    if (onBookmark) {
      onBookmark(imageId)
    }
  }

  if (!isOpen || images.length === 0) return null

  return (
    <ImageGalleryViewer
      images={images}
      initialIndex={currentIndex}
      onClose={onClose}
      onDownload={handleDownload}
      onShare={handleShare}
      onFavorite={handleFavorite}
      onBookmark={handleBookmark}
      showMetadata={true}
      showControls={true}
      allowFullscreen={true}
      allowDownload={true}
      allowShare={true}
      allowFavorites={true}
      allowBookmarks={true}
      autoPlay={false}
      autoPlayInterval={3000}
    />
  )
}

// Componente wrapper para usar desde MessageComposer
interface ImageGalleryTriggerProps {
  images: Array<{
    id: string
    src: string
    name: string
    size: number
    type: string
    thumbnail?: string
  }>
  onDownload?: (imageId: string) => void
  onShare?: (imageId: string) => void
  onFavorite?: (imageId: string) => void
  onBookmark?: (imageId: string) => void
  className?: string
}

export function ImageGalleryTrigger({
  images,
  onDownload,
  onShare,
  onFavorite,
  onBookmark,
  className
}: ImageGalleryTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleImageClick = (index: number) => {
    setSelectedIndex(index)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (images.length === 0) return null

  return (
    <>
      {/* Trigger buttons */}
      <div className={className}>
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => handleImageClick(index)}
            className="relative group cursor-pointer"
          >
            <img
              src={image.thumbnail || image.src}
              alt={image.name}
              className="w-full h-20 object-cover rounded border hover:border-primary transition-colors"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-2">
                  <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Gallery modal */}
      <ImageGalleryModal
        images={images}
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
