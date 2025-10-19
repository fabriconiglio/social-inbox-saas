"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface HourlyData {
  hour: number
  inbound: number
  outbound: number
  total: number
}

interface HourlyChartProps {
  data: HourlyData[]
  title?: string
  description?: string
}

export function HourlyChart({ 
  data, 
  title = "Mensajes por Hora del Día",
  description = "Distribución de mensajes entrantes y salientes por hora"
}: HourlyChartProps) {
  // Formatear datos para el gráfico
  const chartData = data.map(item => ({
    hour: `${item.hour.toString().padStart(2, '0')}:00`,
    hourNumber: item.hour,
    entrantes: item.inbound,
    salientes: item.outbound,
    total: item.total
  }))

  // Encontrar el pico de actividad
  const maxHour = data.reduce((max, item) => 
    item.total > data[max].total ? item.hour : max, 0
  )

  const maxActivity = data[maxHour].total

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {maxActivity > 0 && (
            <span className="block mt-1 text-sm text-muted-foreground">
              Pico de actividad: {maxHour.toString().padStart(2, '0')}:00 ({maxActivity} mensajes)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value, 
                  name === 'entrantes' ? 'Mensajes Entrantes' : 
                  name === 'salientes' ? 'Mensajes Salientes' : 'Total'
                ]}
                labelFormatter={(label) => `Hora: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="entrantes" 
                fill="#8884d8" 
                name="Entrantes"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="salientes" 
                fill="#82ca9d" 
                name="Salientes"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estadísticas adicionales */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.inbound, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Entrantes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, item) => sum + item.outbound, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Salientes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {data.reduce((sum, item) => sum + item.total, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Mensajes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
