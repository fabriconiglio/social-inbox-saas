import { prisma } from "@/lib/prisma"

/**
 * Calcula el tiempo promedio de primera respuesta para un tenant
 */
export async function calculateAverageFirstResponseTime(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    // Construir filtros base
    const threadFilters: any = {
      tenantId,
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener threads que tienen al menos un mensaje de respuesta
    const threadsWithResponses = await prisma.thread.findMany({
      where: {
        ...threadFilters,
        status: {
          in: ["CLOSED", "OPEN", "PENDING"]
        },
        messages: {
          some: {
            direction: "OUTBOUND",
            authorId: {
              not: null
            }
          }
        }
      },
      include: {
        messages: {
          where: {
            direction: "INBOUND"
          },
          orderBy: {
            sentAt: "asc"
          },
          take: 1 // Primer mensaje entrante
        }
      }
    })

    if (threadsWithResponses.length === 0) {
      return { success: true, averageMinutes: 0, totalThreads: 0 }
    }

    let totalResponseTime = 0
    let threadsWithValidResponse = 0

    for (const thread of threadsWithResponses) {
      if (thread.messages.length === 0) continue

      const firstInboundMessage = thread.messages[0]
      
      // Buscar la primera respuesta del agente después del primer mensaje
      const firstResponse = await prisma.message.findFirst({
        where: {
          threadId: thread.id,
          direction: "OUTBOUND",
          authorId: {
            not: null
          },
          sentAt: {
            gt: firstInboundMessage.sentAt
          }
        },
        orderBy: {
          sentAt: "asc"
        }
      })

      if (firstResponse) {
        const responseTime = firstResponse.sentAt.getTime() - firstInboundMessage.sentAt.getTime()
        const responseTimeMinutes = Math.floor(responseTime / (1000 * 60))
        
        totalResponseTime += responseTimeMinutes
        threadsWithValidResponse++
      }
    }

    const averageMinutes = threadsWithValidResponse > 0 
      ? Math.round(totalResponseTime / threadsWithValidResponse) 
      : 0

    return {
      success: true,
      averageMinutes,
      totalThreads: threadsWithValidResponse
    }
  } catch (error) {
    console.error("[Analytics] Error calculating average first response time:", error)
    return { success: false, error: "Error calculating response time" }
  }
}

/**
 * Calcula el tiempo promedio de primera respuesta por agente
 */
export async function calculateAverageFirstResponseTimeByAgent(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId,
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener agentes con sus threads
    const agents = await prisma.membership.findMany({
      where: {
        tenantId,
        role: {
          in: ["AGENT", "ADMIN", "OWNER"]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const agentStats = []

    for (const agent of agents) {
      const threads = await prisma.thread.findMany({
        where: {
          ...threadFilters,
          assigneeId: agent.userId,
          status: {
            in: ["CLOSED", "OPEN", "PENDING"]
          },
          messages: {
            some: {
              direction: "OUTBOUND",
              authorId: agent.userId
            }
          }
        },
        include: {
          messages: {
            where: {
              direction: "INBOUND"
            },
            orderBy: {
              sentAt: "asc"
            },
            take: 1
          }
        }
      })

      let totalResponseTime = 0
      let threadsWithValidResponse = 0

      for (const thread of threads) {
        if (thread.messages.length === 0) continue

        const firstInboundMessage = thread.messages[0]
        
        const firstResponse = await prisma.message.findFirst({
          where: {
            threadId: thread.id,
            direction: "OUTBOUND",
            authorId: agent.userId,
            sentAt: {
              gt: firstInboundMessage.sentAt
            }
          },
          orderBy: {
            sentAt: "asc"
          }
        })

        if (firstResponse) {
          const responseTime = firstResponse.sentAt.getTime() - firstInboundMessage.sentAt.getTime()
          const responseTimeMinutes = Math.floor(responseTime / (1000 * 60))
          
          totalResponseTime += responseTimeMinutes
          threadsWithValidResponse++
        }
      }

      const averageMinutes = threadsWithValidResponse > 0 
        ? Math.round(totalResponseTime / threadsWithValidResponse) 
        : 0

      agentStats.push({
        agentId: agent.userId,
        agentName: agent.user.name || agent.user.email,
        averageMinutes,
        totalThreads: threadsWithValidResponse
      })
    }

    return {
      success: true,
      data: agentStats.sort((a, b) => a.averageMinutes - b.averageMinutes)
    }
  } catch (error) {
    console.error("[Analytics] Error calculating agent response times:", error)
    return { success: false, error: "Error calculating agent response times" }
  }
}

/**
 * Calcula la distribución de mensajes por hora del día
 */
export async function calculateMessagesByHour(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const messageFilters: any = {
      thread: {
        tenantId
      }
    }

    if (startDate && endDate) {
      messageFilters.sentAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener todos los mensajes en el rango de fechas
    const messages = await prisma.message.findMany({
      where: messageFilters,
      select: {
        sentAt: true,
        direction: true
      }
    })

    // Inicializar array de 24 horas
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      inbound: 0,
      outbound: 0,
      total: 0
    }))

    // Agrupar mensajes por hora
    for (const message of messages) {
      const hour = message.sentAt.getHours()
      hourlyData[hour].total++
      
      if (message.direction === "INBOUND") {
        hourlyData[hour].inbound++
      } else {
        hourlyData[hour].outbound++
      }
    }

    return {
      success: true,
      data: hourlyData
    }
  } catch (error) {
    console.error("[Analytics] Error calculating messages by hour:", error)
    return { success: false, error: "Error calculating messages by hour" }
  }
}

/**
 * Detecta picos de volumen en los mensajes
 */
