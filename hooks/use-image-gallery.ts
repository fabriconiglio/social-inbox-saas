"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

interface ImageGalleryItem {
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
}

interface ImageGalleryState {
  currentIndex: number
  isFullscreen: boolean
  zoom: number
  rotation: number
  panX: number
  panY: number
  isDragging: boolean
  showThumbnails: boolean
  showMetadata: boolean
  showFilters: boolean
  viewMode: 'grid' | 'list'
  isAutoPlaying: boolean
  favorites: Set<string>
  bookmarks: Set<string>
}

interface UseImageGalleryReturn {
  // State
  state: ImageGalleryState
  currentImage: ImageGalleryItem | null
  images: ImageGalleryItem[]
  
  // Navigation
  goToNext: () => void
  goToPrevious: () => void
  goToIndex: (index: number) => void
  
  // Zoom & Pan
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (zoom: number) => void
  
  // Rotation
  rotate: () => void
  setRotation: (rotation: number) => void
  
  // Pan
  startPan: (x: number, y: number) => void
  updatePan: (x: number, y: number) => void
  endPan: () => void
  
  // View modes
  toggleFullscreen: () => void
  toggleThumbnails: () => void
  toggleMetadata: () => void
  toggleFilters: () => void
  setViewMode: (mode: 'grid' | 'list') => void
  
  // Auto-play
  toggleAutoPlay: () => void
  setAutoPlay: (enabled: boolean) => void
  
  // Favorites & Bookmarks
  toggleFavorite: (imageId: string) => void
  toggleBookmark: (imageId: string) => void
  isFavorite: (imageId: string) => boolean
  isBookmarked: (imageId: string) => boolean
  
  // Actions
  downloadImage: (imageId: string) => void
  shareImage: (imageId: string) => void
  
  // Reset
  resetView: () => void
}

export function useImageGallery(
  images: ImageGalleryItem[],
  initialIndex: number = 0
): UseImageGalleryReturn {
  const [state, setState] = useState<ImageGalleryState>({
    currentIndex: initialIndex,
    isFullscreen: false,
    zoom: 1,
    rotation: 0,
    panX: 0,
    panY: 0,
    isDragging: false,
    showThumbnails: true,
    showMetadata: false,
    showFilters: false,
    viewMode: 'grid',
    isAutoPlaying: false,
    favorites: new Set(),
    bookmarks: new Set()
  })

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const currentImage = images[state.currentIndex] || null

  // Auto-play functionality
  useEffect(() => {
    if (state.isAutoPlaying && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % images.length
        }))
      }, 3000)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [state.isAutoPlaying, images.length])

  // Navigation
  const goToNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % images.length
    }))
  }, [images.length])

  const goToPrevious = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + images.length) % images.length
    }))
  }, [images.length])

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setState(prev => ({
        ...prev,
        currentIndex: index
      }))
    }
  }, [images.length])

  // Zoom & Pan
  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5)
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }))
  }, [])

  const resetZoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0
    }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom))
    }))
  }, [])

  // Rotation
  const rotate = useCallback(() => {
    setState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }))
  }, [])

  const setRotation = useCallback((rotation: number) => {
    setState(prev => ({
      ...prev,
      rotation: rotation % 360
    }))
  }, [])

  // Pan
  const startPan = useCallback((x: number, y: number) => {
    if (state.zoom <= 1) return
    
    setState(prev => ({
      ...prev,
      isDragging: true
    }))
    dragStartRef.current = { x: x - state.panX, y: y - state.panY }
  }, [state.zoom, state.panX, state.panY])

  const updatePan = useCallback((x: number, y: number) => {
    if (!state.isDragging || state.zoom <= 1) return
    
    setState(prev => ({
      ...prev,
      panX: x - dragStartRef.current.x,
      panY: y - dragStartRef.current.y
    }))
  }, [state.isDragging, state.zoom])

  const endPan = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false
    }))
  }, [])

  // View modes
  const toggleFullscreen = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen
    }))
  }, [])

  const toggleThumbnails = useCallback(() => {
    setState(prev => ({
      ...prev,
      showThumbnails: !prev.showThumbnails
    }))
  }, [])

  const toggleMetadata = useCallback(() => {
    setState(prev => ({
      ...prev,
      showMetadata: !prev.showMetadata
    }))
  }, [])

  const toggleFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      showFilters: !prev.showFilters
    }))
  }, [])

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setState(prev => ({
      ...prev,
      viewMode: mode
    }))
  }, [])

  // Auto-play
  const toggleAutoPlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAutoPlaying: !prev.isAutoPlaying
    }))
  }, [])

  const setAutoPlay = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isAutoPlaying: enabled
    }))
  }, [])

  // Favorites & Bookmarks
  const toggleFavorite = useCallback((imageId: string) => {
    setState(prev => {
      const newFavorites = new Set(prev.favorites)
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId)
      } else {
        newFavorites.add(imageId)
      }
      return {
        ...prev,
        favorites: newFavorites
      }
    })
  }, [])

  const toggleBookmark = useCallback((imageId: string) => {
    setState(prev => {
      const newBookmarks = new Set(prev.bookmarks)
      if (newBookmarks.has(imageId)) {
        newBookmarks.delete(imageId)
      } else {
        newBookmarks.add(imageId)
      }
      return {
        ...prev,
        bookmarks: newBookmarks
      }
    })
  }, [])

  const isFavorite = useCallback((imageId: string) => {
    return state.favorites.has(imageId)
  }, [state.favorites])

  const isBookmarked = useCallback((imageId: string) => {
    return state.bookmarks.has(imageId)
  }, [state.bookmarks])

  // Actions
  const downloadImage = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (image) {
      const link = document.createElement('a')
      link.href = image.src
      link.download = image.name
      link.click()
    }
  }, [images])

  const shareImage = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (image && navigator.share) {
      navigator.share({
        title: image.name,
        url: image.src
      })
    }
  }, [images])

  // Reset
  const resetView = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0
    }))
  }, [])

  return {
    // State
    state,
    currentImage,
    images,
    
    // Navigation
    goToNext,
    goToPrevious,
    goToIndex,
    
    // Zoom & Pan
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    
    // Rotation
    rotate,
    setRotation,
    
    // Pan
    startPan,
    updatePan,
    endPan,
    
    // View modes
    toggleFullscreen,
    toggleThumbnails,
    toggleMetadata,
    toggleFilters,
    setViewMode,
    
    // Auto-play
    toggleAutoPlay,
    setAutoPlay,
    
    // Favorites & Bookmarks
    toggleFavorite,
    toggleBookmark,
    isFavorite,
    isBookmarked,
    
    // Actions
    downloadImage,
    shareImage,
    
    // Reset
    resetView
  }
}

