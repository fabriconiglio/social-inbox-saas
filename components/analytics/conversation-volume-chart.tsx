"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { MessageSquare, Users, TrendingUp, Clock, Activity, Target, Zap } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ConversationVolumeChartProps {
  agents: Array<{
    agent: {
      id: string
      name: string
      email: string
    }
    metrics: {
      totalThreads: number
      openThreads: number
      pendingThreads: number
      closedThreads: number
      totalMessages: number
      inboundMessages: number
      outboundMessages: number
      avgMessagesPerThread: number
      avgThreadDuration: number
      productivity: number
      threadsByDay: Record<string, number>
      threadsByHour: Record<number, number>
      threadsByStatus: Record<string, number>
    }
  }>
  summary: {
    totalAgents: number
    totalThreads: number
    totalMessages: number
    avgThreadsPerAgent: number
    avgMessagesPerThread: number
  }
  topPerformers: {
    byVolume: any[]
    byMessages: any[]
    byProductivity: any[]
  }
  distribution: {
    byStatus: {
      open: number
      pending: number
      closed: number
    }
    byHour: Record<number, number>
    byDay: Record<string, number>
  }
  title: string
  description: string
}

export function ConversationVolumeChart({
  agents,
  summary,
  topPerformers,
  distribution,
  title,
  description,
}: ConversationVolumeChartProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Preparar datos para gráficos
  const volumeData = agents.map(agent => ({
    name: agent.agent.name.split(' ')[0], // Solo primer nombre
    threads: agent.metrics.totalThreads,
    messages: agent.metrics.totalMessages,
    productivity: agent.metrics.productivity,
    avgDuration: agent.metrics.avgThreadDuration
  }))

  const hourlyData = Object.entries(distribution.byHour).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count,
    hourNum: parseInt(hour)
  })).sort((a, b) => a.hourNum - b.hourNum)

  const statusData = [
    { name: 'Abiertas', value: distribution.byStatus.open, color: '#FF6B6B' },
    { name: 'Pendientes', value: distribution.byStatus.pending, color: '#4ECDC4' },
    { name: 'Cerradas', value: distribution.byStatus.closed, color: '#45B7D1' }
  ]

  const dailyData = Object.entries(distribution.byDay)
    .map(([day, count]) => ({
      day: format(new Date(day), 'dd/MM', { locale: es }),
      count,
      fullDate: day
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

  const formatTime = (hours: number) => {
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
          <MessageSquare className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="agents">Por Agente</TabsTrigger>
            <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
            <TabsTrigger value="distribution">Distribución</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Total Threads</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.totalThreads}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Mensajes</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.totalMessages}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Promedio/Agente</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{summary.avgThreadsPerAgent}</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="grid gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Performers por Volumen
                </h3>
                <div className="grid gap-3">
                  {topPerformers.byVolume.map((agent, index) => (
                    <div key={agent.agent.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{agent.agent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.metrics.totalThreads} threads • {agent.metrics.totalMessages} mensajes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {agent.metrics.totalThreads}
                        </div>
                        <div className="text-xs text-muted-foreground">Threads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Top Performers por Productividad
                </h3>
                <div className="grid gap-3">
                  {topPerformers.byProductivity.map((agent, index) => (
                    <div key={agent.agent.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{agent.agent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.metrics.productivity.toFixed(1)} threads/día • {agent.metrics.avgThreadDuration.toFixed(1)}h duración
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {agent.metrics.productivity.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Threads/día</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="space-y-3">
              {agents.map((agent) => (
                <Card key={agent.agent.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {agent.agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{agent.agent.name}</h4>
                        <p className="text-sm text-muted-foreground">{agent.agent.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{agent.metrics.totalThreads}</div>
                        <div className="text-xs text-muted-foreground">Threads</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{agent.metrics.totalMessages}</div>
                        <div className="text-xs text-muted-foreground">Mensajes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{agent.metrics.productivity.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Threads/día</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Abiertas:</span>
                      <span className="ml-2 font-medium">{agent.metrics.openThreads}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pendientes:</span>
                      <span className="ml-2 font-medium">{agent.metrics.pendingThreads}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cerradas:</span>
                      <span className="ml-2 font-medium">{agent.metrics.closedThreads}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duración promedio:</span>
                      <span className="ml-2 font-medium">{formatTime(agent.metrics.avgThreadDuration)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Distribución por Hora del Día</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Distribución por Día</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Distribución por Estado</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Volumen por Agente</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="threads" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Mensajes por Agente</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