export async function detectVolumePeaks(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const messageFilters: any = {
      thread: {
        tenantId
      }
    }

    if (startDate && endDate) {
      messageFilters.sentAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener mensajes agrupados por día y hora
    const messages = await prisma.message.findMany({
      where: messageFilters,
      select: {
        sentAt: true,
        direction: true
      },
      orderBy: {
        sentAt: 'asc'
      }
    })

    // Agrupar por día y hora
    const dailyHourlyData: { [key: string]: { [hour: number]: number } } = {}
    
    for (const message of messages) {
      const date = message.sentAt.toISOString().split('T')[0]
      const hour = message.sentAt.getHours()
      
      if (!dailyHourlyData[date]) {
        dailyHourlyData[date] = {}
      }
      
      if (!dailyHourlyData[date][hour]) {
        dailyHourlyData[date][hour] = 0
      }
      
      dailyHourlyData[date][hour]++
    }

    // Calcular estadísticas para detectar picos
    const allValues = Object.values(dailyHourlyData)
      .flatMap(dayData => Object.values(dayData))
    
    if (allValues.length === 0) {
      return {
        success: true,
        data: {
          peaks: [],
          averageVolume: 0,
          maxVolume: 0,
          peakThreshold: 0
        }
      }
    }

    const averageVolume = allValues.reduce((sum, val) => sum + val, 0) / allValues.length
    const maxVolume = Math.max(...allValues)
    const standardDeviation = Math.sqrt(
      allValues.reduce((sum, val) => sum + Math.pow(val - averageVolume, 2), 0) / allValues.length
    )
    
    // Definir umbral para picos (promedio + 1.5 * desviación estándar)
    const peakThreshold = averageVolume + (1.5 * standardDeviation)

    // Identificar picos
    const peaks: Array<{
      date: string
      hour: number
      volume: number
      intensity: 'low' | 'medium' | 'high'
    }> = []

    for (const [date, hourData] of Object.entries(dailyHourlyData)) {
      for (const [hourStr, volume] of Object.entries(hourData)) {
        const hour = parseInt(hourStr)
        
        if (volume >= peakThreshold) {
          let intensity: 'low' | 'medium' | 'high' = 'low'
          if (volume >= averageVolume + (2.5 * standardDeviation)) {
            intensity = 'high'
          } else if (volume >= averageVolume + (2 * standardDeviation)) {
            intensity = 'medium'
          }

          peaks.push({
            date,
            hour,
            volume,
            intensity
          })
        }
      }
    }

    // Ordenar picos por volumen descendente
    peaks.sort((a, b) => b.volume - a.volume)

    // Calcular patrones de picos
    const peakPatterns = analyzePeakPatterns(peaks)

    return {
      success: true,
      data: {
        peaks: peaks.slice(0, 10), // Top 10 picos
        averageVolume: Math.round(averageVolume * 100) / 100,
        maxVolume,
        peakThreshold: Math.round(peakThreshold * 100) / 100,
        patterns: peakPatterns
      }
    }
  } catch (error) {
    console.error("[Analytics] Error detecting volume peaks:", error)
    return { success: false, error: "Error detecting volume peaks" }
  }
}

/**
 * Analiza patrones en los picos de volumen
 */
function analyzePeakPatterns(peaks: Array<{ date: string; hour: number; volume: number; intensity: string }>) {
  // Agrupar picos por hora
  const hourlyPeaks: { [hour: number]: number } = {}
  const dailyPeaks: { [day: string]: number } = {}
  
  for (const peak of peaks) {
    hourlyPeaks[peak.hour] = (hourlyPeaks[peak.hour] || 0) + 1
    dailyPeaks[peak.date] = (dailyPeaks[peak.date] || 0) + 1
  }

  // Encontrar horas más frecuentes para picos
  const mostFrequentHours = Object.entries(hourlyPeaks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))

  // Encontrar días con más picos
  const mostActiveDays = Object.entries(dailyPeaks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([date, count]) => ({ date, count }))

  return {
    mostFrequentHours,
    mostActiveDays,
    totalPeaks: peaks.length
  }
}

/**
 * Calcula la línea de tiempo de volumen de mensajes
 */
