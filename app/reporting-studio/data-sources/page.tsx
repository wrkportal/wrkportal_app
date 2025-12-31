'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUploadDialog } from '@/components/reporting-studio/file-upload-dialog'
import { FileList } from '@/components/reporting-studio/file-list'
import { DatabaseConnectionDialog } from '@/components/reporting-studio/database-connection-dialog'
import { DatabaseConnectionList } from '@/components/reporting-studio/database-connection-list'
import { Upload, Database, FileStack } from 'lucide-react'

export default function DataSourcesPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [dbConnectionDialogOpen, setDbConnectionDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = () => {
    // Trigger refresh of file list
    setRefreshKey(prev => prev + 1)
  }

  const handleDbConnectionSuccess = () => {
    // Trigger refresh of database connections list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground mt-2">
            Upload files or connect to databases to start building reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDbConnectionDialogOpen(true)}>
            <Database className="h-4 w-4 mr-2" />
            Connect Database
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files" className="gap-2">
            <FileStack className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="databases" className="gap-2">
            <Database className="h-4 w-4" />
            Databases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <FileList key={refreshKey} />
        </TabsContent>

        <TabsContent value="databases" className="space-y-4">
          <DatabaseConnectionList key={refreshKey} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
      <DatabaseConnectionDialog
        open={dbConnectionDialogOpen}
        onClose={() => setDbConnectionDialogOpen(false)}
        onSuccess={handleDbConnectionSuccess}
      />
    </div>
  )
}

