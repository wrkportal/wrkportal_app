'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Database,
  Key,
  Link2,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchemaViewerDialogProps {
  open: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

interface ColumnDefinition {
  columnName: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
  description?: string
  sampleValues?: any[]
}

interface DetectedSchema {
  columns: ColumnDefinition[]
  primaryKeys?: string[]
  relationships?: Array<{
    fromColumn: string
    toColumn: string
    type: string
    confidence: number
  }>
  dataQuality?: {
    completeness: number
    uniqueness: number
    validity: number
    consistency: number
  }
  columnDescriptions?: Record<string, string>
}

export function SchemaViewerDialog({ open, onClose, fileId, fileName }: SchemaViewerDialogProps) {
  const [schema, setSchema] = useState<DetectedSchema | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && fileId) {
      fetchSchema()
    }
  }, [open, fileId])

  const fetchSchema = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/reporting-studio/files/${fileId}/schema`)
      
      if (!response.ok) {
        throw new Error('Failed to load schema')
      }

      const result = await response.json()
      setSchema(result.schema)
    } catch (err: any) {
      setError(err.message || 'Failed to load schema')
    } finally {
      setIsLoading(false)
    }
  }

  const getDataTypeColor = (dataType: string) => {
    const colors: Record<string, string> = {
      integer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      decimal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      date: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      boolean: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      string: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    }
    return colors[dataType] || colors.string
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Schema: {fileName}</DialogTitle>
          <DialogDescription>
            Detected schema and data quality metrics
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : !schema ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No schema data available</p>
          </div>
        ) : (
          <Tabs defaultValue="columns" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="quality">Data Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="columns" className="space-y-4">
              <ScrollArea className="h-[500px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column Name</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Nullable</TableHead>
                      <TableHead>Primary Key</TableHead>
                      <TableHead>Sample Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.columns.map((column, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{column.columnName}</TableCell>
                        <TableCell>
                          <Badge className={getDataTypeColor(column.dataType)}>
                            {column.dataType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {column.isNullable ? (
                            <Badge variant="outline">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {column.isPrimaryKey && (
                            <Key className="h-4 w-4 text-yellow-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          {column.sampleValues && column.sampleValues.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {column.sampleValues.slice(0, 3).map((val, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {String(val).substring(0, 20)}
                                </Badge>
                              ))}
                              {column.sampleValues.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{column.sampleValues.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="relationships" className="space-y-4">
              {schema.relationships && schema.relationships.length > 0 ? (
                <ScrollArea className="h-[500px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From Column</TableHead>
                        <TableHead>To Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schema.relationships.map((rel, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{rel.fromColumn}</TableCell>
                          <TableCell>{rel.toColumn}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rel.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              rel.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            )}>
                              {formatPercentage(rel.confidence)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No relationships detected</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              {schema.dataQuality ? (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completeness
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(schema.dataQuality.completeness)}
                      </div>
                      <CardDescription>
                        Percentage of non-null values
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Uniqueness
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(schema.dataQuality.uniqueness)}
                      </div>
                      <CardDescription>
                        Percentage of unique values
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Validity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(schema.dataQuality.validity)}
                      </div>
                      <CardDescription>
                        Percentage of valid values
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Consistency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(schema.dataQuality.consistency)}
                      </div>
                      <CardDescription>
                        Overall consistency score
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No quality metrics available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