export async function calculateVolumeTimeline(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  granularity: 'hour' | 'day' | 'week' = 'day'
) {
  try {
    const messageFilters: any = {
      thread: {
        tenantId
      }
    }

    if (startDate && endDate) {
      messageFilters.sentAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener todos los mensajes en el rango de fechas
    const messages = await prisma.message.findMany({
      where: messageFilters,
      select: {
        sentAt: true,
        direction: true
      },
      orderBy: {
        sentAt: 'asc'
      }
    })

    if (messages.length === 0) {
      return {
        success: true,
        data: {
          timeline: [],
          totalMessages: 0,
          averagePerPeriod: 0,
          trend: 'stable'
        }
      }
    }

    // Agrupar mensajes según la granularidad
    const timelineData: { [key: string]: { inbound: number; outbound: number; total: number } } = {}
    
    for (const message of messages) {
      let periodKey: string
      
      switch (granularity) {
        case 'hour':
          periodKey = message.sentAt.toISOString().slice(0, 13) // YYYY-MM-DDTHH
          break
        case 'day':
          periodKey = message.sentAt.toISOString().slice(0, 10) // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(message.sentAt)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Domingo
          periodKey = weekStart.toISOString().slice(0, 10)
          break
        default:
          periodKey = message.sentAt.toISOString().slice(0, 10)
      }
      
      if (!timelineData[periodKey]) {
        timelineData[periodKey] = { inbound: 0, outbound: 0, total: 0 }
      }
      
      timelineData[periodKey].total++
      
      if (message.direction === "INBOUND") {
        timelineData[periodKey].inbound++
      } else {
        timelineData[periodKey].outbound++
      }
    }

    // Convertir a array ordenado
    const timeline = Object.entries(timelineData)
      .map(([period, data]) => ({
        period,
        inbound: data.inbound,
        outbound: data.outbound,
        total: data.total
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // Calcular estadísticas
    const totalMessages = timeline.reduce((sum, item) => sum + item.total, 0)
    const averagePerPeriod = totalMessages / timeline.length

    // Calcular tendencia
    const trend = calculateTrend(timeline)

    return {
      success: true,
      data: {
        timeline,
        totalMessages,
        averagePerPeriod: Math.round(averagePerPeriod * 100) / 100,
        trend,
        granularity
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating volume timeline:", error)
    return { success: false, error: "Error calculating volume timeline" }
  }
}

/**
 * Calcula la tendencia de la línea de tiempo
 */
function calculateTrend(timeline: Array<{ period: string; total: number }>) {
  if (timeline.length < 2) return 'stable'
  
  const firstHalf = timeline.slice(0, Math.floor(timeline.length / 2))
  const secondHalf = timeline.slice(Math.floor(timeline.length / 2))
  
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.total, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.total, 0) / secondHalf.length
  
  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  
  if (changePercent > 10) return 'increasing'
  if (changePercent < -10) return 'decreasing'
  return 'stable'
}

/**
 * Calcula la comparación con el período anterior
 */
export async function calculatePeriodComparison(
  tenantId: string,
  currentStartDate: Date,
  currentEndDate: Date,
  comparisonType: 'previous_period' | 'same_period_last_year' = 'previous_period'
) {
  try {
    // Calcular fechas del período anterior
    let previousStartDate: Date
    let previousEndDate: Date
    
    if (comparisonType === 'previous_period') {
      const periodLength = currentEndDate.getTime() - currentStartDate.getTime()
      previousEndDate = new Date(currentStartDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getTime() - periodLength)
    } else {
      // Mismo período del año anterior
      previousStartDate = new Date(currentStartDate)
      previousStartDate.setFullYear(currentStartDate.getFullYear() - 1)
      
      previousEndDate = new Date(currentEndDate)
      previousEndDate.setFullYear(currentEndDate.getFullYear() - 1)
    }

    // Obtener métricas del período actual
    const currentMetrics = await getPeriodMetrics(tenantId, currentStartDate, currentEndDate)
    
    // Obtener métricas del período anterior
    const previousMetrics = await getPeriodMetrics(tenantId, previousStartDate, previousEndDate)

    // Calcular comparaciones
    const comparisons = calculateComparisons(currentMetrics, previousMetrics)

    return {
      success: true,
      data: {
        current: currentMetrics,
        previous: previousMetrics,
        comparisons,
        periodInfo: {
          currentStart: currentStartDate,
          currentEnd: currentEndDate,
          previousStart: previousStartDate,
          previousEnd: previousEndDate,
          comparisonType
        }
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating period comparison:", error)
    return { success: false, error: "Error calculating period comparison" }
  }
}

/**
 * Obtiene métricas para un período específico
 */
async function getPeriodMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const threadFilters: any = {
    tenantId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  const messageFilters: any = {
    thread: {
      tenantId
    },
    sentAt: {
      gte: startDate,
      lte: endDate,
    }
  }

  // Obtener métricas básicas
  const [
    totalThreads,
    openThreads,
    closedThreads,
    totalMessages,
    inboundMessages,
    outboundMessages,
    avgResponseTime
  ] = await Promise.all([
    // Total threads
    prisma.thread.count({ where: threadFilters }),
    
    // Open threads
    prisma.thread.count({
      where: { ...threadFilters, status: "OPEN" },
    }),
    
    // Closed threads
    prisma.thread.count({
      where: { ...threadFilters, status: "CLOSED" },
    }),
    
    // Total messages
    prisma.message.count({ where: messageFilters }),
    
    // Inbound messages
    prisma.message.count({
      where: { ...messageFilters, direction: "INBOUND" },
    }),
    
    // Outbound messages
    prisma.message.count({
      where: { ...messageFilters, direction: "OUTBOUND" },
    }),
    
    // Average response time (simplified) - using count instead of aggregate
    prisma.message.count({
      where: {
        ...messageFilters,
        direction: "OUTBOUND",
      },
    }),
  ])

  // Calcular tiempo promedio de primera respuesta
  const responseTimeResult = await calculateAverageFirstResponseTime(tenantId, startDate, endDate)

  return {
    totalThreads,
    openThreads,
    closedThreads,
    totalMessages,
    inboundMessages,
    outboundMessages,
    avgResponseTime: responseTimeResult.averageMinutes,
    closeRate: totalThreads > 0 ? (closedThreads / totalThreads) * 100 : 0,
    periodLength: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) // días
  }
}

/**
 * Calcula las comparaciones entre períodos
 */
function calculateComparisons(current: any, previous: any) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    totalThreads: {
      current: current.totalThreads,
      previous: previous.totalThreads,
      change: calculateChange(current.totalThreads, previous.totalThreads),
      changeType: current.totalThreads > previous.totalThreads ? 'increase' : 
                  current.totalThreads < previous.totalThreads ? 'decrease' : 'stable'
    },
    totalMessages: {
      current: current.totalMessages,
      previous: previous.totalMessages,
      change: calculateChange(current.totalMessages, previous.totalMessages),
      changeType: current.totalMessages > previous.totalMessages ? 'increase' : 
                  current.totalMessages < previous.totalMessages ? 'decrease' : 'stable'
    },
    avgResponseTime: {
      current: current.avgResponseTime,
      previous: previous.avgResponseTime,
      change: calculateChange(current.avgResponseTime, previous.avgResponseTime),
      changeType: current.avgResponseTime > previous.avgResponseTime ? 'increase' : 
                  current.avgResponseTime < previous.avgResponseTime ? 'decrease' : 'stable'
    },
    closeRate: {
      current: current.closeRate,
      previous: previous.closeRate,
      change: calculateChange(current.closeRate, previous.closeRate),
      changeType: current.closeRate > previous.closeRate ? 'increase' : 
                  current.closeRate < previous.closeRate ? 'decrease' : 'stable'
    },
    inboundMessages: {
      current: current.inboundMessages,
      previous: previous.inboundMessages,
      change: calculateChange(current.inboundMessages, previous.inboundMessages),
      changeType: current.inboundMessages > previous.inboundMessages ? 'increase' : 
                  current.inboundMessages < previous.inboundMessages ? 'decrease' : 'stable'
    },
    outboundMessages: {
      current: current.outboundMessages,
      previous: previous.outboundMessages,
      change: calculateChange(current.outboundMessages, previous.outboundMessages),
      changeType: current.outboundMessages > previous.outboundMessages ? 'increase' : 
                  current.outboundMessages < previous.outboundMessages ? 'decrease' : 'stable'
    }
  }
}

/**
 * Calcula el heatmap de horarios (día de la semana vs hora del día)
 */
export async function calculateScheduleHeatmap(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const messageFilters: any = {
      thread: {
        tenantId
      }
    }

    if (startDate && endDate) {
      messageFilters.sentAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener todos los mensajes en el rango de fechas
    const messages = await prisma.message.findMany({
      where: messageFilters,
      select: {
        sentAt: true,
        direction: true
      }
    })

    // Inicializar matriz 7x24 (días de la semana x horas)
    const heatmapData: { [day: number]: { [hour: number]: { inbound: number; outbound: number; total: number } } } = {}
    
    // Inicializar todos los días y horas
    for (let day = 0; day < 7; day++) {
      heatmapData[day] = {}
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[day][hour] = { inbound: 0, outbound: 0, total: 0 }
      }
    }

    // Agrupar mensajes por día de la semana y hora
    for (const message of messages) {
      const dayOfWeek = message.sentAt.getDay() // 0 = Domingo, 1 = Lunes, etc.
      const hour = message.sentAt.getHours()
      
      heatmapData[dayOfWeek][hour].total++
      
      if (message.direction === "INBOUND") {
        heatmapData[dayOfWeek][hour].inbound++
      } else {
        heatmapData[dayOfWeek][hour].outbound++
      }
    }

    // Convertir a formato para el heatmap
    const heatmapMatrix = []
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    
    for (let day = 0; day < 7; day++) {
      const dayData = {
        day: dayNames[day],
        dayIndex: day,
        hours: [] as Array<{
          hour: number
          inbound: number
          outbound: number
          total: number
        }>
      }
      
      for (let hour = 0; hour < 24; hour++) {
        dayData.hours.push({
          hour,
          inbound: heatmapData[day][hour].inbound,
          outbound: heatmapData[day][hour].outbound,
          total: heatmapData[day][hour].total
        })
      }
      
      heatmapMatrix.push(dayData)
    }

    // Calcular estadísticas del heatmap
    const allValues = Object.values(heatmapData)
      .flatMap(dayData => Object.values(dayData))
      .map(data => data.total)
    
    const maxActivity = Math.max(...allValues)
    const totalMessages = allValues.reduce((sum, val) => sum + val, 0)
    
    // Encontrar picos de actividad
    const peakHours = findPeakHours(heatmapData)
    const peakDays = findPeakDays(heatmapData)

    return {
      success: true,
      data: {
        heatmap: heatmapMatrix,
        maxActivity,
        totalMessages,
        peakHours,
        peakDays,
        averagePerHour: totalMessages / (7 * 24)
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating schedule heatmap:", error)
    return { success: false, error: "Error calculating schedule heatmap" }
  }
}

/**
 * Encuentra las horas con mayor actividad
 */
function findPeakHours(heatmapData: { [day: number]: { [hour: number]: { inbound: number; outbound: number; total: number } } }) {
  const hourlyTotals: { [hour: number]: number } = {}
  
  // Sumar actividad por hora a través de todos los días
  for (let hour = 0; hour < 24; hour++) {
    hourlyTotals[hour] = 0
    for (let day = 0; day < 7; day++) {
      hourlyTotals[hour] += heatmapData[day][hour].total
    }
  }
  
  // Encontrar las 3 horas con mayor actividad
  return Object.entries(hourlyTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, total]) => ({ hour: parseInt(hour), total }))
}

/**
 * Encuentra los días con mayor actividad
 */
function findPeakDays(heatmapData: { [day: number]: { [hour: number]: { inbound: number; outbound: number; total: number } } }) {
  const dailyTotals: { [day: number]: number } = {}
  
  // Sumar actividad por día a través de todas las horas
  for (let day = 0; day < 7; day++) {
    dailyTotals[day] = 0
    for (let hour = 0; hour < 24; hour++) {
      dailyTotals[day] += heatmapData[day][hour].total
    }
  }
  
  // Encontrar los 3 días con mayor actividad
  return Object.entries(dailyTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day, total]) => ({ day: parseInt(day), total }))
}

/**
 * Calcula métricas adicionales de analytics
 */
export async function calculateAdvancedAnalytics(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId,
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Calcular tiempo promedio de primera respuesta
    const responseTimeResult = await calculateAverageFirstResponseTime(tenantId, startDate, endDate)
    
    // Calcular tiempo promedio de resolución
    const resolutionResult = await calculateAverageResolutionTime(tenantId, startDate, endDate)
    
    // Calcular tasa de cierre
    const closeRateResult = await calculateCloseRate(tenantId, startDate, endDate)

    return {
      success: true,
      data: {
        averageFirstResponseTime: responseTimeResult.averageMinutes,
        averageResolutionTime: resolutionResult.averageMinutes,
        closeRate: closeRateResult.closeRate,
        totalThreads: responseTimeResult.totalThreads
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating advanced analytics:", error)
    return { success: false, error: "Error calculating analytics" }
  }
}

/**
 * Calcula el tiempo promedio de resolución
 */
async function calculateAverageResolutionTime(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId,
      status: "CLOSED"
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const closedThreads = await prisma.thread.findMany({
      where: threadFilters,
      include: {
        messages: {
          where: {
            direction: "INBOUND"
          },
          orderBy: {
            sentAt: "asc"
          },
          take: 1
        }
      }
    })

    let totalResolutionTime = 0
    let validThreads = 0

    for (const thread of closedThreads) {
      if (thread.messages.length === 0) continue

      const firstMessage = thread.messages[0]
      const resolutionTime = thread.updatedAt.getTime() - firstMessage.sentAt.getTime()
      const resolutionTimeMinutes = Math.floor(resolutionTime / (1000 * 60))
      
      totalResolutionTime += resolutionTimeMinutes
      validThreads++
    }

    const averageMinutes = validThreads > 0 
      ? Math.round(totalResolutionTime / validThreads) 
      : 0

    return {
      success: true,
      averageMinutes,
      totalThreads: validThreads
    }
  } catch (error) {
    console.error("[Analytics] Error calculating resolution time:", error)
    return { success: false, averageMinutes: 0, totalThreads: 0 }
  }
}

/**
 * Calcula la tasa de cierre de conversaciones
 */
async function calculateCloseRate(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId,
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [totalThreads, closedThreads] = await Promise.all([
      prisma.thread.count({ where: threadFilters }),
      prisma.thread.count({ where: { ...threadFilters, status: "CLOSED" } })
    ])

    const closeRate = totalThreads > 0 ? (closedThreads / totalThreads) * 100 : 0

    return {
      success: true,
      closeRate: Math.round(closeRate * 100) / 100,
      totalThreads,
      closedThreads
    }
  } catch (error) {
    console.error("[Analytics] Error calculating close rate:", error)
    return { success: false, closeRate: 0, totalThreads: 0, closedThreads: 0 }
  }
}

