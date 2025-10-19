"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, TrendingUp, Clock, MessageSquare, CheckCircle2, Users, Star } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AgentRankingChartProps {
  agents: Array<{
    position: number
    agent: {
      id: string
      name: string
      email: string
    }
    metrics: {
      totalThreads: number
      openThreads: number
      closedThreads: number
      totalMessages: number
      inboundMessages: number
      outboundMessages: number
      avgFirstResponseTime: number
      avgResolutionTime: number
      resolutionRate: number
      productivity: number
      avgMessageLength: number
      score: number
    }
    trend: 'top' | 'good' | 'average'
  }>
  summary: {
    totalAgents: number
    avgScore: number
    topPerformers: any[]
    needsImprovement: any[]
  }
  categories: {
    byScore: any[]
    byThreads: any[]
    byResolutionRate: any[]
    byResponseTime: any[]
  }
  title: string
  description: string
}

export function AgentRankingChart({
  agents,
  summary,
  categories,
  title,
  description,
}: AgentRankingChartProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'top': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'average': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}m`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round((hours % 24) * 10) / 10
    return `${days}d ${remainingHours}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ranking" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ranking">Ranking General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="speed">Velocidad</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-4">
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.agent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPositionIcon(agent.position)}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{agent.agent.name}</h4>
                      <Badge variant="outline" className={getTrendColor(agent.trend)}>
                        {agent.trend === 'top' ? 'Top' : agent.trend === 'good' ? 'Bueno' : 'Promedio'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.agent.email}</p>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(agent.metrics.score)}`}>
                      {agent.metrics.score.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Puntuación</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-3">
              {categories.byThreads.slice(0, 10).map((agent, index) => (
                <div key={agent.agent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{agent.agent.name}</h4>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {agent.metrics.totalThreads} threads
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {agent.metrics.resolutionRate.toFixed(1)}% resolución
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {agent.metrics.totalThreads}
                    </div>
                    <div className="text-xs text-muted-foreground">Threads</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="speed" className="space-y-4">
            <div className="space-y-3">
              {categories.byResponseTime.slice(0, 10).map((agent, index) => (
                <div key={agent.agent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{agent.agent.name}</h4>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {formatTime(agent.metrics.avgFirstResponseTime)} primera respuesta
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatHours(agent.metrics.avgResolutionTime)} resolución
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatTime(agent.metrics.avgFirstResponseTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">Primera respuesta</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {/* Top Performers */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Performers
              </h3>
              <div className="grid gap-3">
                {summary.topPerformers.map((agent, index) => (
                  <div key={agent.agent.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(agent.position)}
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{agent.agent.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {agent.metrics.totalThreads} threads • {agent.metrics.resolutionRate.toFixed(1)}% resolución
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {agent.metrics.score.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Improvement */}
            {summary.needsImprovement.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Necesitan Mejora
                </h3>
                <div className="grid gap-3">
                  {summary.needsImprovement.map((agent) => (
                    <div key={agent.agent.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-orange-600">#{agent.position}</span>
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{agent.agent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.metrics.totalThreads} threads • {agent.metrics.resolutionRate.toFixed(1)}% resolución
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {agent.metrics.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Agentes</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.totalAgents}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Puntuación Promedio</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.avgScore.toFixed(1)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Top Performers</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.topPerformers.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