// Hook para filtros de imagen
export function useImageFilters() {
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0
  })

  const updateFilter = useCallback((key: string, value: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
      invert: 0
    })
  }, [])

  const getFilterStyle = useCallback(() => {
    const { brightness, contrast, saturation, hue, blur, sepia, grayscale, invert } = filters
    return {
      filter: `
        brightness(${brightness}%) 
        contrast(${contrast}%) 
        saturate(${saturation}%) 
        hue-rotate(${hue}deg) 
        blur(${blur}px) 
        sepia(${sepia}%) 
        grayscale(${grayscale}%) 
        invert(${invert}%)
      `.replace(/\s+/g, ' ').trim()
    }
  }, [filters])

  return {
    filters,
    updateFilter,
    resetFilters,
    getFilterStyle
  }
}

// Hook para metadatos de imagen
export function useImageMetadata() {
  const [metadata, setMetadata] = useState<Record<string, any>>({})

  const extractMetadata = useCallback(async (file: File): Promise<Record<string, any>> => {
    try {
      // Crear imagen para extraer metadatos
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      return new Promise((resolve) => {
        img.onload = () => {
          const metadata = {
            width: img.naturalWidth,
            height: img.naturalHeight,
            format: file.type,
            fileSize: file.size,
            name: file.name,
            lastModified: new Date(file.lastModified).toISOString()
          }
          
          URL.revokeObjectURL(url)
          resolve(metadata)
        }
        
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve({})
        }
        
        img.src = url
      })
    } catch (error) {
      console.error('[useImageMetadata] Error:', error)
      return {}
    }
  }, [])

  const updateMetadata = useCallback((imageId: string, newMetadata: Record<string, any>) => {
    setMetadata(prev => ({
      ...prev,
      [imageId]: newMetadata
    }))
  }, [])

  const getMetadata = useCallback((imageId: string) => {
    return metadata[imageId] || {}
  }, [metadata])

  return {
    metadata,
    extractMetadata,
    updateMetadata,
    getMetadata
  }
}