/**
 * Calcula el funnel de conversaciones desde inicio hasta resolución
 */
export async function calculateConversationFunnel(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener todos los threads del período
    const threads = await prisma.thread.findMany({
      where: threadFilters,
      select: {
        id: true,
        status: true,
        createdAt: true,
        assigneeId: true,
        messages: {
          select: {
            id: true,
            direction: true,
            sentAt: true
          },
          orderBy: {
            sentAt: 'asc'
          }
        }
      }
    })

    // Calcular métricas del funnel
    const totalThreads = threads.length
    const openThreads = threads.filter(t => t.status === 'OPEN').length
    const pendingThreads = threads.filter(t => t.status === 'PENDING').length
    const closedThreads = threads.filter(t => t.status === 'CLOSED').length
    const assignedThreads = threads.filter(t => t.assigneeId !== null).length

    // Threads con al menos un mensaje
    const threadsWithMessages = threads.filter(t => t.messages.length > 0).length

    // Threads con respuesta del agente
    const threadsWithAgentResponse = threads.filter(t => 
      t.messages.some(m => m.direction === 'OUTBOUND')
    ).length

    // Threads resueltos (cerrados)
    const resolvedThreads = closedThreads

    // Calcular tasas de conversión
    const assignmentRate = totalThreads > 0 ? (assignedThreads / totalThreads) * 100 : 0
    const responseRate = totalThreads > 0 ? (threadsWithAgentResponse / totalThreads) * 100 : 0
    const resolutionRate = totalThreads > 0 ? (resolvedThreads / totalThreads) * 100 : 0

    // Calcular tiempo promedio en cada etapa
    const assignedThreadsWithTimes = threads.filter(t => t.assigneeId && t.messages.length > 0)
    
    let avgTimeToAssignment = 0
    let avgTimeToFirstResponse = 0
    let avgTimeToResolution = 0

    if (assignedThreadsWithTimes.length > 0) {
      // Tiempo promedio hasta asignación
      const assignmentTimes = assignedThreadsWithTimes.map(t => {
        const firstMessage = t.messages[0]
        return firstMessage ? firstMessage.sentAt.getTime() - t.createdAt.getTime() : 0
      }).filter(t => t > 0)
      
      avgTimeToAssignment = assignmentTimes.length > 0 
        ? assignmentTimes.reduce((sum, time) => sum + time, 0) / assignmentTimes.length / (1000 * 60) // en minutos
        : 0

      // Tiempo promedio hasta primera respuesta
      const responseTimes = threads.filter(t => 
        t.messages.some(m => m.direction === 'OUTBOUND')
      ).map(t => {
        const firstOutbound = t.messages.find(m => m.direction === 'OUTBOUND')
        return firstOutbound ? firstOutbound.sentAt.getTime() - t.createdAt.getTime() : 0
      }).filter(t => t > 0)
      
      avgTimeToFirstResponse = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60) // en minutos
        : 0

      // Tiempo promedio hasta resolución (usando lastMessageAt como proxy)
      const resolvedThreads = threads.filter(t => t.status === 'CLOSED')
      const resolutionTimes = resolvedThreads.map(t => {
        // Usar el último mensaje como proxy para el tiempo de resolución
        const lastMessage = t.messages[t.messages.length - 1]
        return lastMessage ? lastMessage.sentAt.getTime() - t.createdAt.getTime() : 0
      }).filter(t => t > 0)
      
      avgTimeToResolution = resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length / (1000 * 60 * 60) // en horas
        : 0
    }

    // Análisis de pérdidas en el funnel
    const lostAtAssignment = totalThreads - assignedThreads
    const lostAtResponse = assignedThreads - threadsWithAgentResponse
    const lostAtResolution = threadsWithAgentResponse - resolvedThreads

    // Calcular tasas de pérdida
    const lossRateAtAssignment = totalThreads > 0 ? (lostAtAssignment / totalThreads) * 100 : 0
    const lossRateAtResponse = assignedThreads > 0 ? (lostAtResponse / assignedThreads) * 100 : 0
    const lossRateAtResolution = threadsWithAgentResponse > 0 ? (lostAtResolution / threadsWithAgentResponse) * 100 : 0

    return {
      success: true,
      data: {
        funnel: {
          totalThreads,
          assignedThreads,
          threadsWithAgentResponse,
          resolvedThreads,
          openThreads,
          pendingThreads,
          closedThreads
        },
        conversionRates: {
          assignmentRate: Math.round(assignmentRate * 100) / 100,
          responseRate: Math.round(responseRate * 100) / 100,
          resolutionRate: Math.round(resolutionRate * 100) / 100
        },
        averageTimes: {
          timeToAssignment: Math.round(avgTimeToAssignment * 100) / 100, // minutos
          timeToFirstResponse: Math.round(avgTimeToFirstResponse * 100) / 100, // minutos
          timeToResolution: Math.round(avgTimeToResolution * 100) / 100 // horas
        },
        losses: {
          lostAtAssignment,
          lostAtResponse,
          lostAtResolution,
          lossRateAtAssignment: Math.round(lossRateAtAssignment * 100) / 100,
          lossRateAtResponse: Math.round(lossRateAtResponse * 100) / 100,
          lossRateAtResolution: Math.round(lossRateAtResolution * 100) / 100
        },
        stages: [
          {
            name: "Conversaciones Iniciadas",
            count: totalThreads,
            percentage: 100,
            color: "bg-blue-500"
          },
          {
            name: "Asignadas",
            count: assignedThreads,
            percentage: assignmentRate,
            color: "bg-yellow-500"
          },
          {
            name: "Con Respuesta",
            count: threadsWithAgentResponse,
            percentage: responseRate,
            color: "bg-orange-500"
          },
          {
            name: "Resueltas",
            count: resolvedThreads,
            percentage: resolutionRate,
            color: "bg-green-500"
          }
        ]
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating conversation funnel:", error)
    return { success: false, error: "Error calculating conversation funnel" }
  }
}

