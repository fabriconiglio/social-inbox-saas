"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createTemplate } from "@/app/actions/templates"
import { toast } from "sonner"
import { VariableValidation } from "./variable-validation"
import { FileText, MessageSquare, Image, Video, File } from "lucide-react"

const CreateTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  channelType: z.enum(["whatsapp", "instagram", "facebook", "tiktok", "twitter", "telegram"]),
  templateType: z.enum(["text", "media", "interactive"]),
  content: z.string().min(1, "El contenido es requerido"),
  variables: z.array(z.string()).optional(),
  approvedTag: z.string().optional()
})

type CreateTemplateForm = z.infer<typeof CreateTemplateSchema>

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  tenantId: string
  initialData?: any
}

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-800" },
  { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-800" },
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-800" },
  { value: "tiktok", label: "TikTok", color: "bg-black text-white" },
  { value: "twitter", label: "Twitter", color: "bg-sky-100 text-sky-800" },
  { value: "telegram", label: "Telegram", color: "bg-blue-100 text-blue-800" }
]

const TEMPLATE_TYPES = [
  { 
    value: "text", 
    label: "Texto", 
    description: "Mensaje de texto simple",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-800"
  },
  { 
    value: "media", 
    label: "Multimedia", 
    description: "Imagen, video o documento",
    icon: Image,
    color: "bg-purple-100 text-purple-800"
  },
  { 
    value: "interactive", 
    label: "Interactivo", 
    description: "Botones o listas",
    icon: FileText,
    color: "bg-orange-100 text-orange-800"
  }
]

const APPROVAL_STATUS = [
  { value: "DRAFT", label: "Borrador", color: "bg-gray-100 text-gray-800" },
  { value: "PENDING", label: "Pendiente", color: "bg-orange-100 text-orange-800" },
  { value: "APPROVED", label: "Aprobada", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rechazada", color: "bg-red-100 text-red-800" }
]

export function CreateTemplateDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  tenantId,
  initialData 
}: CreateTemplateDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [variables, setVariables] = useState<string[]>([])
  const [newVariable, setNewVariable] = useState("")

  const form = useForm<CreateTemplateForm>({
    resolver: zodResolver(CreateTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      channelType: initialData?.channelType || "whatsapp",
      templateType: "text",
      content: "",
      variables: [],
      approvedTag: "DRAFT"
    }
  })

  const templateType = form.watch("templateType")
  const content = form.watch("content")

  const addVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      const updated = [...variables, newVariable.trim()]
      setVariables(updated)
      form.setValue("variables", updated)
      setNewVariable("")
    }
  }

  const removeVariable = (variable: string) => {
    const updated = variables.filter(v => v !== variable)
    setVariables(updated)
    form.setValue("variables", updated)
  }

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    if (matches) {
      return matches.map(match => match.replace(/[{}]/g, ''))
    }
    return []
  }

  const onSubmit = async (data: CreateTemplateForm) => {
    try {
      setSubmitting(true)
      
      // Construir contentJSON basado en el tipo de plantilla
      let contentJSON: any = {
        type: data.templateType,
        content: data.content
      }

      if (data.templateType === "text") {
        contentJSON = {
          type: "text",
          text: data.content,
          variables: variables
        }
      } else if (data.templateType === "media") {
        contentJSON = {
          type: "media",
          text: data.content,
          mediaType: "image", // Por defecto, se puede cambiar
          variables: variables
        }
      } else if (data.templateType === "interactive") {
        contentJSON = {
          type: "interactive",
          text: data.content,
          buttons: [], // Se puede expandir para incluir botones
          variables: variables
        }
      }

      const result = await createTemplate({
        tenantId,
        channelType: data.channelType,
        name: data.name,
        contentJSON,
        approvedTag: data.approvedTag
      })

      if (result.success) {
        toast.success("Plantilla creada exitosamente")
        form.reset()
        setVariables([])
        onSuccess()
      } else {
        toast.error(result.error || "Error al crear plantilla")
      }
    } catch (error) {
      console.error("[Create Template] Error:", error)
      toast.error("Error al crear plantilla")
    } finally {
      setSubmitting(false)
    }
  }

  const handleContentChange = (value: string) => {
    form.setValue("content", value)
    // Extraer variables automáticamente del texto
    const extractedVars = extractVariables(value)
    if (extractedVars.length > 0) {
      const uniqueVars = [...new Set([...variables, ...extractedVars])]
      setVariables(uniqueVars)
      form.setValue("variables", uniqueVars)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Plantilla</DialogTitle>
          <DialogDescription>
            Crea una nueva plantilla de mensaje para el canal seleccionado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="validation">Validación</TabsTrigger>
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la plantilla</FormLabel>
                        <FormControl>
                          <Input placeholder="ej: bienvenida_cliente" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nombre único para identificar la plantilla
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar canal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CHANNEL_TYPES.map(channel => (
                              <SelectItem key={channel.value} value={channel.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={channel.color}>
                                    {channel.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="templateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de plantilla</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TEMPLATE_TYPES.map(type => {
                              const Icon = type.icon
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {type.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approvedTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de aprobación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPROVAL_STATUS.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido del mensaje</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Escribe el contenido de la plantilla. Usa {{variable}} para variables dinámicas."
                          className="min-h-[200px]"
                          {...field}
                          onChange={(e) => handleContentChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Usa llaves dobles para variables: {"{{nombre}}"}, {"{{fecha}}"}, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Variables */}
                <div className="space-y-3">
                  <Label>Variables detectadas</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar variable manualmente"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                    />
                    <Button type="button" onClick={addVariable} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {variables.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                          {variable}
                          <button
                            type="button"
                            onClick={() => removeVariable(variable)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <VariableValidation
                  templateText={form.watch("content") || ""}
                  onValidationChange={(isValid, errors) => {
                    // Aquí podrías manejar el estado de validación
                  }}
                  onPreviewChange={(preview) => {
                    // Actualizar preview si es necesario
                  }}
                  showPreview={false}
                  showSuggestions={true}
                />
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vista Previa</CardTitle>
                    <CardDescription>
                      Así se verá la plantilla en el canal seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={CHANNEL_TYPES.find(c => c.value === form.watch("channelType"))?.color}>
                          {CHANNEL_TYPES.find(c => c.value === form.watch("channelType"))?.label}
                        </Badge>
                        <Badge variant="outline">
                          {TEMPLATE_TYPES.find(t => t.value === templateType)?.label}
                        </Badge>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="font-medium mb-2">{form.watch("name")}</div>
                        <div className="text-sm whitespace-pre-wrap">
                          {content || "Escribe el contenido para ver la vista previa..."}
                        </div>
                        {variables.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Variables:</div>
                            <div className="flex flex-wrap gap-1">
                              {variables.map((variable) => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creando..." : "Crear Plantilla"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
