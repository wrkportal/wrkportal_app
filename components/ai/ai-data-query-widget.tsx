'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'
// Reporting Studio removed - AI Data Query Widget disabled

export function AIDataQueryWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        title="Ask questions about your data"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Ask Questions About Your Data
            </DialogTitle>
            <DialogDescription>
              Get insights from your data by asking questions in plain English. Only data-related questions are supported.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              AI Data Query feature is currently unavailable. Reporting Studio has been removed.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