/**
 * Calcula el ranking de agentes basado en múltiples métricas
 */
export async function calculateAgentRanking(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener todos los threads con mensajes y agentes asignados
    const threads = await prisma.thread.findMany({
      where: {
        ...threadFilters,
        assigneeId: {
          not: null
        }
      },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          select: {
            id: true,
            direction: true,
            sentAt: true,
            body: true
          },
          orderBy: {
            sentAt: 'asc'
          }
        }
      }
    })

    // Agrupar por agente
    const agentStats = new Map<string, {
      agent: any
      totalThreads: number
      openThreads: number
      closedThreads: number
      totalMessages: number
      inboundMessages: number
      outboundMessages: number
      avgResponseTime: number
      avgResolutionTime: number
      firstResponseTimes: number[]
      resolutionTimes: number[]
      messageCount: number
      avgMessageLength: number
    }>()

    // Procesar cada thread
    for (const thread of threads) {
      const agentId = thread.assigneeId!
      const agent = thread.assignee

      if (!agentStats.has(agentId)) {
        agentStats.set(agentId, {
          agent,
          totalThreads: 0,
          openThreads: 0,
          closedThreads: 0,
          totalMessages: 0,
          inboundMessages: 0,
          outboundMessages: 0,
          avgResponseTime: 0,
          avgResolutionTime: 0,
          firstResponseTimes: [],
          resolutionTimes: [],
          messageCount: 0,
          avgMessageLength: 0
        })
      }

      const stats = agentStats.get(agentId)!
      stats.totalThreads++

      // Contar por estado
      if (thread.status === 'OPEN') stats.openThreads++
      if (thread.status === 'CLOSED') stats.closedThreads++

      // Procesar mensajes
      const messages = thread.messages
      stats.totalMessages += messages.length

      let messageLengths = 0
      let firstOutboundMessage: any = null

      for (const message of messages) {
        if (message.direction === 'INBOUND') {
          stats.inboundMessages++
        } else {
          stats.outboundMessages++
          if (!firstOutboundMessage) {
            firstOutboundMessage = message
          }
        }
        messageLengths += message.body?.length || 0
      }

      stats.messageCount += messages.length
      stats.avgMessageLength = stats.messageCount > 0 ? messageLengths / stats.messageCount : 0

      // Calcular tiempo de primera respuesta
      if (firstOutboundMessage) {
        const responseTime = firstOutboundMessage.sentAt.getTime() - thread.createdAt.getTime()
        stats.firstResponseTimes.push(responseTime)
      }

      // Calcular tiempo de resolución (usar updatedAt para threads cerrados)
      if (thread.status === 'CLOSED') {
        const resolutionTime = thread.updatedAt.getTime() - thread.createdAt.getTime()
        stats.resolutionTimes.push(resolutionTime)
      }
    }

    // Calcular métricas finales para cada agente
    const agentRankings = Array.from(agentStats.values()).map(stats => {
      // Tiempo promedio de primera respuesta (en minutos)
      const avgFirstResponseTime = stats.firstResponseTimes.length > 0
        ? stats.firstResponseTimes.reduce((sum, time) => sum + time, 0) / stats.firstResponseTimes.length / (1000 * 60)
        : 0

      // Tiempo promedio de resolución (en horas)
      const avgResolutionTime = stats.resolutionTimes.length > 0
        ? stats.resolutionTimes.reduce((sum, time) => sum + time, 0) / stats.resolutionTimes.length / (1000 * 60 * 60)
        : 0

      // Tasa de resolución
      const resolutionRate = stats.totalThreads > 0 ? (stats.closedThreads / stats.totalThreads) * 100 : 0

      // Productividad (mensajes por thread)
      const productivity = stats.totalThreads > 0 ? stats.totalMessages / stats.totalThreads : 0

      // Puntuación compuesta (0-100)
      const score = calculateAgentScore({
        totalThreads: stats.totalThreads,
        resolutionRate,
        avgFirstResponseTime,
        avgResolutionTime,
        productivity,
        avgMessageLength: stats.avgMessageLength
      })

      return {
        agent: stats.agent,
        metrics: {
          totalThreads: stats.totalThreads,
          openThreads: stats.openThreads,
          closedThreads: stats.closedThreads,
          totalMessages: stats.totalMessages,
          inboundMessages: stats.inboundMessages,
          outboundMessages: stats.outboundMessages,
          avgFirstResponseTime: Math.round(avgFirstResponseTime * 100) / 100,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          productivity: Math.round(productivity * 100) / 100,
          avgMessageLength: Math.round(stats.avgMessageLength),
          score: Math.round(score * 100) / 100
        }
      }
    })

    // Ordenar por puntuación (descendente)
    agentRankings.sort((a, b) => b.metrics.score - a.metrics.score)

    // Asignar posiciones
    const rankedAgents = agentRankings.map((agent, index) => ({
      ...agent,
      position: index + 1,
      trend: index < 3 ? 'top' : index < 5 ? 'good' : 'average'
    }))

    // Calcular estadísticas generales
    const totalAgents = rankedAgents.length
    const avgScore = totalAgents > 0 
      ? rankedAgents.reduce((sum, agent) => sum + agent.metrics.score, 0) / totalAgents 
      : 0

    const topPerformers = rankedAgents.slice(0, 3)
    const needsImprovement = rankedAgents.slice(-3).reverse()

    return {
      success: true,
      data: {
        agents: rankedAgents,
        summary: {
          totalAgents,
          avgScore: Math.round(avgScore * 100) / 100,
          topPerformers,
          needsImprovement
        },
        categories: {
          byScore: rankedAgents,
          byThreads: [...rankedAgents].sort((a, b) => b.metrics.totalThreads - a.metrics.totalThreads),
          byResolutionRate: [...rankedAgents].sort((a, b) => b.metrics.resolutionRate - a.metrics.resolutionRate),
          byResponseTime: [...rankedAgents].sort((a, b) => a.metrics.avgFirstResponseTime - b.metrics.avgFirstResponseTime)
        }
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating agent ranking:", error)
    return { success: false, error: "Error calculating agent ranking" }
  }
}

