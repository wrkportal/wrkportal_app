/**
 * Semantic Search Service using Embeddings
 */

import { generateEmbedding, generateEmbeddings } from '../openai-service'
import { Project, Task, Comment } from '@/types'

interface SearchableItem {
  id: string
  type: 'project' | 'task' | 'comment' | 'document'
  title: string
  content: string
  metadata?: Record<string, any>
  embedding?: number[]
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Convert project to searchable item
 */
export function projectToSearchable(project: Project): SearchableItem {
  return {
    id: project.id,
    type: 'project',
    title: project.name,
    content: `${project.name} ${project.description || ''} ${project.tags.join(' ')}`,
    metadata: {
      status: project.status,
      ragStatus: project.ragStatus,
      progress: project.progress,
      managerId: project.managerId,
    },
  }
}

/**
 * Convert task to searchable item
 */
export function taskToSearchable(task: Task): SearchableItem {
  return {
    id: task.id,
    type: 'task',
    title: task.title,
    content: `${task.title} ${task.description || ''} ${task.tags.join(' ')}`,
    metadata: {
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
    },
  }
}

/**
 * Generate embeddings for searchable items
 */
export async function generateItemEmbeddings(
  items: SearchableItem[]
): Promise<SearchableItem[]> {
  const texts = items.map(item => `${item.title}\n${item.content}`)
  const embeddings = await generateEmbeddings(texts)

  return items.map((item, idx) => ({
    ...item,
    embedding: embeddings[idx],
  }))
}

/**
 * Perform semantic search
 */
export async function semanticSearch(
  query: string,
  items: SearchableItem[],
  topK: number = 10
): Promise<Array<SearchableItem & { score: number }>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)

  // Calculate similarity scores
  const results = items
    .filter(item => item.embedding) // Only items with embeddings
    .map(item => ({
      ...item,
      score: cosineSimilarity(queryEmbedding, item.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return results
}

/**
 * Hybrid search: Combine semantic and keyword search
 */
export async function hybridSearch(
  query: string,
  items: SearchableItem[],
  topK: number = 10
): Promise<Array<SearchableItem & { score: number; semanticScore: number; keywordScore: number }>> {
  // Semantic search
  const semanticResults = await semanticSearch(query, items, topK * 2)

  // Keyword search
  const queryLower = query.toLowerCase()
  const keywordResults = items.map(item => {
    const titleMatch = item.title.toLowerCase().includes(queryLower) ? 1.0 : 0
    const contentMatch = item.content.toLowerCase().includes(queryLower) ? 0.5 : 0
    const keywordScore = titleMatch + contentMatch

    return {
      ...item,
      keywordScore,
    }
  })

  // Combine results
  const combinedResults = new Map<string, any>()

  semanticResults.forEach(result => {
    combinedResults.set(result.id, {
      ...result,
      semanticScore: result.score,
      keywordScore: 0,
    })
  })

  keywordResults.forEach(result => {
    if (combinedResults.has(result.id)) {
      const existing = combinedResults.get(result.id)
      existing.keywordScore = result.keywordScore
    } else if (result.keywordScore > 0) {
      combinedResults.set(result.id, {
        ...result,
        semanticScore: 0,
        keywordScore: result.keywordScore,
      })
    }
  })

  // Calculate final score: 70% semantic + 30% keyword
  const finalResults = Array.from(combinedResults.values())
    .map(result => ({
      ...result,
      score: result.semanticScore * 0.7 + result.keywordScore * 0.3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return finalResults
}

/**
 * Find similar items based on an existing item
 */
export async function findSimilarItems(
  item: SearchableItem,
  allItems: SearchableItem[],
  topK: number = 5
): Promise<Array<SearchableItem & { score: number }>> {
  if (!item.embedding) {
    throw new Error('Item must have an embedding')
  }

  const results = allItems
    .filter(i => i.id !== item.id && i.embedding) // Exclude the item itself
    .map(i => ({
      ...i,
      score: cosineSimilarity(item.embedding!, i.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return results
}

/**
 * Cluster items using k-means on embeddings (simplified)
 */
export function clusterItems(
  items: SearchableItem[],
  numClusters: number = 5
): Map<number, SearchableItem[]> {
  // This is a simplified clustering - in production, use a proper k-means implementation
  const clusters = new Map<number, SearchableItem[]>()

  // Initialize clusters
  for (let i = 0; i < numClusters; i++) {
    clusters.set(i, [])
  }

  // Assign items to clusters based on simple hashing
  // In production, use proper k-means clustering
  items.forEach((item, idx) => {
    const clusterIdx = idx % numClusters
    clusters.get(clusterIdx)!.push(item)
  })

  return clusters
}