/**
 * Calcula la puntuación compuesta de un agente
 */
function calculateAgentScore(metrics: {
  totalThreads: number
  resolutionRate: number
  avgFirstResponseTime: number
  avgResolutionTime: number
  productivity: number
  avgMessageLength: number
}): number {
  const {
    totalThreads,
    resolutionRate,
    avgFirstResponseTime,
    avgResolutionTime,
    productivity,
    avgMessageLength
  } = metrics

  // Factores de peso
  const weights = {
    volume: 0.2,        // Cantidad de threads
    resolution: 0.25,  // Tasa de resolución
    speed: 0.25,        // Velocidad de respuesta
    quality: 0.15,      // Longitud promedio de mensajes
    productivity: 0.15  // Productividad general
  }

  // Normalizar métricas (0-100)
  const volumeScore = Math.min(totalThreads * 2, 100) // Máximo 50 threads = 100 puntos
  const resolutionScore = resolutionRate
  const speedScore = avgFirstResponseTime > 0 ? Math.max(0, 100 - (avgFirstResponseTime / 60) * 10) : 0 // Menos tiempo = más puntos
  const qualityScore = Math.min(avgMessageLength / 10, 100) // Máximo 1000 caracteres = 100 puntos
  const productivityScore = Math.min(productivity * 20, 100) // Máximo 5 mensajes/thread = 100 puntos

  // Calcular puntuación ponderada
  const score = 
    volumeScore * weights.volume +
    resolutionScore * weights.resolution +
    speedScore * weights.speed +
    qualityScore * weights.quality +
    productivityScore * weights.productivity

  return Math.max(0, Math.min(100, score))
}

/**
 * Calcula estadísticas de volumen de conversaciones por agente
 */
export async function calculateConversationVolume(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const threadFilters: any = {
      tenantId
    }

    if (startDate && endDate) {
      threadFilters.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Obtener threads con agentes asignados
    const threads = await prisma.thread.findMany({
      where: {
        ...threadFilters,
        assigneeId: {
          not: null
        }
      },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          select: {
            id: true,
            direction: true,
            sentAt: true
          }
        }
      }
    })

    // Agrupar por agente
    const agentVolumes = new Map<string, {
      agent: any
      totalThreads: number
      openThreads: number
      pendingThreads: number
      closedThreads: number
      totalMessages: number
      inboundMessages: number
      outboundMessages: number
      avgMessagesPerThread: number
      threadsByDay: Map<string, number>
      threadsByHour: Map<number, number>
      threadsByStatus: Map<string, number>
      avgThreadDuration: number
      threadDurations: number[]
      productivity: number
    }>()

    // Procesar cada thread
    for (const thread of threads) {
      const agentId = thread.assigneeId!
      const agent = thread.assignee

      if (!agentVolumes.has(agentId)) {
        agentVolumes.set(agentId, {
          agent,
          totalThreads: 0,
          openThreads: 0,
          pendingThreads: 0,
          closedThreads: 0,
          totalMessages: 0,
          inboundMessages: 0,
          outboundMessages: 0,
          avgMessagesPerThread: 0,
          threadsByDay: new Map(),
          threadsByHour: new Map(),
          threadsByStatus: new Map(),
          avgThreadDuration: 0,
          threadDurations: [],
          productivity: 0
        })
      }

      const volume = agentVolumes.get(agentId)!
      volume.totalThreads++

      // Contar por estado
      if (thread.status === 'OPEN') volume.openThreads++
      if (thread.status === 'PENDING') volume.pendingThreads++
      if (thread.status === 'CLOSED') volume.closedThreads++

      // Contar mensajes
      const messages = thread.messages
      volume.totalMessages += messages.length

      for (const message of messages) {
        if (message.direction === 'INBOUND') {
          volume.inboundMessages++
        } else {
          volume.outboundMessages++
        }
      }

      // Agrupar por día
      const dayKey = thread.createdAt.toISOString().split('T')[0]
      volume.threadsByDay.set(dayKey, (volume.threadsByDay.get(dayKey) || 0) + 1)

      // Agrupar por hora
      const hour = thread.createdAt.getHours()
      volume.threadsByHour.set(hour, (volume.threadsByHour.get(hour) || 0) + 1)

      // Agrupar por estado
      volume.threadsByStatus.set(thread.status, (volume.threadsByStatus.get(thread.status) || 0) + 1)

      // Calcular duración del thread
      const duration = thread.updatedAt.getTime() - thread.createdAt.getTime()
      volume.threadDurations.push(duration)
    }

    // Calcular métricas finales
    const volumeStats = Array.from(agentVolumes.values()).map(volume => {
      // Promedio de mensajes por thread
      volume.avgMessagesPerThread = volume.totalThreads > 0 
        ? volume.totalMessages / volume.totalThreads 
        : 0

      // Duración promedio de threads (en horas)
      volume.avgThreadDuration = volume.threadDurations.length > 0
        ? volume.threadDurations.reduce((sum, duration) => sum + duration, 0) / volume.threadDurations.length / (1000 * 60 * 60)
        : 0

      // Productividad (threads por día)
      const daysDiff = startDate && endDate 
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30 // Default a 30 días si no hay fechas
      volume.productivity = daysDiff > 0 ? volume.totalThreads / daysDiff : 0

      // Convertir Maps a objetos para serialización
      const threadsByDay = Object.fromEntries(volume.threadsByDay)
      const threadsByHour = Object.fromEntries(volume.threadsByHour)
      const threadsByStatus = Object.fromEntries(volume.threadsByStatus)

      return {
        agent: volume.agent,
        metrics: {
          totalThreads: volume.totalThreads,
          openThreads: volume.openThreads,
          pendingThreads: volume.pendingThreads,
          closedThreads: volume.closedThreads,
          totalMessages: volume.totalMessages,
          inboundMessages: volume.inboundMessages,
          outboundMessages: volume.outboundMessages,
          avgMessagesPerThread: Math.round(volume.avgMessagesPerThread * 100) / 100,
          avgThreadDuration: Math.round(volume.avgThreadDuration * 100) / 100,
          productivity: Math.round(volume.productivity * 100) / 100,
          threadsByDay,
          threadsByHour,
          threadsByStatus
        }
      }
    })

    // Ordenar por total de threads (descendente)
    volumeStats.sort((a, b) => b.metrics.totalThreads - a.metrics.totalThreads)

    // Calcular estadísticas generales
    const totalThreads = volumeStats.reduce((sum, agent) => sum + agent.metrics.totalThreads, 0)
    const totalMessages = volumeStats.reduce((sum, agent) => sum + agent.metrics.totalMessages, 0)
    const avgThreadsPerAgent = volumeStats.length > 0 ? totalThreads / volumeStats.length : 0
    const avgMessagesPerThread = totalThreads > 0 ? totalMessages / totalThreads : 0

    // Top performers por volumen
    const topByVolume = volumeStats.slice(0, 3)
    const topByMessages = [...volumeStats].sort((a, b) => b.metrics.totalMessages - a.metrics.totalMessages).slice(0, 3)
    const topByProductivity = [...volumeStats].sort((a, b) => b.metrics.productivity - a.metrics.productivity).slice(0, 3)

    return {
      success: true,
      data: {
        agents: volumeStats,
        summary: {
          totalAgents: volumeStats.length,
          totalThreads,
          totalMessages,
          avgThreadsPerAgent: Math.round(avgThreadsPerAgent * 100) / 100,
          avgMessagesPerThread: Math.round(avgMessagesPerThread * 100) / 100
        },
        topPerformers: {
          byVolume: topByVolume,
          byMessages: topByMessages,
          byProductivity: topByProductivity
        },
        distribution: {
          byStatus: {
            open: volumeStats.reduce((sum, agent) => sum + agent.metrics.openThreads, 0),
            pending: volumeStats.reduce((sum, agent) => sum + agent.metrics.pendingThreads, 0),
            closed: volumeStats.reduce((sum, agent) => sum + agent.metrics.closedThreads, 0)
          },
          byHour: calculateHourlyDistribution(volumeStats),
          byDay: calculateDailyDistribution(volumeStats)
        }
      }
    }
  } catch (error) {
    console.error("[Analytics] Error calculating conversation volume:", error)
    return { success: false, error: "Error calculating conversation volume" }
  }
}

/**
 * Calcula distribución por horas del día
 */
function calculateHourlyDistribution(volumeStats: any[]): Record<number, number> {
  const hourlyDistribution: Record<number, number> = {}
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyDistribution[hour] = 0
  }
  
  volumeStats.forEach(agent => {
    Object.entries(agent.metrics.threadsByHour).forEach(([hour, count]) => {
      hourlyDistribution[parseInt(hour)] += count as number
    })
  })
  
  return hourlyDistribution
}

/**
 * Calcula distribución por días
 */
function calculateDailyDistribution(volumeStats: any[]): Record<string, number> {
  const dailyDistribution: Record<string, number> = {}
  
  volumeStats.forEach(agent => {
    Object.entries(agent.metrics.threadsByDay).forEach(([day, count]) => {
      dailyDistribution[day] = (dailyDistribution[day] || 0) + (count as number)
    })
  })
  
  return dailyDistribution
}
